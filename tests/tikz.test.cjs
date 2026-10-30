const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const MarkdownIt=require('markdown-it');
const hooks=require('../index');
const renderer=require('../lib/easy-tikz-renderer.cjs');
const chart='show x from -5 to 5 and y from -2 to 2\naxes in the middle\nxlabel $t$\nylabel $x(t)$\nplot f(x) = cos(x)';

test('build-side graphs are static cached PNGs; callouts, math, unrelated fences and edits survive',async()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'dg-tikz-test-'));
  const cwd=process.cwd();process.chdir(tmp);
  try{
    const events={};const context={settings:{}};
    hooks.setupEleventy({on(name,fn){events[name]=fn;}},context);
    await events['eleventy.before']();
    const md=new MarkdownIt();
    require('markdown-it-mathjax3')(md);
    hooks.setupMarkdown(md,context);
    const note='> [!note] Callout stays\n> ```easy-tikz\n'+chart.split('\n').map(l=>'> '+l).join('\n')+'\n> ```\n> After graph\n\n$\\mathbb{Z}$\n\n```js\nconst untouched=true;\n```';
    const before=note;
    const html=md.render(note);
    assert.equal(note,before,'Never writes the source note');
    assert(html.includes('<blockquote>')&&html.includes('Callout stays')&&html.includes('After graph'));
    assert(html.includes('data-c="2124"'),'Regular MathJax is unchanged');
    assert(html.includes('language-js')&&html.includes('const untouched'));
    assert(!html.includes('language-easy-tikz')&&!html.includes('<script'));
    const names=[...html.matchAll(/\/img\/appearance-tikz\/([a-f0-9]+-(?:light|dark)\.png)/g)].map(m=>m[1]);
    assert.equal(names.length,2);
    await events['eleventy.after']({dir:{output:'dist'}});
    for(const name of names){
      const buffer=fs.readFileSync(path.join(tmp,'dist/img/appearance-tikz',name));
      assert.equal(buffer.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
      assert.equal(buffer.readUInt32BE(16),3040);
      assert(buffer.readUInt32BE(20)>1000);
      assert(buffer.length>20000,'Chart is not an empty image');
    }
    assert(!fs.readFileSync(path.join(tmp,'dist/img/appearance-tikz',names[0])).equals(fs.readFileSync(path.join(tmp,'dist/img/appearance-tikz',names[1]))),'Light/dark contrast variants differ');
    const cached=path.join(tmp,'.cache/dg-appearance-tikz',names[0]);
    const stamp=fs.statSync(cached).mtimeMs;
    assert.equal(md.render(note),html);
    assert.equal(fs.statSync(cached).mtimeMs,stamp,'Unchanged graph reuses its PNG');
    fs.writeFileSync(cached,'broken image');
    assert.equal(md.render(note),html,'A corrupt cache is regenerated');
    assert.equal(fs.readFileSync(cached).subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const changed=md.render(note.replace('cos(x)','sin(x)'));
    assert.notEqual(changed,html,'A graph edit gets a new content-addressed URL');
    const raw='```tikz\n\\draw (0,0) -- (1,1);\n```';
    assert(md.render(raw).includes('language-tikz'),'Do not reinterpret raw LaTeX TikZ');
    assert.throws(()=>md.render('```easy-tikz\nthis is not a chart\n```'),/Easy TikZ export failed/);
    assert.throws(()=>renderer.render('x'.repeat(128001)),/128 KB/);
    const disabled=new MarkdownIt();hooks.setupMarkdown(disabled,{settings:{renderEasyTikz:false}});
    assert(disabled.render('```easy-tikz\n'+chart+'\n```').includes('language-easy-tikz'));
  }finally{process.chdir(cwd);fs.rmSync(tmp,{recursive:true,force:true});}
});

test('3D charts and Easy TikZ JSON export without an Obsidian or browser runtime',async()=>{
  await renderer.prepare();
  const three=renderer.render('3d\nshow x from -2 to 2, y from -2 to 2 and z from 0 to 8\nplot z = x^2 + y^2 for x from -2 to 2 and y from -2 to 2 in blue, opacity 0.7');
  assert(three.png.length>100000);
  const json=renderer.render(JSON.stringify({v:4,functions:[{expression:'sin(x)'}]}));
  assert(json.png.length>20000);
});
