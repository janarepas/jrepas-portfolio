import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const sources = JSON.parse(await readFile(new URL('../docs/portfolio-sources.json', import.meta.url), 'utf8'));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ locale: 'hu-HU', viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html[data-runtime="rust-wasm"]');
    assert.equal(await page.locator('#about .reference-card').count(), 4);
    assert.equal(await page.locator('.portfolio-card a, a.portfolio-card').count(), 0);
    assert.equal(await page.locator('#about .about-actions').count(), 1);
    for (const language of ['hu', 'en']) {
      await page.locator(`[data-language="${language}"]`).click();
      await page.waitForFunction(lang => document.documentElement.lang === lang, language);
      for (const [index, source] of sources.entries()) {
        const card = page.locator('.reference-card').nth(index);
        assert.equal(await card.getAttribute('href'), source.project_url);
        assert.equal(await card.getAttribute('target'), '_blank');
        assert.match(await card.getAttribute('rel'), /noopener/);
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(img => img.decode());
        assert.ok(await card.locator('img').evaluate(img => img.complete && img.naturalWidth >= img.clientWidth - 1 && new URL(img.currentSrc).origin === location.origin));
        assert.ok((await card.locator('h4').textContent()).length > 5);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    const cards = await page.locator('.reference-card').evaluateAll(items => items.map(el => el.getBoundingClientRect().toJSON()));
    if (width > 700) { assert.ok(Math.abs(cards[0].y - cards[1].y) < 1); assert.ok(cards[2].y > cards[0].y); }
    else assert.ok(cards[1].y > cards[0].y + cards[0].height);
    // Verify the outgoing link without depending on the remote Behance UI or its bot checks.
    await context.route('https://www.behance.net/gallery/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Portfolio destination fixture</title>' }));
    const [popup] = await Promise.all([context.waitForEvent('page'), page.locator('.reference-card').first().click()]);
    await popup.waitForURL(sources[0].project_url);
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(popup.url(), sources[0].project_url);
    assert.equal(await popup.evaluate(() => window.opener === null), true);
    await popup.close();
    await page.locator('[data-language="hu"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'hu');
    await page.locator('.selected-work').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/behance-gallery-${width}.png` });
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`Portfolio ${width}px: four real local covers, source links, bilingual captions, layout and safe outbound click passed.`);
  }
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto(base);
  assert.equal(await page.locator('#about .reference-card').count(), 4);
  assert.match(await page.locator('#selected-work-title').textContent(), /Ötletből/);
  console.log('Portfolio: images and project links are present without JavaScript.');
} finally { await browser.close(); }
