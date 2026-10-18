// Canonical home redirect and country detection; no database or authentication.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (['/packaging', '/packaging/', '/packaging.html'].includes(url.pathname)) {
    url.pathname = '/';
    url.hash = 'service-packaging';
    return Response.redirect(url.href, 301);
  }
  if (url.pathname === '/index.html') {
    url.pathname = '/';
    return Response.redirect(url.href, 301);
  }
  const response = await next();
  if (!response.headers.get('content-type')?.includes('text/html')) return response;
  const country = request.cf?.country;
  const knownCountry = typeof country === 'string' && /^[A-Z]{2}$/.test(country) && !['XX', 'T1'].includes(country);
  if (!knownCountry) return response;
  const localized = new HTMLRewriter().on('html', {
    element(element) {
      element.setAttribute('data-country', country);
    },
  }).transform(response);
  localized.headers.set('Cache-Control', 'private, no-store');
  return localized;
}
