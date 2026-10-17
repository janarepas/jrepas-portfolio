import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { database } from './helpers/database.js';
import { handleAdmin } from '../functions/admin/api/[[path]].js';
import { readContent, siteContentScript } from '../functions/lib/content.js';

// Browser integration fixture: the real API handlers and real SQLite storage,
// with an authenticated user supplied by the test. Production has no bypass.
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const db=database();const env={SITE_DB:db,CF_ACCESS_TEAM_DOMAIN:'browser-tests.cloudflareaccess.com',CF_ACCESS_AUD:'tests'};
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
try {
 const context=await browser.newContext({locale:'hu-HU'});const errors=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==base)return route.continue();
  if(url.pathname.startsWith('/admin/api/')){
   const incoming=route.request();const response=await handleAdmin({env,request:new Request(incoming.url(),{method:incoming.method(),headers:incoming.headers(),body:incoming.postData()||undefined})},async()=>({email:'owner@example.com',sub:'owner'}));
   return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  }
  if(url.pathname==='/'||url.pathname==='/index.html'){
   const response=await route.fetch({url:url.origin+'/index.html'});const mode=url.searchParams.get('admin-preview')==='1'?'draft':'published';const content=(await readContent(db,mode)).content;
   return route.fulfill({response,body:(await response.text()).replace(/<script type="application\/json" id="site-content">[\s\S]*?<\/script>/g,'').replace('</head>',siteContentScript(content)+'</head>')});
  }
  return route.continue();
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/admin/');await page.waitForSelector('.state-chip.ready');
 await page.locator('#text-7').fill('Új főcím\nAz adminból');
 await page.click('[data-edit-language="en"]');assert.equal(await page.locator('#text-7').inputValue(),'Ideas\nin focus.');
 await page.locator('#text-8').fill('Edited English introduction.');
 await page.click('#save');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Piszkozat elmentve'));
 assert.deepEqual((await readContent(db,'published')).content.translations,{});
 assert.equal((await readContent(db,'draft')).content.translations['7'].hu,'Új főcím\nAz adminból');
 const popupPromise=page.waitForEvent('popup');await page.click('#preview');const preview=await popupPromise;await preview.waitForSelector('html[data-runtime="rust-wasm"]');await preview.click('[data-language="hu"]');await preview.waitForFunction(()=>document.documentElement.lang==='hu');assert.equal(await preview.locator('h1').innerText(),'Új főcím\nAz adminból');await preview.close();
 await page.click('#publish');await page.click('#publish-dialog button[value="publish"]');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.startsWith('Közzétéve.'));
 assert.equal((await readContent(db,'published')).content.translations['8'].en,'Edited English introduction.');
 const live=await context.newPage();await live.goto(base+'/');await live.waitForSelector('html[data-runtime="rust-wasm"]');await live.click('[data-language="hu"]');await live.waitForFunction(()=>document.documentElement.lang==='hu');assert.equal(await live.locator('h1').innerText(),'Új főcím\nAz adminból');await live.close();
 await page.click('[data-section="work"]');await page.fill('#image-portfolio-0','/images/hero-focus.webp');await page.click('#save');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Piszkozat elmentve'));
 const picture=await context.newPage();await picture.goto(base+'/?admin-preview=1');await picture.waitForSelector('.portfolio-card .managed-image');assert.equal(await picture.locator('.portfolio-card .managed-image').getAttribute('src'),'/images/hero-focus.webp');await picture.close();
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`admin overflow ${width}`);}
 await page.click('[data-section="contact"]');await page.fill('#setting-email','studio@example.com');await page.click('#save');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Piszkozat elmentve'));
 const contact=await context.newPage();await contact.goto(base+'/?admin-preview=1');await contact.waitForSelector('html[data-runtime="rust-wasm"]');assert.equal(await contact.locator('.contact-email').innerText(),'studio@example.com');assert((await contact.locator('.contact-email').getAttribute('href')).includes('studio%40example.com'));await contact.close();
 const publishedRevision=(await readContent(db,'published')).revision;await page.click('#publish');await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#publish-dialog').open);assert.equal((await readContent(db,'published')).revision,publishedRevision);
 await page.click('[data-section="about"]');await page.fill('#text-22','<img src=x onerror="window.adminXss=true">');await page.click('#save');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('Piszkozat elmentve'));
 const safe=await context.newPage();await safe.goto(base+'/?admin-preview=1');await safe.waitForSelector('html[data-runtime="rust-wasm"]');await safe.click('[data-language="en"]');await safe.waitForFunction(()=>document.documentElement.lang==='en');assert.equal(await safe.locator('[data-i18n="22"] img').count(),0);assert((await safe.locator('[data-i18n="22"]').innerText()).includes('<img'));assert.equal(await safe.evaluate(()=>window.adminXss),undefined);await safe.close();
 db.prepare("UPDATE site_content SET revision=revision+1 WHERE id='draft'").run();await page.fill('#text-22','Ütköző változat');await page.click('#save');await page.waitForFunction(()=>document.querySelector('#feedback').textContent.includes('másik ablakban'));assert.notEqual((await readContent(db,'draft')).content.translations['22'].en,'Ütköző változat');
 assert.deepEqual(errors,[]);await context.close();
 const unavailable=await browser.newContext();await unavailable.route('**/admin/api/content',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Beállítás szükséges',missing:['SITE_DB']})}));const locked=await unavailable.newPage();await locked.goto(base+'/admin/');await locked.waitForSelector('#connection-panel:not([hidden])');assert.equal(await locked.locator('#save').isDisabled(),true);assert((await locked.locator('#missing-settings').innerText()).includes('SITE_DB'));await unavailable.close();
 console.log('PASS: bilingual admin editing, draft isolation, preview, explicit publication, images, safe text rendering, stale-write conflict, mobile layout and locked setup state.');
} finally { await browser.close();db.close(); }
