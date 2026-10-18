import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ locale: 'hu-HU', colorScheme: 'dark', viewport: { width, height: 1000 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html[data-runtime="rust-wasm"]');
    assert.equal(await page.locator('.logo-intro').count(), 0);
    assert.ok(await page.locator('.hero').isVisible());
    assert.ok(await page.locator('.site-header').isVisible());
    assert.equal(await page.locator('html').getAttribute('lang'), 'hu');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await page.waitForFunction(() => { const image = document.querySelector('.hero-image img'); return image.complete && image.naturalWidth > 0 && image.currentSrc.includes('hero-fold-rear-dark-'); });
    assert.equal(await page.locator('.portfolio-card').count(), 8);
    assert.equal(await page.locator('.portfolio-card a, a.portfolio-card').count(), 0);
    assert.equal(await page.locator('h1 em').evaluate(el => getComputedStyle(el).textDecorationStyle), 'double');
    assert.equal(await page.locator('[data-current-year]').textContent(), String(new Date().getFullYear()));
    await page.locator('.theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.waitForFunction(() => { const image = document.querySelector('.hero-image img'); return image.complete && image.naturalWidth > 0 && image.currentSrc.includes('hero-fold-rear-light-'); });
    assert.equal(await page.locator('.theme-toggle').getAttribute('data-icon-theme'), 'moon');
    await page.locator('[data-language="en"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.match(await page.locator('h1').textContent(), /Ideas/);
    await page.locator('[data-language="hu"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'hu');
    assert.equal(await page.locator('.process-step').count(), 10);
    assert.equal(await page.locator('[data-carousel-next]').count(), 0);
    for (const step of await page.locator('.process-step').all()) {
      assert.ok(await step.isVisible());
      assert.ok((await step.locator('h3').textContent()).length > 0);
      assert.ok((await step.locator('p').textContent()).length > 0);
    }
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    assert.ok(await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().bottom < 0));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html[data-runtime="rust-wasm"]');
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`Public site: ${width}px, language, theme, flowchart, header, layout and persistence passed`);
  }
} finally { await browser.close(); }
