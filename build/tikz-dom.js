const { parseHTML } = require('linkedom');
const { document } = parseHTML('<html><body></body></html>');
const SVG_NS = 'http://www.w3.org/2000/svg';
let dark = false;
const palette = () => ({
  '--text-normal': dark ? '#eeeeee' : '#202124',
  '--text-muted': dark ? '#a8adb5' : '#62676e',
  '--background-primary': dark ? '#202124' : '#ffffff',
  '--background-modifier-border': dark ? '#565b63' : '#c4c9d0',
  '--font-text': 'Noto Sans',
});
function resolve(value) {
  let result = String(value || '');
  for (let n = 0; n < 8 && result.includes('var('); n++) {
    result = result.replace(/var\((--[\w-]+)(?:,\s*([^()]+))?\)/g, (_, key, fallback) => palette()[key] || fallback || '#808080');
  }
  return result;
}
function decorate(el, options = {}) {
  if (options.cls) el.setAttribute('class', options.cls);
  for (const [key, value] of Object.entries(options.attr || {})) el.setAttribute(key, value);
  el.setCssProps = props => { for (const [key, value] of Object.entries(props)) el.style.setProperty(key, value); };
  el.createDiv = opts => el.appendChild(createDiv(opts));
  if (el.localName === 'canvas') {
    // The upstream SVG export path only uses its canvas to validate font names.
    el.getContext = () => ({ font: '10px sans-serif' });
  }
  return el;
}
decorate(document.body);
const activeDocument = document;
const createSvg = (tag, opts) => decorate(document.createElementNS(SVG_NS, tag), opts);
function createEl(tag, opts) { return decorate(document.createElement(tag), opts); }
function createDiv(opts) { return createEl('div', opts); }
const getComputedStyle = el => ({
  getPropertyValue: key => palette()[key] || '',
  get color() { return resolve(el.style?.getPropertyValue('--etz-probe') || palette()['--text-normal']); },
});
const window = { devicePixelRatio: 1 };
const setDark = value => { dark = value; };
export { activeDocument, createSvg, createEl, createDiv, getComputedStyle, window, resolve, setDark };
