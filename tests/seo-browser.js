import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { launchBrowser } from './browser.js';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const copy = JSON.parse(await readFile(new URL('../content/translations.json', import.meta.url), 'utf8'));
const browser = await launchBrowser();
try {
  const context = await browser.newContext({ javaScriptEnabled: false });
  for (const [path, titleKey, descriptionKey] of [['/', '134', '135']]) {
    const page = await context.newPage();
    const response = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    assert.equal(response.status(), 200);
    assert.equal(await page.locator('html').getAttribute('lang'), 'hu');
    assert.equal(await page.title(), copy[titleKey].hu);
    assert.equal(await page.locator('meta[name="description"]').getAttribute('content'), copy[descriptionKey].hu);
    assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), 'https://jrepas.hu' + (path === '/' ? '/' : '/packaging'));
    assert.equal(await page.locator('h1').count(), 1);
    assert.ok((await page.locator('h1').textContent()).length > 5);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'index, follow, max-image-preview:large');
    assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), copy[titleKey].hu);
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    assert.equal(schema['@context'], 'https://schema.org');
    assert.ok(schema['@graph'].some(entity => entity['@type'] === 'Person' && entity.name === 'Répás János'));
    assert.ok(schema['@graph'].some(entity => entity['@type'] === 'WebPage' && entity.url === 'https://jrepas.hu' + (path === '/' ? '/' : '/packaging')));
    if (path === '/') {
      assert.equal(await page.locator('.portfolio-card').count(), 8);
      assert.match(await page.locator('.about-body').textContent(), /Répás János/);
      assert.match(await page.locator('.work-intro').textContent(), /grafikai szolgáltatások/);
      assert.equal(await page.locator('a[href="/packaging"], a[href="packaging.html"]').count(), 0);
      const service = schema['@graph'].find(entity => entity['@type'] === 'Service');
      assert.equal(service.hasOfferCatalog.itemListElement.length, 8);
    }
    await page.close();
  }
  await context.close();
  const page = await browser.newPage({ locale: 'hu-HU' });
  for (const [path, titleKey, descriptionKey] of [['/', '134', '135']]) {
    await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('html[data-runtime="javascript"]');
    await page.locator('[data-language="en"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.equal(await page.title(), copy[titleKey].en);
    assert.equal(await page.locator('meta[property="og:description"]').getAttribute('content'), copy[descriptionKey].en);
    assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), 'en_US');
  }
  const robotsResponse = await page.request.get(base + '/robots.txt');
  assert.equal(robotsResponse.status(), 200);
  const robots = await robotsResponse.text();
  assert.match(robots, /Allow: \/\n/);
  assert.match(robots, /Sitemap: https:\/\/jrepas.hu\/sitemap.xml/);
  const sitemapResponse = await page.request.get(base + '/sitemap.xml');
  assert.equal(sitemapResponse.status(), 200);
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, /<loc>https:\/\/jrepas.hu\/<\/loc>/);
  assert.ok(!sitemap.includes('/packaging'));
  assert.equal((await page.request.get(base + '/images/social-preview.jpg')).status(), 200);
  await page.goto(base + '/404.html');
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex, follow');
  const redirects = await readFile(new URL('../_redirects', import.meta.url), 'utf8');
  assert.match(redirects, /^\/index.html \/ 301/m);
  if (process.env.TEST_EDGE_STATUS === '1') {
    const index = await page.request.get(base + '/index.html?source=seo-check', { maxRedirects: 0 });
    assert.equal(index.status(), 301);
    assert.equal(new URL(index.headers().location, base).pathname, '/');
    assert.equal(new URL(index.headers().location, base).search, '?source=seo-check');
    for (const path of ['/packaging', '/packaging/', '/packaging.html']) {
      const oldCase = await page.request.get(base + path + '?source=old-link', { maxRedirects: 0 });
      assert.equal(oldCase.status(), 301);
      const target = new URL(oldCase.headers().location, base);
      assert.equal(target.pathname, '/');
      assert.equal(target.hash, '#service-packaging');
      assert.equal(target.search, '?source=old-link');
    }
    const missing = await page.request.get(base + '/not-a-real-page-seo-check');
    assert.equal(missing.status(), 404);
    assert.match(await missing.text(), /Az oldal nem található/);
    console.log('Cloudflare route statuses: home redirect, retired packaging page redirects and real 404 passed.');
  }
  console.log('SEO: Hungarian content without JavaScript, page metadata/schema, canonical URLs, sitemap, robots, social image and translated metadata passed.');
} finally {
  await browser.close();
}
