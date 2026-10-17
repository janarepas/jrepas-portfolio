import { missingSettings, verifyAccess } from '../../lib/access.js';
import { json, readContent, validateContent } from '../../lib/content.js';

export async function handleAdmin(context, verify = verifyAccess) {
  const { request, env } = context;
  const missing = missingSettings(env);
  if (missing.length) return json({ error: 'Az admin aktiválásához még Cloudflare-beállítások szükségesek.', missing }, 503);
  let user;
  try { user = await verify(request, env); } catch { return json({ error: 'Belépés szükséges. Jelentkezz be a Cloudflare Access felületen.' }, 401); }
  const action = new URL(request.url).pathname.replace(/^\/admin\/api\/?/, '');
  try {
    if (request.method === 'GET' && action === 'content') {
      const [draft, published] = await Promise.all([readContent(env.SITE_DB, 'draft'), readContent(env.SITE_DB, 'published')]);
      return json({ user, draft, published });
    }
    if (request.method !== 'POST' || !['draft', 'publish'].includes(action)) return json({ error: 'Nem található művelet.' }, 404);
    if (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('X-Requested-With') !== 'jrepas-admin') return json({ error: 'Érvénytelen kérésforrás.' }, 403);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return json({ error: 'JSON-kérés szükséges.' }, 415);
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > 300000) return json({ error: 'Túl nagy tartalom.' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: 'Érvénytelen JSON.' }, 400); }
    if (!Number.isSafeInteger(body.revision) || body.revision < 0) return json({ error: 'Érvénytelen verzió.' }, 400);
    if (action === 'draft') {
      let content;
      try { content = validateContent(body.content); } catch (error) { return json({ error: error.message }, 400); }
      const result = await env.SITE_DB.prepare("UPDATE site_content SET content_json = ?, revision = revision + 1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), updated_by = ? WHERE id = 'draft' AND revision = ?").bind(JSON.stringify(content), user.email, body.revision).run();
      if (result.meta.changes !== 1) return json({ error: 'A piszkozatot közben másik ablakban módosítottad. Töltsd újra az adatokat a felülírás helyett.' }, 409);
    } else {
      const result = await env.SITE_DB.prepare("INSERT INTO site_content (id, content_json, revision, updated_at, updated_by) SELECT 'published', content_json, revision, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), ? FROM site_content WHERE id = 'draft' AND revision = ? ON CONFLICT(id) DO UPDATE SET content_json = excluded.content_json, revision = excluded.revision, updated_at = excluded.updated_at, updated_by = excluded.updated_by").bind(user.email, body.revision).run();
      if (result.meta.changes !== 1) return json({ error: 'A piszkozat verziója megváltozott. Mentsd újra publikálás előtt.' }, 409);
    }
    return json({ draft: await readContent(env.SITE_DB, 'draft'), published: await readContent(env.SITE_DB, 'published') });
  } catch (error) {
    console.error('Admin content operation failed:', error.message);
    return json({ error: 'Az adatbázis nem elérhető. Ellenőrizd a SITE_DB kötést és az adatbázis-migrációt.' }, 503);
  }
}
export const onRequest = context => handleAdmin(context);
