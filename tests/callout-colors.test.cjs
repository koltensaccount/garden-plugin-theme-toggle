const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const dist=process.env.GARDEN_DIST;
test('built garden callout titles and linked titles use Folio text colors in both modes', {skip: !dist || !process.env.CHROME_PATH ? 'Set GARDEN_DIST and CHROME_PATH after building the garden' : false}, async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try {
  const page=await browser.newPage();
  const css=['style.css','digital-garden-base.css','custom-style.css'].map(n=>fs.readFileSync(path.join(dist,'styles',n),'utf8')).join('\n');
  const types=['note','definition','theorem','remark','video'];
  const callouts=types.map(type=>`<div class="callout" data-callout="${type}"><div class="callout-title"><div class="callout-title-inner">${type} <a href="https://example.com">Linked title</a></div></div></div>`).join('');
  for(const [mode,expected] of [['light','rgb(37, 40, 45)'],['dark','rgb(223, 226, 231)']]){
   await page.setContent(`<style>${css}</style><body class="theme-${mode}"><main class="content">${callouts}<a id="ordinary-link" href="https://example.com">Ordinary link</a></main></body>`);
   const colors=await page.locator('.callout-title-inner, .callout-title-inner a').evaluateAll(els=>els.map(e=>({text:e.textContent,type:e.closest(".callout").dataset.callout,color:getComputedStyle(e).color})));
   const muted=mode==='light'?'rgb(92, 100, 112)':'rgb(170, 177, 189)';
   assert(colors.every(e=>e.color===(e.type==='remark'?muted:expected)),JSON.stringify({mode,colors}));
   assert.notEqual(await page.locator('#ordinary-link').evaluate(e=>getComputedStyle(e).color),expected,'regular links retain the link color');
  }
 } finally {await browser.close();}
});
