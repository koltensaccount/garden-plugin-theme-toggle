const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const dist=process.env.GARDEN_DIST;
test('built garden callout titles match Folio in pages, hover previews and panes', {skip: !dist || !process.env.CHROME_PATH ? 'Set GARDEN_DIST and CHROME_PATH after building the garden' : false}, async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try {
  const page=await browser.newPage();
  const css=['style.css','digital-garden-base.css','custom-style.css'].map(n=>fs.readFileSync(path.join(dist,'styles',n),'utf8')).join('\n');
  const types=['note','definition','theorem','remark','video'];
  const callouts=types.map(type=>`<div class="callout" data-callout="${type}"><div class="callout-title"><div class="callout-title-inner">${type} <a href="https://example.com">Linked title</a></div></div></div>`).join('');
  for(const [mode,expected] of [['light','rgb(37, 40, 45)'],['dark','rgb(223, 226, 231)']]){
   await page.setContent(`<style>${css}</style><body class="theme-${mode}"><main class="content">${callouts}<a id="ordinary-link" href="https://example.com">Ordinary link</a></main><div id="tooltip-wrapper"><div id="tooltip-content">${callouts}</div></div><section class="dg-rp-panel">${callouts}</section></body>`);
   const colors=await page.locator('.callout-title-inner, .callout-title-inner a').evaluateAll(els=>els.map(e=>({text:e.textContent,type:e.closest(".callout").dataset.callout,color:getComputedStyle(e).color})));
   const muted=mode==='light'?'rgb(92, 100, 112)':'rgb(170, 177, 189)';
   assert(colors.every(e=>e.color===(e.type==='remark'?muted:expected)),JSON.stringify({mode,colors}));
   assert.notEqual(await page.locator('#ordinary-link').evaluate(e=>getComputedStyle(e).color),expected,'regular links retain the link color');
  }
 } finally {await browser.close();}
});

test('actual garden hover preview keeps the definition title neutral', {skip: !dist || !process.env.CHROME_PATH ? 'Set GARDEN_DIST and CHROME_PATH after building the garden' : false}, async()=>{
 const http=require('node:http');
 const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const base=path.resolve(dist);let file=path.resolve(base,'.'+pathname);
  if(!file.startsWith(base+path.sep)){res.writeHead(403);res.end();return;}
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  const types={'.css':'text/css','.js':'text/javascript','.html':'text/html','.png':'image/png'};
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1400,height:1000}});
  await page.addInitScript('window.lucide={createIcons(){}}');
  await page.route('**/*',route=>route.request().url().startsWith('http://127.0.0.1:')?route.continue():route.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/school/fall-2026/signals-and-systems/signals-and-systems/`,{waitUntil:'networkidle'});
  await page.evaluate(()=>{document.body.classList.remove('theme-light');document.body.classList.add('theme-dark');});
  await page.locator('main.content a[href*="signals-and-systems-chapter-1"]').first().hover();
  const title=page.locator('#tooltip-content .callout-title-inner').first();await title.waitFor();
  assert.equal(await title.evaluate(e=>getComputedStyle(e).color),'rgb(223, 226, 231)');
  assert.match(await title.textContent(),/Signal/);
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
});
