const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright-core');
const {normalizeDisplayMathLayout}=require('../lib/display-math-layout.cjs');
const hooks=require('../index');
const MarkdownIt=require('markdown-it');
test('display math adapts Obsidian syntax without editing prose, TeX, code or input',()=>{
 const source="Before $$ab+I=a'b'+I$$ &\n$$(a+b)+I=(a'+b')+I$$";
 const md=new MarkdownIt();require('markdown-it-mathjax3')(md);hooks.setupMarkdown(md,{settings:{renderEasyTikz:false}});
 const html=md.render(source);
 assert.equal((html.match(/display="true"/g)||[]).length,2);assert(!html.includes('data-mjx-error'));assert(html.includes('Before'));assert(html.includes('&amp;'));
 for(const s of ['```md\nBefore $$x$$ after\n```','> ~~~tex\n> $$x$$ &\n> ~~~','Use `$$x$$` in code.','    code $$x$$ after','Use $x$ in prose.','$$\nx+y\n$$','> $$x$$','Before $$unclosed'])assert.equal(normalizeDisplayMathLayout(s),s);
 assert(normalizeDisplayMathLayout('> > Before $$x$$ after\r\n').includes('> > $$x$$\r\n'));
 assert.equal(source,"Before $$ab+I=a'b'+I$$ &\n$$(a+b)+I=(a'+b')+I$$");
});
test('only oversized inline formulae scroll; resizing and previews update without changing math', {skip:!process.env.CHROME_PATH||!process.env.GARDEN_DIST},async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
 try{
 const page=await browser.newPage();const css=fs.readFileSync(path.join(process.env.GARDEN_DIST,'styles/custom-style.css'),'utf8');
 await page.setContent(`<style>${css}</style><main class="content" style="width:300px"><p><mjx-container id="short"><svg width="30" height="24"></svg></mjx-container> prose <mjx-container id="long"><svg width="450" height="80"></svg></mjx-container></p></main>`);
 const before=await page.locator('p').innerHTML();
 await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'../assets/math-layout.js'),'utf8')});
 await page.waitForFunction(()=>document.querySelector('#long').classList.contains('folio-inline-math-scroll'));
 assert.equal(await page.locator('#short').getAttribute('tabindex'),null);
 assert.equal(await page.locator('#long').getAttribute('tabindex'),'0');
 assert(await page.locator('#long').evaluate(e=>e.scrollWidth>e.clientWidth));
 await page.locator('main').evaluate(e=>e.style.width='600px');
 await page.waitForFunction(()=>!document.querySelector('#long').classList.contains('folio-inline-math-scroll'));
 assert.equal(await page.locator('p').innerHTML(),before);
 await page.evaluate(()=>document.body.insertAdjacentHTML('beforeend','<aside id="tooltip-content" style="width:240px"><p><mjx-container><svg width="400" height="24"></svg></mjx-container></p></aside>'));
 await page.waitForFunction(()=>document.querySelector('#tooltip-content .folio-inline-math-scroll'));
 }finally{await browser.close();}
});
