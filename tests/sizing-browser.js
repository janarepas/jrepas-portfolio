import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const widths = [320, 360, 390, 430, 600, 700, 701, 768, 820, 950, 1000, 1001, 1024, 1100, 1280, 1440, 1920, 2560];
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
try {
  const page = await browser.newPage({ locale: 'hu-HU', reducedMotion: 'reduce' });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.top-glass');
  await page.evaluate(() => document.fonts.ready);
  for (const language of ['hu', 'en']) {
    await page.locator(`[data-language="${language}"]`).click();
    for (const theme of ['light', 'dark']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('.theme-toggle').click();
      for (const width of widths) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(() => scrollTo(0, 0));
        const failures = await page.evaluate(() => {
          const errors = [];
          if (document.documentElement.scrollWidth > innerWidth + 1) errors.push('Horizontal page overflow');
          for (const element of document.querySelectorAll('h1,h2,h3,h4,p,label,select,.site-header a,.site-header button,.button')) {
            const rect = element.getBoundingClientRect();
            if (!rect.width || !rect.height) continue;
            const label = element.textContent.trim().slice(0, 60);
            // Native selects truncate the selected label while retaining the full option in their popup.
            if (!element.matches('select') && element.scrollWidth > element.clientWidth + 2) errors.push(`Text overflow: ${label}`);
            if (rect.left < -1 || rect.right > innerWidth + 1) errors.push(`Outside viewport: ${label}`);
            const card = element.closest('.portfolio-card,.process-step');
            if (card && rect.bottom > card.getBoundingClientRect().bottom + 1) errors.push(`Text below card: ${label}`);
          }
          const headerItems = [...document.querySelectorAll('.site-header .brand,.site-header nav,.site-header .site-controls')].map(el => el.getBoundingClientRect());
          for (let i = 0; i < headerItems.length; i++) {
            for (let j = i + 1; j < headerItems.length; j++) {
              const a = headerItems[i], b = headerItems[j];
              if (a.width && b.width && a.right > b.left && b.right > a.left && a.bottom > b.top && b.bottom > a.top) errors.push('Header items overlap');
            }
          }
          const header = document.querySelector('.site-header').getBoundingClientRect();
          const intro = document.querySelector('.hero-copy>.eyebrow').getBoundingClientRect();
          if (intro.top < header.bottom + 10) errors.push('Hero too close to header');
          for (const card of document.querySelectorAll('.portfolio-card:nth-child(-n+3)')) {
            const artwork = card.querySelector('.vector-reconstruction-art,.packaging-dielines-art,.cover-retail .cover-mark');
            const title = card.querySelector('.project-title');
            if (artwork && artwork.getBoundingClientRect().bottom > title.getBoundingClientRect().top - 8) errors.push(`Illustration too close to title: ${title.textContent}`);
          }
          const processCards = [...document.querySelectorAll('.process-step')].map(el => ({
            top: el.getBoundingClientRect().top,
            heading: el.querySelector('h3').getBoundingClientRect().top,
            text: el.querySelector('p').getBoundingClientRect().top
          }));
          for (const a of processCards) for (const b of processCards) {
            if (Math.abs(a.top - b.top) < 1 && (Math.abs(a.heading - b.heading) > 1 || Math.abs(a.text - b.text) > 1)) errors.push('Process card headings/descriptions are not aligned');
          }
          return errors;
        });
        assert.deepEqual(failures, [], `${width}px / ${language} / ${theme}`);
      }
      console.log(`Sizing: ${language}/${theme}, ${widths.length} widths (320–2560px), text bounds, cards, artwork and header passed.`);
    }
  }
} finally { await browser.close(); }
