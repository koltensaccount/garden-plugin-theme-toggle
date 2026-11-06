/** Adapt Obsidian's same-line display equations to markdown-it block syntax.
 * Only the build input changes. Preserve TeX, surrounding prose, quote depth,
 * reference IDs, fenced examples and inline code exactly.
 */
function normalizeDisplayMathLayout(source) {
  const nl = source.includes('\r\n') ? '\r\n' : '\n';
  let fence = null, inDisplay = false;
  return source.split(/\r?\n/).map(line => {
    const match = line.match(/^((?: {0,3}>[ \t]?)*[ \t]*)(.*)$/);
    const [, prefix, content] = match;
    if (!prefix.includes('>') && /^(?: {4}|\t)/.test(line)) return line;
    const marker = content.match(/^(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return line;
    }
    if (marker) { fence = marker[1]; return line; }
    // Protect inline-code runs and escaped dollars before collecting delimiters.
    const delimiters = [];
    const tokens = /(`+)[\s\S]*?\1(?!`)|\\.|\$\$/g;
    for (const m of content.matchAll(tokens)) if (m[0] === '$$') delimiters.push(m.index);
    if (inDisplay) { if (delimiters.length % 2) inDisplay = false; return line; }
    if (delimiters.length % 2) { inDisplay = true; return line; }
    if (!delimiters.length) return line;
    // Already standalone display blocks need no adaptation.
    if (delimiters.length === 2 && !content.slice(0, delimiters[0]).trim() && !content.slice(delimiters[1] + 2).trim()) return line;
    const pieces = []; let from = 0;
    for (let i = 0; i < delimiters.length; i += 2) {
      const start = delimiters[i], end = delimiters[i + 1] + 2;
      const prose = content.slice(from, start);
      if (prose.trim()) pieces.push(prefix + prose);
      pieces.push(prefix, prefix + content.slice(start, end), prefix);
      from = end;
    }
    if (content.slice(from).trim()) pieces.push(prefix + content.slice(from));
    return pieces.join(nl);
  }).join(nl);
}
function displayMathLayout(md) {
  md.core.ruler.before('block', 'display-math-layout', state => {
    state.src = normalizeDisplayMathLayout(state.src);
  });
}
module.exports = { displayMathLayout, normalizeDisplayMathLayout };
