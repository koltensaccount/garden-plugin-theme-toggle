const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright-core');
const root=path.resolve(process.argv[2]||'');
const chrome=process.env.CHROME_PATH;
if(!fs.existsSync(path.join(root,'dist/tikz-integration/index.html'))||!chrome)throw new Error('Pass the test garden path and CHROME_PATH');
const server=http.createServer((req,res)=>{
  const name=new URL(req.url,'http://localhost').pathname;
  let file=path.join(root,'dist',name);
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!file.startsWith(path.join(root,'dist')+path.sep)||!fs.existsSync(file)){res.statusCode=404;return res.end();}
  res.setHeader('Content-Type',file.endsWith('.png')?'image/png':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html');
  res.end(fs.readFileSync(file));
});
(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({executablePath:chrome,headless:true});
    const page=await browser.newPage();const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const base=`http://127.0.0.1:${server.address().port}`;
    await page.goto(base+'/tikz-integration/');
    assert.equal(await page.locator('.dg-tikz-graph').count(),2);
    assert.equal(await page.locator('.callout .dg-tikz-graph').count(),1);
    assert.equal(await page.locator('code.language-easy-tikz').count(),0);
    for(const width of [1600,390]){
      await page.setViewportSize({width,height:900});
      for(const mode of ['light','dark']){
        await page.evaluate(mode=>{document.body.classList.remove('theme-light','theme-dark');document.body.classList.add('theme-'+mode);},mode);
        const imgs=page.locator(`.dg-tikz-${mode}`);
        await imgs.first().scrollIntoViewIfNeeded();
        await page.waitForFunction(mode=>[...document.querySelectorAll('.dg-tikz-'+mode)].every(img=>img.complete&&img.naturalWidth>0),mode);
        assert.equal(await imgs.first().isVisible(),true);
        assert.equal(await page.locator(`.dg-tikz-${mode==='light'?'dark':'light'}`).first().isVisible(),false);
        for(const img of await imgs.all()){
          const state=await img.evaluate(el=>{
            const r=el.getBoundingClientRect();const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
            const ctx=canvas.getContext('2d');ctx.drawImage(el,0,0,64,64);
            const pixels=ctx.getImageData(0,0,64,64).data;let ink=0;
            for(let i=3;i<pixels.length;i+=4)if(pixels[i]>0)ink++;
            return {left:r.left,right:r.right,natural:el.naturalWidth,ink};
          });
          assert(state.left>=0&&state.right<=width+1,'Graph remains within viewport');
          assert(state.natural===3040&&state.ink>40,'High-resolution PNG contains drawn pixels');
        }
        await page.screenshot({path:`/private/tmp/dg-tikz-garden-${width}-${mode}.png`,fullPage:true});
      }
    }
    assert.deepEqual(errors,[]);
    console.log('Built garden: 2D/3D PNGs, callout containment, 1600/390px, light/dark, decoded pixels and no page errors: PASS');
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);process.exitCode=1;});
