const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const script = fs.readFileSync(path.join(__dirname, '../assets/video-sources.js'), 'utf8');
test('exact bold study labels, split editor tokens, and dynamic previews preserve text and semantics', { skip: !process.env.CHROME_PATH }, async () => {
 const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless:true });
 try {
  const page = await browser.newPage();
  await page.setContent(`<p><strong id="q">Question.</strong> Prompt <strong id="e">Exercises:</strong> <strong id="ex">example</strong> <strong id="no">Question about rings</strong> <strong id="other">Important</strong></p><pre><strong>Question</strong></pre><h6><strong>Example</strong></h6><div class="cm-line"><span class="cm-strong cm-formatting-strong">**</span><span class="cm-strong" id="cm">Question</span><span class="cm-strong" id="punct">.</span><span class="cm-strong cm-formatting-strong">**</span> prompt</div><div class="cm-line"><span class="cm-strong" id="phrase">Question</span><span class="cm-strong"> about rings</span></div>`);
  const before = await page.locator('body').textContent();
  await page.addScriptTag({content:script});
  await page.waitForFunction(() => document.querySelectorAll('.folio-study-label').length === 5);
  assert.equal(await page.locator('#no.folio-study-label, #other.folio-study-label, #phrase.folio-study-label, pre .folio-study-label, h6 .folio-study-label, .cm-formatting-strong.folio-study-label').count(),0);
  assert.equal(await page.locator('body').textContent(),before);
  assert.equal(await page.locator('h6').count(),1);
  await page.locator('#q').evaluate(el => el.firstChild.data='A different phrase');
  await page.waitForFunction(() => !document.querySelector('#q').classList.contains('folio-study-label'));
  await page.evaluate(() => document.body.insertAdjacentHTML('beforeend','<aside id="tooltip-content"><strong>Question:</strong></aside>'));
  await page.waitForFunction(() => document.querySelector('#tooltip-content strong').classList.contains('folio-study-label'));
 } finally { await browser.close(); }
});

test('study typography and quiet solutions fit narrow and wide garden layouts', {skip:!process.env.GARDEN_DIST || !process.env.CHROME_PATH}, async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
 try {
 const page=await browser.newPage();
 const css=['style.css','digital-garden-base.css','custom-style.css'].map(n=>fs.readFileSync(path.join(process.env.GARDEN_DIST,'styles',n),'utf8')).join('\n');
 for(const mode of ['light','dark']) for(const width of [390,1400]) {
  await page.setViewportSize({width,height:900});
  await page.setContent(`<style>${css}</style><body class="theme-${mode}"><main class="content"><p><strong id="label">Exercise.</strong> Prove the theorem.</p><div class="callout is-collapsed" data-callout="solution"><div class="callout-title"><div class="callout-icon">icon</div><div class="callout-title-inner">Solution</div><div class="callout-fold">›</div></div><div class="callout-content"><p>Original solution</p></div></div></main></body>`);
  await page.addScriptTag({content:script});
  await page.waitForFunction(()=>document.querySelector('#label').classList.contains('folio-study-label'));
  const styles=await page.locator('.callout').evaluate(el=>({bg:getComputedStyle(el).backgroundColor,border:getComputedStyle(el).borderLeftWidth,icon:getComputedStyle(el.querySelector('.callout-icon')).display,title:getComputedStyle(el.querySelector('.callout-title-inner')).fontStyle}));
  assert.deepEqual(styles,{bg:'rgba(0, 0, 0, 0)',border:'1px',icon:'none',title:'italic'});
  assert.equal(await page.locator('#label').evaluate(el=>getComputedStyle(el).textTransform),'uppercase');
 }
 }finally{await browser.close();}
});
