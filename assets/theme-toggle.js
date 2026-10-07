(function () {
  "use strict";
  var key = "dgThemeToggle.mode";
  function boot() {
    var nav = document.querySelector(".filetree-sidebar");
    if (!nav || nav.querySelector(".dg-theme-toggle")) return;
    var config = window.DG_THEME_TOGGLE || {};
    var support = config.supportedModes || "auto";
    var button = document.createElement("button");
    button.type = "button";
    button.className = "dg-theme-toggle";
    button.setAttribute("role", "switch");
    button.setAttribute("aria-label", "Dark mode");
    button.innerHTML = '<i data-lucide="sun-moon"></i><span aria-hidden="true">&#9680;</span>';

    var scroll = nav.querySelector(":scope > .dg-theme-nav-content");
    if (!scroll) {
      scroll = document.createElement("div");
      scroll.className = "dg-theme-nav-content";
      while (nav.firstChild) scroll.appendChild(nav.firstChild);
      nav.appendChild(scroll);
    }
    var footer = nav.querySelector(":scope > .dg-theme-nav-footer");
    if (!footer) {
      footer = document.createElement("div");
      footer.className = "dg-theme-nav-footer";
      nav.appendChild(footer);
    }
    footer.appendChild(button);
    nav.classList.add("dg-theme-nav");

    function detectSupport() {
      if (config.supportedModes && config.supportedModes !== "auto") return config.supportedModes;
      var modes = new Set();
      function inspect(rules) {
        Array.from(rules).forEach(function (rule) {
          if (rule.selectorText) {
            if (/\.theme-light(?![\w-])/.test(rule.selectorText)) modes.add("light");
            if (/\.theme-dark(?![\w-])/.test(rule.selectorText)) modes.add("dark");
          }
          try { if (rule.cssRules) inspect(rule.cssRules); } catch (_) {}
        });
      }
      Array.from(document.styleSheets).forEach(function (sheet) {
        // Base Obsidian CSS supports both; inspect only the installed theme.
        if (!sheet.href || !new URL(sheet.href, location.href).pathname.includes("/styles/_theme.")) return;
        try { inspect(sheet.cssRules); } catch (_) {}
      });
      return modes.size === 1 ? Array.from(modes)[0] : "both";
    }
    function mode() { return document.body.classList.contains("theme-light") ? "light" : "dark"; }
    function render() {
      button.disabled = support === "light" || support === "dark";
      button.hidden = button.disabled;
      button.setAttribute("aria-checked", String(mode() === "dark"));
      button.title = button.disabled ? "This theme supports " + support + " mode only" : "Switch to " + (mode() === "dark" ? "light" : "dark") + " mode";
    }
    function apply(next, persist) {
      document.body.classList.toggle("theme-light", next === "light");
      document.body.classList.toggle("theme-dark", next === "dark");
      document.body.style.colorScheme = next;
      if (persist && config.rememberMode !== false) {
        try { localStorage.setItem(key, next); } catch (_) {}
      }
      render();
      document.dispatchEvent(new CustomEvent("dg:theme-change", { detail: { mode: next } }));
    }
    function initialize() {
      support = detectSupport();
      var next = mode();
      if (support === "light" || support === "dark") next = support;
      else if (config.rememberMode !== false) {
        try {
          var saved = localStorage.getItem(key);
          if (saved === "light" || saved === "dark") next = saved;
        } catch (_) {}
      }
      apply(next, false);
    }
    button.addEventListener("click", function () {
      if (!button.disabled) apply(mode() === "dark" ? "light" : "dark", true);
    });
    window.addEventListener("storage", function (event) {
      if (config.rememberMode === false || support !== "both" || event.key !== key) return;
      if (event.newValue === "light" || event.newValue === "dark") apply(event.newValue, false);
    });
    initialize();
    window.addEventListener("load", initialize, { once: true });
    if (window.lucide) window.lucide.createIcons();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
