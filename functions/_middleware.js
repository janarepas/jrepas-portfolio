// Cloudflare supplies the visitor country; no external geolocation service is needed.
export async function onRequest(context) {
  const response = await context.next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;

  const country = context.request.cf?.country;
  const knownCountry = typeof country === 'string' && /^[A-Z]{2}$/.test(country) && !['XX', 'T1'].includes(country);
  const localized = new HTMLRewriter().on('html', {
    element(element) {
      if (knownCountry) {
        element.setAttribute('data-country', country);
        element.setAttribute('lang', country === 'HU' ? 'hu' : 'en');
      }
    },
  }).transform(response);
  // Country-specific HTML must not be shared between visitors by caches.
  localized.headers.set('Cache-Control', 'private, no-store');
  return localized;
}
