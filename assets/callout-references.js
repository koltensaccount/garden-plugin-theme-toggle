(function () {
  "use strict";

  function revealTargetCallout(hash) {
    if (!hash || hash.length < 2) return;
    try {
      var id = decodeURIComponent(hash.slice(1));
      var target = document.getElementById(id);
      if (!target) return;

      var callout = target.classList.contains("callout") ? target : target.closest(".callout");
      if (callout && callout.classList.contains("is-collapsed")) {
        callout.classList.remove("is-collapsed");
      }
    } catch (_) {}
  }

  function onHash() {
    revealTargetCallout(location.hash);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onHash);
  } else {
    onHash();
  }

  window.addEventListener("hashchange", onHash);

  document.addEventListener(
    "click",
    function (event) {
      var link = event.target.closest("a[href*='#']");
      if (!link) return;
      try {
        var url = new URL(link.href, location.href);
        if (url.origin === location.origin && url.pathname === location.pathname && url.hash) {
          revealTargetCallout(url.hash);
        }
      } catch (_) {}
    },
    true
  );
})();
