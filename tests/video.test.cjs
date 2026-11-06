const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const script = fs.readFileSync(path.join(__dirname, '../assets/video-sources.js'), 'utf8');
const chrome = process.env.CHROME_PATH;

test('one-line garden videos fold accessibly, load lazily, and coexist with native callout listeners', { skip: !chrome && 'Set CHROME_PATH for the browser check' }, async () => {
  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  try {
    const page = await browser.newPage();
    let requests = 0;
    await page.route('**/*', route => { requests++; return route.abort(); });
    await page.setContent('<div class="callout" data-callout="video"><div class="callout-title"><div class="callout-title-inner"><a href="https://youtu.be/SfIQ6fLk6co?t=30">Lecture title</a></div></div></div>');
    await page.addScriptTag({ content: script });
    const title = page.getByRole('button', { name: 'Video: Lecture title' });
    await title.waitFor();
    assert.equal(await title.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('iframe').count(), 0);
    assert.equal(requests, 0);
    // The garden's core installs this bubble handler; our capture listener owns videos.
    await title.evaluate(el => el.addEventListener('click', () => el.closest('.callout').classList.toggle('is-collapsed')));
    await title.click();
    assert.equal(await title.getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('iframe').getAttribute('src'), 'https://www.youtube-nocookie.com/embed/SfIQ6fLk6co?start=30');
    assert.equal(await page.locator('.callout.is-collapsed').count(), 0);
    await title.focus(); await page.keyboard.press('Space');
    assert.equal(await title.getAttribute('aria-expanded'), 'false');
    assert.equal(await page.locator('iframe').count(), 0);
    // New pane contents receive the same behavior without page reload.
    await page.evaluate(() => document.body.insertAdjacentHTML('beforeend', '<div class="callout" data-callout="video"><div class="callout-title"><div class="callout-title-inner"><a href="https://youtu.be/Ppblm9W51ac">New pane</a></div></div></div>'));
    await page.getByRole('button', { name: 'Video: New pane' }).waitFor();
    assert.equal(await page.locator('.cl-video-ready').count(), 2);
    assert.equal(await page.locator('iframe').count(), 0);
  } finally { await browser.close(); }
});
