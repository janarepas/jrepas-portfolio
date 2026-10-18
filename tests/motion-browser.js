import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('html[data-motion]');
  assert.ok(await page.locator('html').evaluate(el => el.classList.contains('lenis')));
  assert.equal(await page.locator('.portfolio-card').last().getAttribute('data-reveal'), 'pending');
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(120);
  const intermediate = await page.evaluate(() => scrollY);
  assert.ok(intermediate > 0 && intermediate < 795, `wheel interpolates: ${intermediate}`);
  await page.waitForTimeout(1200);
  assert.ok(await page.evaluate(() => scrollY > 750));
  assert.ok(await page.locator('.site-header').evaluate(el => el.getBoundingClientRect().bottom < 0));
  assert.equal(await page.locator('html').getAttribute('data-scrolled'), 'true');
  assert.equal(await page.locator('.top-glass').evaluate(el => getComputedStyle(el).pointerEvents), 'none');
  await page.locator('.portfolio-card').last().scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector('.portfolio-card:last-child').dataset.reveal === 'visible');
  const reduced = await browser.newPage({ reducedMotion: 'reduce' });
  await reduced.goto(base, { waitUntil: 'domcontentloaded' });
  await reduced.waitForSelector('.top-glass', { state: 'attached' });
  assert.equal(await reduced.locator('html').getAttribute('data-motion'), null);
  assert.equal(await reduced.locator('[data-reveal=pending]').count(), 0);
  console.log('Passed: interpolated wheel scrolling, progressive reveal, non-sticky menu, top fade and reduced-motion fallback');
} finally { await browser.close(); }
