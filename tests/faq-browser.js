import assert from 'node:assert/strict';
import { launchBrowser } from './browser.js';
const browser = await launchBrowser();
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    await page.goto(base);
    await page.waitForSelector('.top-glass');
    const item = page.locator('.faq details').first();
    const summary = item.locator('summary');
    await summary.scrollIntoViewIfNeeded();
    const closed = (await item.boundingBox()).height;
    await summary.click();
    const middle = await item.evaluate(el => { const a = el.getAnimations()[0]; assertAnimation(a); a.pause(); a.currentTime = 100; return el.getBoundingClientRect().height; function assertAnimation(a) { if (!a) throw Error('No FAQ animation'); } });
    const expanded = await item.evaluate(el => { const a = el.getAnimations()[0]; a.finish(); return el.getBoundingClientRect().height; });
    assert.ok(middle > closed && middle < expanded, 'Opening interpolates height');
    await page.waitForFunction(() => !document.querySelector('.faq details').getAnimations().length);
    await summary.click();
    const closing = await item.evaluate(el => { const a = el.getAnimations()[0]; a.pause(); a.currentTime = 100; return el.getBoundingClientRect().height; });
    assert.ok(closing > closed && closing < expanded, 'Closing interpolates height');
    await summary.click();
    await page.waitForFunction(() => !document.querySelector('.faq details').getAnimations().length);
    assert.equal(await item.getAttribute('open'), '', 'Rapid reversal opens correctly');
    await summary.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => !document.querySelector('.faq details').open);
    assert.ok(Math.abs((await item.boundingBox()).height - closed) < 1);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await summary.click();
    assert.equal(await item.getAttribute('open'), '');
    assert.equal(await item.evaluate(el => el.getAnimations().length), 0);
    await summary.click();
    assert.equal(await item.getAttribute('open'), null);
    await page.close();
    console.log(`FAQ ${width}px: smooth opening/closing, reversal, keyboard and reduced motion passed.`);
  }
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto(base);
  await page.locator('.faq summary').first().click();
  assert.equal(await page.locator('.faq details').first().getAttribute('open'), '');
  console.log('FAQ: native disclosure works without JavaScript.');
} finally { await browser.close(); }
