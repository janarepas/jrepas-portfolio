import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const sources = JSON.parse(await readFile(new URL('../docs/portfolio-sources.json', import.meta.url), 'utf8'));
const destination = 'https://www.behance.net/jrepas';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ locale: 'hu-HU', viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html[data-runtime="rust-wasm"]');
    const collage = page.locator('#about .work-collage');
    assert.equal(await collage.count(), 1);
    assert.equal(await collage.locator('img').count(), 4);
    assert.equal(await page.locator('.reference-card,.reference-caption,.reference-grid').count(), 0);
    assert.equal(await page.locator('.portfolio-card a, a.portfolio-card').count(), 0);
    assert.equal(await collage.getAttribute('href'), destination);
    assert.equal(await collage.getAttribute('target'), '_blank');
    assert.match(await collage.getAttribute('rel'), /noopener/);
    for (const language of ['hu', 'en']) {
      await page.locator(`[data-language="${language}"]`).click();
      await page.waitForFunction(lang => document.documentElement.lang === lang, language);
      await collage.scrollIntoViewIfNeeded();
      for (const [index, source] of sources.entries()) {
        const image = collage.locator('img').nth(index);
        assert.equal(await image.getAttribute('src'), source.local_cover);
        await image.evaluate(img => img.decode());
        assert.ok(await image.evaluate(img => img.complete && img.naturalWidth > 0 && new URL(img.currentSrc).origin === location.origin));
      }
      assert.match(await collage.textContent(), language === 'hu' ? /Munkáim a Behance-en/ : /View my work on Behance/);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    const rects = await collage.locator('img').evaluateAll(items => items.map(el => el.getBoundingClientRect().toJSON()));
    assert.ok(rects.every((a, i) => rects.some((b, j) => i !== j && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)), 'Images form an overlapping composition');
    await context.route(destination, route => route.fulfill({ contentType: 'text/html', body: '<title>Portfolio destination fixture</title>' }));
    const [popup] = await Promise.all([context.waitForEvent('page'), collage.click()]);
    await popup.waitForURL(destination);
    await popup.waitForLoadState('domcontentloaded');
    assert.equal(await popup.evaluate(() => window.opener === null), true);
    await popup.close();
    await page.locator('[data-language="hu"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'hu');
    await collage.scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/behance-collage-${width}.png` });
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`Collage ${width}px: four local images, overlapping layout, no project list, bilingual label and profile link passed.`);
  }
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto(base);
  assert.equal(await page.locator('#about .work-collage img').count(), 4);
  assert.equal(await page.locator('#about .work-collage').getAttribute('href'), destination);
  console.log('Collage: source images and profile link are present without JavaScript.');
} finally { await browser.close(); }
