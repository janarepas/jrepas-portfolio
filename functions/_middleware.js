import { verifyAccess } from './lib/access.js';
import { readContent, siteContentScript } from './lib/content.js';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const preview = url.searchParams.get('admin-preview') === '1' && !url.pathname.startsWith('/admin');
  if (preview) {
    try { await verifyAccess(request, env); } catch { return new Response('Az előnézethez jelentkezz be a /admin felületen.', { status: 401, headers: { 'Cache-Control': 'no-store' } }); }
  }
  const response = await context.next();
  if (!response.headers.get('content-type')?.includes('text/html') || url.pathname.startsWith('/admin')) return response;
  const country = request.cf?.country;
  const knownCountry = typeof country === 'string' && /^[A-Z]{2}$/.test(country) && !['XX', 'T1'].includes(country);
  let content = null;
  if (env.SITE_DB) {
    try { content = (await readContent(env.SITE_DB, preview ? 'draft' : 'published')).content; }
    catch (error) {
      console.error('Content unavailable:', error.message);
      if (preview) return new Response('A piszkozat nem olvasható. Ellenőrizd az admin adatbázis-beállításait.', { status: 503 });
    }
  }
  const initialLanguage = knownCountry ? (country === 'HU' ? 'hu' : 'en') : (request.headers.get('Accept-Language')?.toLowerCase().startsWith('hu') ? 'hu' : 'en');
  const localized = new HTMLRewriter().on('html', {
    element(element) {
      if (preview) element.setAttribute('data-admin-preview', 'true');
      if (knownCountry) {
        element.setAttribute('data-country', country);
        element.setAttribute('lang', country === 'HU' ? 'hu' : 'en');
      }
    },
  }).on('[data-i18n]', {
    element(element) {
      const key = element.getAttribute('data-i18n');
      const text = content?.translations?.[key]?.[initialLanguage];
      if (typeof text === 'string') {
        element.setInnerContent(text, { html: false });
        element.setAttribute('data-managed-text', 'true');
      }
    },
  }).on('body', {
    element(element) { if (preview) element.prepend('<div class="admin-preview-banner">Piszkozat előnézete · Nem publikus <a href="/admin/">Vissza a szerkesztőhöz</a></div>', { html: true }); },
  }).on('head', {
    element(element) { if (content) element.append(siteContentScript(content), { html: true }); },
  }).transform(response);
  localized.headers.set('Cache-Control', 'private, no-store');
  return localized;
}
