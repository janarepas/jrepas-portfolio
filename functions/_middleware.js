// Country detection only: the public site needs no database or authentication.
export async function onRequest({ request, next }) {
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const country = request.cf?.country;
  const knownCountry = typeof country === 'string' && /^[A-Z]{2}$/.test(country) && !['XX', 'T1'].includes(country);
  if (!knownCountry) return response;
  const localized = new HTMLRewriter().on('html', {
    element(element) {
      element.setAttribute('data-country', country);
      element.setAttribute('lang', country === 'HU' ? 'hu' : 'en');
    },
  }).transform(response);
  localized.headers.set('Cache-Control', 'private, no-store');
  return localized;
}
