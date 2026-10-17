const keyCache = new Map();
const decode = part => Uint8Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const parse = part => JSON.parse(new TextDecoder().decode(decode(part)));
export function missingSettings(env) {
  return ['SITE_DB', 'CF_ACCESS_TEAM_DOMAIN', 'CF_ACCESS_AUD'].filter(key => !env[key]);
}
export async function verifyAccess(request, env, fetcher = fetch) {
  const team = env.CF_ACCESS_TEAM_DOMAIN;
  const audience = env.CF_ACCESS_AUD;
  if (!team || !audience || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(team)) throw new Error('Access nincs beállítva.');
  const cookie = request.headers.get('cookie')?.split(';').map(value => value.trim()).find(value => value.startsWith('CF_Authorization='))?.slice('CF_Authorization='.length);
  const token = request.headers.get('Cf-Access-Jwt-Assertion') || cookie;
  if (!token || token.length > 16000) throw new Error('Belépés szükséges.');
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Érvénytelen belépés.');
  let header, claims;
  try { header = parse(parts[0]); claims = parse(parts[1]); } catch { throw new Error('Érvénytelen belépés.'); }
  const now = Date.now() / 1000;
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !audiences.includes(audience) || claims.iss !== `https://${team}` || typeof claims.exp !== 'number' || !Number.isFinite(claims.exp) || claims.exp <= now || (typeof claims.nbf === 'number' && claims.nbf > now + 60) || typeof claims.email !== 'string' || !claims.email || typeof claims.sub !== 'string' || !claims.sub) throw new Error('Érvénytelen vagy lejárt belépés.');
  let cached = keyCache.get(team);
  if (!cached || cached.expires < Date.now() || !cached.keys.some(key => key.kid === header.kid)) {
    const response = await fetcher(`https://${team}/cdn-cgi/access/certs`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('A belépés ellenőrzése nem elérhető.');
    const jwks = await response.json();
    if (!Array.isArray(jwks.keys)) throw new Error('Érvénytelen hitelesítési kulcsok.');
    cached = { keys: jwks.keys, expires: Date.now() + 300000 };
    keyCache.set(team, cached);
  }
  const jwk = cached.keys.find(key => key.kid === header.kid && key.kty === 'RSA');
  if (!jwk) throw new Error('Ismeretlen hitelesítési kulcs.');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
  if (!valid) throw new Error('Érvénytelen aláírás.');
  return { email: claims.email, sub: claims.sub };
}
