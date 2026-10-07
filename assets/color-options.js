(function () {
  "use strict";
  function rgb(color) {
    var canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    var context = canvas.getContext("2d", { willReadFrequently: true });
    context.fillStyle = color;
    context.fillRect(0, 0, 1, 1);
    return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
  }
  function luminance(color) {
    return rgb(color).map(function (channel) { var v = channel / 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (sum, v, i) { return sum + v * [0.2126, 0.7152, 0.0722][i]; }, 0);
  }
  function contrast(a, b) { var x = luminance(a), y = luminance(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function hex(color) { return "#" + rgb(color).map(function (c) { return c.toString(16).padStart(2, "0"); }).join(""); }
  function generate(accent, background) {
    var colors = [{ label: "Theme", color: hex(accent) }];
    if (!CSS.supports("color", "oklch(from red l c h)")) return colors;
    [0, -30, 30, 150, 180, 210].forEach(function (offset, index) {
      var preferred = luminance(background) < 0.25 ? 0.72 : 0.45;
      for (var step = 0; step < 35; step++) {
        var lightness = Math.max(0.1, Math.min(0.9, preferred + (step % 2 ? -1 : 1) * Math.ceil(step / 2) * 0.025));
        var color = hex("oklch(from " + accent + " " + lightness + " clamp(0.035, c, 0.14) calc(h + " + offset + "))");
        if (contrast(color, background) >= 4.5) {
          if (!colors.some(function (entry) { return entry.color === color; })) colors.push({ label: ["Soft", "Related I", "Related II", "Split I", "Complement", "Split II"][index], color: color });
          break;
        }
      }
    });
    return colors;
  }
  window.DGAppearanceColors = { generate: generate, contrast: contrast };
})();
