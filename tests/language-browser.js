import assert from 'node:assert/strict';
import './language-unit.js';
import { launchBrowser } from './browser.js';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const browser = await launchBrowser();
const cases = [
 { preferences: ['hu-HU'], expected: 'hu' },
 { preferences: ['en-GB'], expected: 'en' },
 { preferences: ['de-DE'], expected: 'en' },
 { preferences: ['de-DE', 'hu-HU', 'en-US'], expected: 'hu' },
 { preferences: ['fr-FR', 'en-US', 'hu'], expected: 'en' },
 { preferences: [], fallback: 'hu-RO', expected: 'hu' },
 { preferences: ['hu-HU'], saved: 'en', expected: 'en' },
 { preferences: ['en-US'], saved: 'hu', expected: 'hu' },
 { preferences: ['hu-HU'], saved: 'invalid', expected: 'hu' },
 { preferences: ['fr', 'hu-HU'], blocked: true, expected: 'hu' },
 { preferences: ['de'], blocked: true, expected: 'en' },
];
async function ready(page, path) {
 if (path === '/') await page.locator('html[data-runtime="javascript"]').waitFor();
 else if (path === '/rolam/cv/') await page.locator('html[data-ready="true"]').waitFor();
 else await page.waitForFunction(() => document.querySelector('.language-switch [aria-pressed="true"]')?.dataset.language === document.documentElement.lang);
 await page.waitForFunction(() => !document.documentElement.hasAttribute('data-language-pending'));
}
try {
 let pages = 0;
 for (const width of [390, 1440]) for (const entry of cases) {
  const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'en-US', reducedMotion: 'reduce' });
  await context.addInitScript(entry => {
   Object.defineProperty(navigator, 'languages', { get: () => entry.preferences });
   Object.defineProperty(navigator, 'language', { get: () => entry.fallback || entry.preferences[0] || 'en-US' });
   if (entry.blocked) Object.defineProperty(window, 'localStorage', { get() { throw Error('Storage unavailable'); } });
   else if (entry.saved && !sessionStorage.getItem('initialized')) {
    localStorage.setItem('jrepas-language-choice', entry.saved); sessionStorage.setItem('initialized', '1');
   }
  }, entry);
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/', '/rolam/', '/rolam/cv/']) {
   await page.goto(base + path); await ready(page, path);
   assert.equal(await page.locator('html').getAttribute('lang'), entry.expected, `${width} ${path} ${JSON.stringify(entry)}`);
   if (path !== '/rolam/cv/') {
    assert.equal(await page.locator('.language-switch [aria-pressed="true"]').getAttribute('data-language'), entry.expected);
    assert.equal(await page.locator('.language-switch [aria-pressed="false"]').count(), 1);
    assert.ok(await page.locator(`[data-language="${entry.expected}"]`).getAttribute('aria-label'));
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://jrepas.hu' + path);
   }
   assert.equal(await page.locator('link[hreflang]').count(), 0);
   assert.ok(await page.locator('body').isVisible()); pages++;
  }
  assert.deepEqual(errors, []); await context.close();
 }
 for (const [locale, choice] of [['hu-HU', 'en'], ['en-US', 'hu']]) {
  const context = await browser.newContext({ locale, reducedMotion: 'reduce' });
  const page = await context.newPage(); await page.goto(base); await ready(page, '/');
  await page.locator(`[data-language="${choice}"]`).click();
  await page.waitForFunction(choice => document.documentElement.lang === choice, choice);
  assert.equal(await page.evaluate(() => localStorage.getItem('jrepas-language-choice')), choice);
  await page.reload(); await ready(page, '/');
  await page.evaluate(() => window.dispatchEvent(new Event('languagechange')));
  assert.equal(await page.locator('html').getAttribute('lang'), choice);
  const next = await context.newPage(); await next.goto(base + '/rolam/'); await ready(next, '/rolam/');
  assert.equal(await next.locator('html').getAttribute('lang'), choice);
  await context.close();
 }
 // English must not visibly paint the Hungarian source while translation JS loads.
 for (const [path, script] of [['/', 'site.js'], ['/rolam/', 'rolam.js']]) {
  const context = await browser.newContext({ locale: 'en-US' }); const page = await context.newPage();
  let release; const gate = new Promise(resolve => { release = resolve; });
  await page.route(`**/${script}?*`, async route => { await gate; await route.continue(); });
  await page.goto(base + path, { waitUntil: 'commit' });
  await page.waitForFunction(() => document.body && document.documentElement.hasAttribute('data-language-pending'));
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('body').isVisible(), false);
  release(); await ready(page, path); assert.equal(await page.locator('body').isVisible(), true);
  await context.close();
 }
 // Startup guard must fail open if the page renderer cannot load.
 {
  const context = await browser.newContext({ locale: 'en-US' }); const page = await context.newPage();
  await page.route('**/site.js?*', route => route.abort()); await page.goto(base);
  await page.waitForFunction(() => !document.documentElement.hasAttribute('data-language-pending'));
  assert.ok(await page.locator('body').isVisible());
  assert.equal(await page.locator('html').getAttribute('lang'), 'hu');
  await context.close();
 }
 {
  const context = await browser.newContext({ javaScriptEnabled: false }); const page = await context.newPage();
  await page.goto(base); assert.equal(await page.locator('html').getAttribute('lang'), 'hu');
  assert.ok(await page.locator('body').isVisible()); await context.close();
 }
 console.log(`PASS: ${pages} mobile/desktop page cases; manual switching and later visits; languagechange; delayed English startup without HU flash; renderer failure; no-JS source; lang, aria, canonical and hreflang.`);
} finally { await browser.close(); }
