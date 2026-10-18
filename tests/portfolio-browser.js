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
    const tiles = page.locator('#about .work-tile');
    assert.equal(await tiles.count(), 4);
    assert.equal(await page.locator('.work-collage,.reference-card,.reference-caption').count(), 0);
    assert.equal(await page.locator('.portfolio-card a, a.portfolio-card').count(), 0);
    for (const language of ['hu', 'en']) {
      await page.locator(`[data-language="${language}"]`).click();
      await page.waitForFunction(lang => document.documentElement.lang === lang, language);
      for (const [index, source] of sources.entries()) {
        const tile = tiles.nth(index);
        assert.equal(await tile.getAttribute('href'), source.project_url);
        assert.equal(await tile.getAttribute('target'), '_blank');
        assert.match(await tile.getAttribute('rel'), /noopener/);
        await tile.scrollIntoViewIfNeeded();
        await tile.locator('img').evaluate(img => img.decode());
        assert.ok(await tile.locator('img').evaluate(img => img.complete && img.naturalWidth > 0 && new URL(img.currentSrc).origin === location.origin));
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    const rects = await tiles.evaluateAll(items => items.map(el => el.getBoundingClientRect().toJSON()));
    if (width > 700) {
      assert.ok(Math.abs(rects[0].top - rects[1].top) < 1);
      assert.ok(rects[1].left > rects[0].right);
      assert.ok(rects[0].width >= 600);
    } else {
      assert.ok(rects[1].top > rects[0].bottom);
      assert.ok(rects[0].width >= width - 48);
    }
    assert.ok(rects[2].top > rects[0].bottom);
    await context.route('https://www.behance.net/gallery/**', route => route.fulfill({ contentType: 'text/html', body: '<title>Project destination fixture</title>' }));
    const [popup] = await Promise.all([context.waitForEvent('page'), tiles.first().click()]);
    await popup.waitForURL(sources[0].project_url);
    assert.equal(await popup.evaluate(() => window.opener === null), true);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`Tiles ${width}px: four separate local images, non-overlapping grid, project links and translations passed.`);
  }
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto(base);
  assert.equal(await page.locator('#about .work-tile img').count(), 4);
  console.log('Tiles and links remain available without JavaScript.');
} finally { await browser.close(); }
