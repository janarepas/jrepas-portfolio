import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ locale: 'hu-HU', viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html[data-runtime="rust-wasm"]');
    for (const language of ['hu', 'en']) {
      await page.locator(`[data-language="${language}"]`).click();
      await page.waitForFunction(lang => document.documentElement.lang === lang, language);
      for (const theme of ['light', 'dark']) {
        if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('.theme-toggle').click();
        const geometry = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - innerWidth,
          navigation: [...document.querySelectorAll('.site-header nav a')].map(el => { const r = el.getBoundingClientRect(); return { x: r.x, right: r.right, y: r.y, bottom: r.bottom, height: r.height }; }),
          buttons: [...document.querySelectorAll('.site-header button')].filter(el => el.getBoundingClientRect().width).map(el => el.getBoundingClientRect().height),
          cards: [...document.querySelectorAll('.portfolio-card')].map(el => ({bottom:el.getBoundingClientRect().bottom, textBottom:Math.max(...[...el.querySelectorAll('h3,p')].map(child => child.getBoundingClientRect().bottom))})),
          headings: [...document.querySelectorAll('h1,h2,h3')].filter(el => el.getBoundingClientRect().width).map(el => ({ width: el.clientWidth, scroll: el.scrollWidth }))
        }));
        assert.ok(geometry.overflow <= 1, `${width}/${language}/${theme}: horizontal overflow`);
        for (const r of geometry.navigation) { assert.ok(r.x >= 0 && r.right <= width + 1); assert.ok(r.height >= 44); }
        for (const height of geometry.buttons) assert.ok(height >= 44);
        for (const card of geometry.cards) assert.ok(card.textBottom <= card.bottom + 1, `${width}: card text clipped`);
        for (const h of geometry.headings) assert.ok(h.scroll <= h.width + 1, `${width}: heading clipped`);
        const nav = geometry.navigation;
        for (let i = 1; i < nav.length; i++) assert.ok(nav[i].x >= nav[i - 1].right || nav[i].y >= nav[i - 1].bottom, 'Overlapping navigation');
      }
    }
    await page.locator('[data-language="hu"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'hu');
    await page.locator('.hero-actions a[href="#contact"]').click();
    await page.waitForFunction(() => location.hash === '#contact');
    assert.ok(await page.locator('#contact-title').isVisible());
    assert.ok((await page.locator('#contact').boundingBox()).y >= 56, 'Contact hidden behind top glass');
    assert.equal(await page.locator('#quote-service').count(), 0);
    let mail = new URL(await page.locator('#quote-mail').getAttribute('href'));
    assert.match(mail.searchParams.get('subject'), /Grafikai tervezés/);
    assert.match(mail.searchParams.get('body'), /határidő/);
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('[data-language="en"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    mail = new URL(await page.locator('#quote-mail').getAttribute('href'));
    assert.match(mail.searchParams.get('subject'), /Graphic design/);
    assert.match(mail.searchParams.get('body'), /deadline/i);
    const question = page.locator('.faq summary').first();
    await question.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.faq details').first().getAttribute('open'), '');
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.faq details').first().getAttribute('open'), null);
    for (const href of await page.locator('.service-jump a').evaluateAll(links => links.map(el => el.getAttribute('href')))) assert.equal(await page.locator(href).count(), 1);
    assert.deepEqual(errors, []);
    console.log(`UX: ${width}px, both languages/themes, navigation, headings, minimal contact, quote email and keyboard FAQ passed.`);
    await page.close();
  }
  const page = await browser.newPage({ javaScriptEnabled: false });
  await page.goto(base);
  const mail = new URL(await page.locator('#quote-mail').getAttribute('href'));
  assert.match(mail.searchParams.get('subject'), /Ajánlatkérés/);
  assert.match(mail.searchParams.get('body'), /határidő/);
  console.log('UX: quote email remains usable without JavaScript. No email was sent.');
} finally { await browser.close(); }
