const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const renderer = require('./lib/easy-tikz-renderer.cjs');
const generated = new Map();
const FORMAT = 'easy-tikz-4.6.0-garden-1';

module.exports = {
  setupEleventy(config, context) {
    if (context.settings.renderEasyTikz === false) return;
    config.on('eleventy.before', async () => {
      generated.clear();
      await renderer.prepare();
    });
    config.on('eleventy.after', ({dir}) => {
      const output = path.resolve(dir.output, 'img', 'appearance-tikz');
      if (!generated.size) return;
      fs.mkdirSync(output,{recursive:true});
      for (const [name, file] of generated) fs.copyFileSync(file,path.join(output,name));
    });
  },
  setupMarkdown(md, context) {
    if (context.settings.renderEasyTikz === false) return;
    const original = md.renderer.rules.fence;
    const rawScale = Number(context.settings.tikzScale);
    const scale = Number.isFinite(rawScale) && rawScale >= 2 && rawScale <= 4 ? rawScale : 4;
    md.renderer.rules.fence = function (tokens, index, options, env, self) {
      const token = tokens[index];
      const language = token.info.trim().split(/\s+/)[0];
      if (language !== 'easy-tikz' && !(language === 'tikz' && token.content.trim().startsWith('{'))) {
        return original(tokens,index,options,env,self);
      }
      const key = crypto.createHash('sha256').update(JSON.stringify([FORMAT,scale,token.content])).digest('hex');
      const cache = path.resolve('.cache','dg-appearance-tikz');
      fs.mkdirSync(cache,{recursive:true});
      let width, height;
      for (const mode of ['light','dark']) {
        const name = `${key}-${mode}.png`;
        const file = path.join(cache,name);
        const metadata = file+'.json';
        let dimensions;
        if (fs.existsSync(file) && fs.existsSync(metadata)) {
          try {
            dimensions = JSON.parse(fs.readFileSync(metadata,'utf8'));
            const image=fs.readFileSync(file);
            const valid=[dimensions.width,dimensions.height].every(n=>Number.isFinite(n)&&n>0&&n<=2400);
            const hash=crypto.createHash('sha256').update(image).digest('hex');
            if(image.length<33||image.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||!valid||hash!==dimensions.pngHash)dimensions=null;
          } catch (_) { dimensions=null; }
        }
        if (!dimensions) {
          try {
            const result=renderer.render(token.content,mode==='dark',scale);
            dimensions={width:result.width,height:result.height,pngHash:crypto.createHash('sha256').update(result.png).digest('hex')};
            // Rename completed writes so an interrupted build cannot cache a partial image.
            fs.writeFileSync(file+'.tmp',result.png); fs.renameSync(file+'.tmp',file);
            fs.writeFileSync(metadata+'.tmp',JSON.stringify(dimensions)); fs.renameSync(metadata+'.tmp',metadata);
          } catch (error) {
            throw new Error(`[Appearance & Reading] Easy TikZ export failed in ${env?.page?.inputPath || 'a note'}: ${error.message}`);
          }
        }
        width=dimensions.width; height=dimensions.height;
        generated.set(name,file);
      }
      return `<figure class="dg-tikz-graph"><img class="dg-tikz-light" src="/img/appearance-tikz/${key}-light.png" alt="Graph" width="${width}" height="${height}" loading="lazy" decoding="async"><img class="dg-tikz-dark" src="/img/appearance-tikz/${key}-dark.png" alt="Graph" width="${width}" height="${height}" loading="lazy" decoding="async"></figure>\n`;
    };
  },
};
