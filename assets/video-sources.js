/* Generated from callout-links/src/video.js; do not edit this copy. */
(function () {
const videoSources = (() => { const module = { exports: {} };
'use strict';

// Rendering-only enhancement: the note remains one ordinary Markdown callout.
function parseVideoUrl(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
  const host = url.hostname.toLowerCase();
  let id;
  if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com'].includes(host)) {
    if (url.pathname === '/watch') id = url.searchParams.get('v');
    else id = url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)\/?$/)?.[1];
  } else if (['youtu.be', 'www.youtu.be'].includes(host)) {
    id = url.pathname.slice(1);
  }
  if (!id || !/^[\w-]{11}$/.test(id)) return null;
  const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
  const time = url.searchParams.get('start') || url.searchParams.get('t') || url.hash.match(/^#t=(.+)$/)?.[1];
  if (time && /^(?:\d+|(?:\d+h)?(?:\d+m)?(?:\d+s)?)$/.test(time)) {
    const seconds = /^\d+$/.test(time) ? Number(time) : [...time.matchAll(/(\d+)([hms])/g)].reduce((n, m) => n + Number(m[1]) * ({ h: 3600, m: 60, s: 1 })[m[2]], 0);
    if (Number.isSafeInteger(seconds) && seconds > 0) embed.searchParams.set('start', String(seconds));
  }
  return { id, embedUrl: embed.href, sourceUrl: url.href };
}

function createVideoEnhancer(setIcon) {
  const selector = '.callout:is([data-callout="video"], [data-callout="video-source"])';
  const records = new Map();
  let nextId = 0;

  function enhance(root) {
    // Release detached Live Preview blocks without retaining whole note DOMs.
    for (const [node, record] of records) {
      if (!node.isConnected) { record.cleanup(); records.delete(node); }
    }
    const nodes = [...(root.matches?.(selector) ? [root] : []), ...root.querySelectorAll(selector)];
    for (const callout of nodes) {
      const title = callout.querySelector(':scope > .callout-title');
      const link = title?.querySelector('.callout-title-inner a[href]');
      const parsed = link && parseVideoUrl(link.getAttribute('href'));
      const previous = records.get(callout);
      const signature = parsed && `${parsed.sourceUrl}\n${link.textContent}`;
      if (previous?.title === title && previous.signature === signature) continue;
      if (previous) { previous.cleanup(); records.delete(callout); }
      // Unsupported links remain normal callouts with their original links.
      if (!parsed) continue;
      const doc = callout.ownerDocument;
      const originalClass = callout.className;
      const titleAttrs = ['role', 'tabindex', 'aria-expanded', 'aria-controls', 'aria-label'].map(n => [n, title.getAttribute(n)]);
      const linkTabIndex = link.getAttribute('tabindex');
      let content = callout.querySelector(':scope > .callout-content');
      const createdContent = !content;
      if (!content) { content = doc.createElement('div'); content.className = 'callout-content'; callout.append(content); }
      const contentStyle = content.getAttribute('style');
      const contentId = content.getAttribute('id');
      const contentHidden = content.hidden;
      if (!content.id) content.id = `cl-video-content-${++nextId}`;
      let icon = title.querySelector(':scope > .callout-icon');
      const createdIcon = !icon;
      if (!icon) { icon = doc.createElement('div'); icon.className = 'callout-icon'; title.prepend(icon); setIcon(icon, 'play'); }
      let fold = title.querySelector(':scope > .callout-fold');
      const createdFold = !fold;
      if (!fold) { fold = doc.createElement('div'); fold.className = 'callout-fold'; title.append(fold); setIcon(fold, 'chevron-down'); }
      const player = doc.createElement('div'); player.className = 'cl-video-player'; content.append(player);
      // Existing explicit + / - folding remains supported. Plain [!video] folds by default.
      let expanded = callout.classList.contains('is-collapsible') && !callout.classList.contains('is-collapsed');
      callout.classList.add('is-collapsible', 'cl-video-ready');
      title.setAttribute('role', 'button'); title.tabIndex = 0;
      title.setAttribute('aria-controls', content.id);
      title.setAttribute('aria-label', `Video: ${link.textContent}`);
      link.tabIndex = -1;
      function render() {
        callout.classList.toggle('is-collapsed', !expanded);
        title.setAttribute('aria-expanded', String(expanded));
        content.hidden = !expanded;
        content.style.display = expanded ? 'block' : 'none';
        // No YouTube frame or network request until the user expands this source.
        if (expanded && !player.firstChild && !content.querySelector('iframe')) {
          const iframe = doc.createElement('iframe');
          iframe.src = parsed.embedUrl; iframe.title = link.textContent;
          iframe.width = '560'; iframe.height = '315'; iframe.loading = 'lazy';
          iframe.referrerPolicy = 'strict-origin-when-cross-origin';
          iframe.allow = 'encrypted-media; picture-in-picture; fullscreen';
          iframe.allowFullscreen = true;
          player.append(iframe);
        } else if (!expanded) {
          // Closing also stops playback and releases the player.
          player.replaceChildren();
        }
      }
      function click(event) {
        if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); event.stopImmediatePropagation(); expanded = !expanded; render();
      }
      function keydown(event) {
        if (!['Enter', ' '].includes(event.key)) return;
        event.preventDefault(); event.stopImmediatePropagation(); expanded = !expanded; render();
      }
      title.addEventListener('click', click, true);
      title.addEventListener('keydown', keydown, true);
      render();
      records.set(callout, { signature, title, cleanup() {
        title.removeEventListener('click', click, true); title.removeEventListener('keydown', keydown, true);
        player.remove(); if (createdFold) fold.remove(); if (createdIcon) icon.remove();
        callout.className = originalClass;
        for (const [name, value] of titleAttrs) value === null ? title.removeAttribute(name) : title.setAttribute(name, value);
        linkTabIndex === null ? link.removeAttribute('tabindex') : link.setAttribute('tabindex', linkTabIndex);
        if (createdContent) content.remove();
        else {
          contentStyle === null ? content.removeAttribute('style') : content.setAttribute('style', contentStyle);
          contentId === null ? content.removeAttribute('id') : content.setAttribute('id', contentId);
          content.hidden = contentHidden;
        }
      } });
    }
  }
  return { enhance, destroy() { for (const record of records.values()) record.cleanup(); records.clear(); } };
}

module.exports = { parseVideoUrl, createVideoEnhancer };

return module.exports; })();
function init() {
  const enhancer = videoSources.createVideoEnhancer((el) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'svg-icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '16'); svg.setAttribute('height', '16');
    svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', 'M6 9l6 6 6-6'); svg.append(path); el.append(svg);
  });
  enhancer.enhance(document.body);
  // Also cover notes inserted by garden panes/navigation, without rewriting Markdown.
  let pending = false;
  const observer = new MutationObserver(() => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; enhancer.enhance(document.body); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener('pagehide', () => { observer.disconnect(); enhancer.destroy(); }, { once: true });
}
if (document.readyState === 'complete') init();
else window.addEventListener('load', init, { once: true });
})();
