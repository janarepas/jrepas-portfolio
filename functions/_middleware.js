// Canonical redirects; language is selected from browser preferences on the client.
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
  return next();
}
