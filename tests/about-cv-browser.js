import assert from 'node:assert/strict';
import { launchBrowser } from './browser.js';
import { mkdir } from 'node:fs/promises';
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000';
const browser = await launchBrowser();
try {
 const page = await browser.newPage({reducedMotion:'reduce'});
 const errors=[];page.on('pageerror', e=>errors.push(e.message));
 for(const width of [320,375,768,1440,1920]) {
  await page.setViewportSize({width,height:1000});await page.goto(`${base}/rolam/`);await page.evaluate(()=>document.fonts.ready);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Overflow at ${width}`);
  assert.equal(await page.locator('.work-gallery-card a').count(),4);
  assert.equal(await page.locator('.resume-software li').count(),14);
   assert.equal(await page.locator('.resume-environment').evaluate(img=>img.complete&&img.naturalWidth>=1700),true);
  assert.equal(await page.locator('.resume-portrait img').count(),1);
  }
 await page.locator('[data-language="en"]').click();assert.match(await page.locator('.resume-summary').innerText(),/Over 15 years of experience/);
 await page.locator('.theme-toggle').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await page.locator('.cv-save').first().click();await page.waitForSelector('html[data-ready="true"]');
 assert.equal(await page.locator('.cv-sheet').count(),2);assert.equal(await page.locator('.resume-job').count(),4);
 assert.equal(await page.locator('.resume-software li').count(),14);assert.equal(await page.locator('.work-gallery').count(),0);
 await page.evaluate(()=>{window.print=()=>{document.documentElement.dataset.printCalled='true';};});await page.locator('#print').click();assert.equal(await page.locator('html').getAttribute('data-print-called'),'true');
 await page.emulateMedia({media:'print'});
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.cv-sheet')].every(sheet=>sheet.scrollHeight<=sheet.clientHeight+1)),true);
 await mkdir('output/pdf',{recursive:true});await page.pdf({path:'output/pdf/Repas_Janos_CV_HU.pdf',preferCSSPageSize:true,printBackground:true});
 await page.route('**/rolam/',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replaceAll('2025–2026','2025–2027')});});
 await page.reload();await page.waitForSelector('html[data-ready="true"]');assert.match(await page.locator('#cv').innerText(),/2025–2027/);
 await page.unroute('**/rolam/');await page.route('**/rolam/',route=>route.fulfill({status:503,body:'Unavailable'}));await page.reload();await page.waitForFunction(()=>document.querySelector('#cv').textContent.includes('nem tölthető be'));assert.equal(await page.locator('#print').isDisabled(),true);
 assert.deepEqual(errors,[]);console.log('About/CV: responsive sizes, portrait, links, software, language, theme, print, fresh content and failure state passed.');
} finally {await browser.close();}
