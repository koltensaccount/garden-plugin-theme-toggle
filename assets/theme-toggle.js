(function () {
  "use strict";
  function boot() {
    if (document.getElementById("dg-appearance-control")) return;
    var config = window.DG_THEME_TOGGLE || {};
    var support = "both";
    var preference = { size: 0, spacing: 0, font: "Theme", accent: 0, customColor: null };
    var storageKey = "dgAppearanceReading.preferences";
    try {
      var saved = config.rememberPreferences !== false && JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved && typeof saved === "object") {
        preference.size = Number.isFinite(saved.size) && saved.size >= 12 ? Math.min(26, saved.size) : 0;
        preference.spacing = Number.isFinite(saved.spacing) && saved.spacing >= 1.2 ? Math.min(2, saved.spacing) : 0;
        preference.font = ["Theme", "Sans serif", "Serif"].includes(saved.font) ? saved.font : "Theme";
        preference.customColor = typeof saved.customColor === "string" && /^#[0-9a-f]{6}$/i.test(saved.customColor) ? saved.customColor.toLowerCase() : null;
        preference.accent = saved.accent === "custom" && preference.customColor ? "custom" : Number.isInteger(saved.accent) ? Math.max(0, Math.min(6, saved.accent)) : 0;
      }
    } catch (_) {}
    var colorsManaged = ["--interactive-accent", "--interactive-accent-hover", "--text-accent", "--text-accent-hover", "--link-color", "--link-color-hover", "--text-on-accent"];
    var original = new Map(colorsManaged.concat(["--dg-content-font-size", "--dg-content-line-height"]).map(function (key) { return [key, document.body.style.getPropertyValue(key)]; }));
    var content = document.querySelector("main.content:not(.canvas-page)");
    var originalFont = content && content.style.fontFamily;
    var button = document.createElement("button");
    button.type = "button";
    button.className = "dg-theme-toggle";
    button.title = "Appearance & Reading";
    button.setAttribute("aria-label", "Appearance and reading preferences");
    button.innerHTML = '<i data-lucide="sliders-horizontal"></i><span aria-hidden="true">&#9881;</span>';
    window.DGNavTools.mount("dg-appearance-control", button);
    var dialog = document.createElement("dialog");
    dialog.className = "dg-appearance-dialog";
    dialog.setAttribute("aria-label", "Appearance and reading preferences");
    dialog.innerHTML = '<form method="dialog"><h2>Appearance & Reading</h2><label class="dg-appearance-mode"><span>Dark mode</span><input type="checkbox" role="switch" aria-label="Dark mode"></label><fieldset><legend>Accent</legend><div class="dg-appearance-swatches" role="group" aria-label="Theme-derived accent colors"></div></fieldset><label>Text size<span><input name="size" type="range" min="12" max="26" step="1"><output data-size></output></span></label><label>Line spacing<span><input name="spacing" type="range" min="1.2" max="2" step="0.1"><output data-spacing></output></span></label><label>Typeface<select name="font"><option>Theme</option><option>Sans serif</option><option>Serif</option></select></label><footer><button type="button" class="dg-appearance-reset">Theme defaults</button><button type="submit">Done</button></footer></form>';
    document.body.appendChild(dialog);
    var modeInput = dialog.querySelector('[role="switch"]');
    var size = dialog.querySelector('[name="size"]');
    var spacing = dialog.querySelector('[name="spacing"]');
    var font = dialog.querySelector('[name="font"]');
    var customSwatch = document.createElement("label");
    customSwatch.className = "dg-appearance-custom";
    customSwatch.innerHTML = '<i data-lucide="pipette"></i><span aria-hidden="true">+</span><input type="color" aria-label="Custom accent color">';
    var customInput = customSwatch.querySelector("input");
    function resetVariable(key) { var value = original.get(key); if (value) document.body.style.setProperty(key, value); else document.body.style.removeProperty(key); }
    function resolved(variable, fallback) {
      var probe = document.createElement("span");
      probe.style.setProperty("color", "var(" + variable + ", " + fallback + ")", "important");
      probe.hidden = true;
      document.body.appendChild(probe);
      var color = getComputedStyle(probe).color;
      probe.remove();
      return color;
    }
    function themeAccent() {
      var link = content && content.querySelector("a.internal-link");
      return link ? getComputedStyle(link).color : resolved("--link-color", "var(--text-accent, var(--color-accent, var(--interactive-accent, #777)))");
    }
    function detectSupport() {
      if (["both", "light", "dark"].includes(config.supportedModes)) return config.supportedModes;
      var modes = new Set();
      function inspect(rules) { Array.from(rules).forEach(function (rule) {
        if (rule.selectorText) {
          if (/\.theme-light(?![\w-])/.test(rule.selectorText)) modes.add("light");
          if (/\.theme-dark(?![\w-])/.test(rule.selectorText)) modes.add("dark");
        }
        try { if (rule.cssRules) inspect(rule.cssRules); } catch (_) {}
      }); }
      Array.from(document.styleSheets).forEach(function (sheet) { if (sheet.href && new URL(sheet.href, location.href).pathname.includes("/styles/_theme.")) try { inspect(sheet.cssRules); } catch (_) {} });
      return modes.size === 1 ? Array.from(modes)[0] : "both";
    }
    function save() { if (config.rememberPreferences !== false) try { localStorage.setItem(storageKey, JSON.stringify(preference)); } catch (_) {} }
    function apply(preserveSwatches) {
      colorsManaged.forEach(resetVariable);
      var colors = window.DGAppearanceColors.generate(themeAccent(), resolved("--background-primary", "white")).slice(0, 6);
      if (preference.accent >= colors.length) preference.accent = 0;
      var customColor = preference.customColor || colors[0].color;
      var selected = preference.accent === "custom" ? { color: customColor } : colors[preference.accent];
      if (preference.accent) {
        colorsManaged.slice(0, 6).forEach(function (key) { document.body.style.setProperty(key, selected.color); });
        document.body.style.setProperty("--text-on-accent", window.DGAppearanceColors.contrast(selected.color, "white") >= window.DGAppearanceColors.contrast(selected.color, "black") ? "white" : "black");
      }
      var swatches = dialog.querySelector(".dg-appearance-swatches");
      if (!preserveSwatches) {
        swatches.replaceChildren();
        colors.forEach(function (color, index) {
          var swatch = document.createElement("button");
          swatch.type = "button";
          swatch.className = "dg-appearance-swatch";
          swatch.style.setProperty("background-color", color.color, "important");
          swatch.title = color.label;
          swatch.setAttribute("aria-label", color.label + " accent");
          swatch.setAttribute("aria-pressed", String(index === preference.accent));
          swatch.addEventListener("click", function () { preference.accent = index; apply(); save(); dialog.querySelectorAll(".dg-appearance-swatch")[index].focus(); });
          swatches.appendChild(swatch);
        });
        swatches.appendChild(customSwatch);
      }
      swatches.querySelectorAll(".dg-appearance-swatch").forEach(function (swatch, index) { swatch.setAttribute("aria-pressed", String(index === preference.accent)); });
      customSwatch.style.setProperty("background-color", customColor, "important");
      customSwatch.style.setProperty("color", window.DGAppearanceColors.contrast(customColor, "white") >= window.DGAppearanceColors.contrast(customColor, "black") ? "white" : "black", "important");
      customSwatch.classList.toggle("dg-appearance-custom-selected", preference.accent === "custom");
      customSwatch.title = "Custom accent: " + customColor;
      customInput.value = customColor;
      customInput.setAttribute("aria-label", "Custom accent color" + (preference.accent === "custom" ? ", selected" : ""));
      if (preference.size) document.body.style.setProperty("--dg-content-font-size", preference.size + "px"); else resetVariable("--dg-content-font-size");
      if (preference.spacing) document.body.style.setProperty("--dg-content-line-height", preference.spacing); else resetVariable("--dg-content-line-height");
      if (content) content.style.fontFamily = preference.font === "Serif" ? 'Georgia, "Times New Roman", serif' : preference.font === "Sans serif" ? 'system-ui, sans-serif' : originalFont;
      size.value = String(preference.size || 18);
      spacing.value = String(preference.spacing || 1.5);
      font.value = preference.font;
      dialog.querySelector("[data-size]").textContent = preference.size ? preference.size + " px" : "Theme";
      dialog.querySelector("[data-spacing]").textContent = preference.spacing ? String(preference.spacing) : "Theme";
      dialog.querySelector(".dg-appearance-mode").hidden = support !== "both";
      modeInput.checked = document.body.classList.contains("theme-dark");
      document.dispatchEvent(new CustomEvent("dg:appearance-change"));
    }
    function setMode(next, persist) {
      document.body.classList.toggle("theme-light", next === "light");
      document.body.classList.toggle("theme-dark", next === "dark");
      document.body.style.colorScheme = next;
      if (persist && config.rememberMode !== false) try { localStorage.setItem("dgThemeToggle.mode", next); } catch (_) {}
      apply();
      document.dispatchEvent(new CustomEvent("dg:theme-change", { detail: { mode: next } }));
    }
    function initialize() {
      support = detectSupport();
      var next = document.body.classList.contains("theme-light") ? "light" : "dark";
      if (support !== "both") next = support;
      else if (config.rememberMode !== false) try { var savedMode = localStorage.getItem("dgThemeToggle.mode"); if (["light", "dark"].includes(savedMode)) next = savedMode; } catch (_) {}
      setMode(next, false);
    }
    button.addEventListener("click", function () { apply(); if (!dialog.open) dialog.showModal(); });
    modeInput.addEventListener("change", function () { if (support === "both") setMode(modeInput.checked ? "dark" : "light", true); });
    size.addEventListener("input", function () { preference.size = Number(size.value); apply(); save(); });
    spacing.addEventListener("input", function () { preference.spacing = Number(spacing.value); apply(); save(); });
    font.addEventListener("change", function () { preference.font = font.value; apply(); save(); });
    function chooseCustom() { preference.accent = "custom"; preference.customColor = customInput.value; apply(true); save(); }
    customInput.addEventListener("click", chooseCustom);
    customInput.addEventListener("input", chooseCustom);
    customInput.addEventListener("change", chooseCustom);
    dialog.querySelector(".dg-appearance-reset").addEventListener("click", function () { preference = { size: 0, spacing: 0, font: "Theme", accent: 0, customColor: preference.customColor }; apply(); save(); });
    window.addEventListener("storage", function (event) { if (event.key === "dgThemeToggle.mode" && config.rememberMode !== false && support === "both" && ["light", "dark"].includes(event.newValue)) setMode(event.newValue, false); });
    initialize();
    window.addEventListener("load", initialize, { once: true });
    if (window.lucide) window.lucide.createIcons();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
