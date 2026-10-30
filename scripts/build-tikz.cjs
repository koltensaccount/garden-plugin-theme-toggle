const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const esbuild = require('esbuild');
const root = path.resolve(__dirname,'..');
const source = process.env.EASY_TIKZ_SOURCE;
const pinned = '51c6a7c2b86d0a5b439191e0511518ea22b203bc';
if (!source || execFileSync('git',['rev-parse','HEAD'],{cwd:source,encoding:'utf8'}).trim() !== pinned) throw new Error('Set EASY_TIKZ_SOURCE to the pinned Easy TikZ checkout: '+pinned);
fs.mkdirSync(path.join(root,'lib'),{recursive:true});
esbuild.build({
  absWorkingDir:root,entryPoints:['build/tikz-entry.js'],outfile:'lib/easy-tikz-renderer.cjs',bundle:true,platform:'node',target:'node18',minify:true,legalComments:'external',metafile:true,
  define:{'process.env.EASY_TIKZ_SOURCE':JSON.stringify(source)},inject:[path.join(root,'build/tikz-dom.js')],
  plugins:[{
    name:'garden-math-labels',setup(build){
      build.onLoad({filter:/[/\\]src[/\\]mathlabel\.ts$/},()=>({contents:fs.readFileSync(path.join(root,'build/tikz-math.js'),'utf8'),loader:'js',resolveDir:path.join(root,'build')}));
    },
  }],
}).then(result=>{
  fs.copyFileSync(path.join(root,'node_modules/@resvg/resvg-wasm/index_bg.wasm'),path.join(root,'lib/resvg.wasm'));
  fs.copyFileSync(path.join(source,'LICENSE.md'),path.join(root,'lib/EASY-TIKZ-LICENSE.txt'));
  const packages=new Set();
  for(const file of Object.keys(result.metafile.inputs)){
    const match=file.match(/^(.*node_modules\/(?:@[^/]+\/)?[^/]+)/);
    if(match)packages.add(path.resolve(root,match[1]));
  }
  const notices=[];
  for(const dir of [...packages].sort()){
    for(const file of fs.readdirSync(dir).filter(n=>/^(license|licence|copying)(\.|$)/i.test(n))){
      if(fs.statSync(path.join(dir,file)).isFile())notices.push(path.basename(dir)+' / '+file+'\n'+fs.readFileSync(path.join(dir,file),'utf8'));
    }
  }
  fs.writeFileSync(path.join(root,'lib/THIRD-PARTY-LICENSES.txt'),notices.join('\n\n'));
}).catch(e=>{console.error(e);process.exitCode=1;});
