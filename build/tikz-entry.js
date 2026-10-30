const fs = require('node:fs');
const path = require('node:path');
const { initWasm, Resvg } = require('@resvg/resvg-wasm');
const { readBlock } = require(process.env.EASY_TIKZ_SOURCE + '/src/blockjson.ts');
const { SettingsManager } = require(process.env.EASY_TIKZ_SOURCE + '/src/settings.ts');
const { SVGRenderer } = require(process.env.EASY_TIKZ_SOURCE + '/src/renderer.ts');
const { SVG3DRenderer } = require(process.env.EASY_TIKZ_SOURCE + '/src/renderer3d.ts');
const dom = require('./tikz-dom');
let ready;
exports.prepare = () => ready || (ready = initWasm(fs.readFileSync(path.join(__dirname, 'resvg.wasm'))));
exports.render = function (source, dark = false, scale = 4) {
  if (source.length > 128000) throw new Error('Chart source exceeds 128 KB');
  const parsed = readBlock(source);
  if (typeof parsed === 'string') throw new Error(parsed);
  if (parsed.problems.length) throw new Error(parsed.problems.map(p => p.message).join('; '));
  const settings = SettingsManager.fromJSON(JSON.parse(JSON.stringify(parsed.data)));
  const math = settings.createMathContext({memo:false});
  const config = settings.toRendererConfig(math);
  if (![config.width, config.height].every(n => Number.isFinite(n) && n > 0 && n <= 2400)) throw new Error('Chart dimensions must be between 1 and 2400 pixels');
  if (config.width * config.height * scale * scale > 24000000) throw new Error('Chart export exceeds the 24 megapixel limit');
  dom.setDark(dark);
  let svg;
  if (config.is3D) {
    const renderer = new SVG3DRenderer();
    renderer.renderSvg(config, {math});
    svg = renderer.getElement().querySelector('svg');
  } else {
    svg = new SVGRenderer(config, {math, quality:'full'}).render();
  }
  if (!svg) throw new Error('Chart renderer returned no picture');
  // Math labels stay vector paths instead of being flattened to plain text.
  svg.querySelectorAll('foreignObject').forEach(fo => {
    const label = fo.querySelector('svg');
    if (!label) throw new Error('Chart label could not be exported');
    label.setAttribute('x', fo.getAttribute('x') || '0');
    label.setAttribute('y', fo.getAttribute('y') || '0');
    label.setAttribute('width', fo.getAttribute('width'));
    label.setAttribute('height', fo.getAttribute('height'));
    fo.replaceWith(label);
  });
  const background = svg.querySelector(':scope > rect');
  if (background?.getAttribute('fill')?.includes('--background-primary')) background.remove();
  for (const el of [svg, ...svg.querySelectorAll('*')]) {
    for (const attr of Array.from(el.attributes)) {
      if (attr.value.includes('var(')) el.setAttribute(attr.name, dom.resolve(attr.value));
    }
  }
  svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
  const renderer = new Resvg(svg.outerHTML, {
    fitTo:{mode:'width',value:Math.round(config.width * scale)},
    font:{fontBuffers:[fs.readFileSync(path.join(__dirname,'NotoSans-Regular.ttf'))],defaultFontFamily:'Noto Sans',loadSystemFonts:false},
  });
  let image;
  try {
    image=renderer.render();
    return {png:Buffer.from(image.asPng()),width:config.width,height:config.height};
  } finally { if(image)image.free();renderer.free(); }
};
