/* Long inline formulae keep natural math sizing and scroll only when necessary.
   Obsidian already owns its MathJax layout; this adapts the garden's SVG output. */
(function () {
  function init() {
    const observed = new Set();
    const originals = new WeakMap();
    function fit(block) {
      if (!block.isConnected) { resize.unobserve(block); observed.delete(block); return; }
      const style = getComputedStyle(block);
      const available = block.clientWidth - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0);
      for (const math of block.querySelectorAll('mjx-container:not([display="true"])')) {
        const graphic = math.querySelector('svg, mjx-math');
        const wide = available > 0 && graphic && graphic.getBoundingClientRect().width > available + 1;
        if (wide && !originals.has(math)) originals.set(math, { tabindex: math.getAttribute('tabindex'), label: math.getAttribute('aria-label') });
        math.classList.toggle('folio-inline-math-scroll', Boolean(wide));
        if (math.getAttribute('class') === '') math.removeAttribute('class');
        if (wide) { math.setAttribute('tabindex', '0'); math.setAttribute('aria-label', 'Scrollable equation'); }
        else if (originals.has(math)) {
          const before = originals.get(math);
          for (const [name, value] of [['tabindex', before.tabindex], ['aria-label', before.label]]) {
            if (value === null) math.removeAttribute(name); else math.setAttribute(name, value);
          }
          originals.delete(math);
        }
      }
    }
    const resize = new ResizeObserver(entries => { for (const entry of entries) fit(entry.target); });
    function scan() {
      for (const block of observed) if (!block.isConnected) { resize.unobserve(block); observed.delete(block); }
      for (const math of document.querySelectorAll('mjx-container:not([display="true"])')) {
        const block = math.closest('p, li, td, th, .callout-title-inner, h1, h2, h3, h4');
        if (block && !observed.has(block)) { observed.add(block); resize.observe(block); fit(block); }
      }
    }
    scan();
    let pending = false;
    const mutations = new MutationObserver(() => {
      if (pending) return;
      pending = true;
      queueMicrotask(() => { pending = false; scan(); });
    });
    mutations.observe(document.body, { childList: true, subtree: true });
    document.fonts?.ready.then(() => { for (const block of observed) fit(block); });
    window.addEventListener('pagehide', event => { if (!event.persisted) { mutations.disconnect(); resize.disconnect(); observed.clear(); } });
  }
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init, { once: true });
})();
