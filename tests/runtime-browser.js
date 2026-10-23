import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const cases = [
    { country: 'HU', locale: 'en-US', saved: 'en', expected: 'en' },
    { country: 'HU', locale: 'en-US', expected: 'hu' },
    { country: 'HU', locale: 'en-US', saved: 'invalid', expected: 'hu' },
    { country: 'DE', locale: 'hu-HU', expected: 'en' },
    { country: 'DE', locale: 'en-US', saved: 'hu', expected: 'hu' },
    { country: 'XX', locale: 'hu-HU', expected: 'hu' },
    { locale: 'hu-HU', saved: 'invalid', expected: 'hu' },
    { locale: 'en-US', expected: 'en' },
    { locale: 'en-US', blocked: true, expected: 'en' },
  ];
  for (const entry of cases) {
    const context = await browser.newContext({ locale: entry.locale, colorScheme: 'light' });
    await context.addInitScript(({ saved, blocked }) => {
      if (blocked) Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage unavailable'); } });
      else if (saved && !sessionStorage.getItem('test-initialized')) {
        localStorage.setItem('jrepas-language-choice', saved);
        sessionStorage.setItem('test-initialized', 'true');
      }
    }, entry);
    const page = await context.newPage();
    const errors = [];
    const wasmRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (/\.wasm|\/assets\/rust\//.test(request.url())) wasmRequests.push(request.url()); });
    if (entry.country) {
      await page.route(base + '/', async route => {
        const response = await route.fetch();
        await route.fulfill({ response, body: (await response.text()).replace('<html ', `<html data-country="${entry.country}" `) });
      });
    }
    await page.goto(base);
    await page.waitForSelector('html[data-runtime="javascript"]');
    assert.equal(await page.locator('html').getAttribute('lang'), entry.expected);
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(await page.locator('.language-switch').isVisible());
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    await page.locator('.theme-toggle').click();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.emulateMedia({ colorScheme: 'dark' });
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    // Click controls rapidly while the language fade is pending.
    await page.evaluate(() => {
      document.querySelector('[data-language="en"]').click();
      document.querySelector('[data-language="hu"]').click();
      document.querySelector('[data-language="en"]').click();
      document.querySelector('.theme-toggle').click();
    });
    await page.waitForFunction(() => document.documentElement.lang === 'en' && !document.documentElement.hasAttribute('data-switching'));
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.match(await page.title(), /Graphic Design/);
    assert.match(await page.locator('#quote-mail').getAttribute('href'), /mailto:jrepas@icloud.com/);
    if (!entry.blocked) {
      await page.reload();
      await page.waitForSelector('html[data-runtime="javascript"]');
      assert.equal(await page.locator('html').getAttribute('lang'), 'en');
    }
    assert.deepEqual(errors, []);
    assert.deepEqual(wasmRequests, []);
    await context.close();
  }
  console.log('JavaScript runtime: country/browser language, saved choices, unavailable storage, system theme, rapid switching and no WASM requests passed.');
} finally { await browser.close(); }
