import defaults from '../../src/translations.json' with { type: 'json' };

export const EMPTY_CONTENT = { translations: {}, images: {}, settings: {} };
const imageKeys = new Set(['hero', ...Array.from({ length: 8 }, (_, i) => `portfolio-${i}`), ...Array.from({ length: 10 }, (_, i) => `carousel-${i}`)]);
export function validateContent(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Érvénytelen tartalom.');
  if (Object.keys(value).some(key => !['translations', 'images', 'settings'].includes(key))) throw new Error('Ismeretlen tartalommező.');
  const result = { translations: {}, images: {}, settings: {} };
  for (const field of ['translations', 'images']) {
    if (!value[field] || typeof value[field] !== 'object' || Array.isArray(value[field])) throw new Error('Hiányzó tartalommező.');
  }
  for (const [key, entry] of Object.entries(value.translations)) {
    if (!Object.hasOwn(defaults, key) || !entry || typeof entry !== 'object' || Array.isArray(entry)) throw new Error('Ismeretlen szövegmező.');
    if (Object.keys(entry).some(lang => !['hu', 'en'].includes(lang))) throw new Error('Ismeretlen nyelv.');
    result.translations[key] = {};
    for (const [lang, text] of Object.entries(entry)) {
      if (typeof text !== 'string' || text.length > 5000 || text.includes('\0')) throw new Error('Egy szöveg legfeljebb 5000 karakter lehet.');
      result.translations[key][lang] = text;
    }
  }
  const imageSource = value.images;
  for (const [key, value] of Object.entries(imageSource)) {
    if (!imageKeys.has(key) || typeof value !== 'string' || value.length > 2048) throw new Error('Érvénytelen képmező.');
    if (!value) continue;
    if (value.startsWith('/') && !value.startsWith('//') && !value.includes('\\') && !/[\x00-\x20]/.test(value)) {
      result.images[key] = value;
    } else {
      let url;
      try { url = new URL(value); } catch { throw new Error('A kép címe HTTPS-hivatkozás vagy / kezdetű helyi útvonal legyen.'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Csak HTTPS-képcím használható.');
      result.images[key] = url.href;
    }
  }
  const settings = value.settings || {};
  if (typeof settings !== 'object' || Array.isArray(settings)) throw new Error('Érvénytelen kapcsolati adatok.');
  for (const [key, text] of Object.entries(settings)) {
    if (!['email', 'upworkUrl'].includes(key) || typeof text !== 'string') throw new Error('Ismeretlen kapcsolati adat.');
    if (key === 'email' && (text.length > 254 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(text))) throw new Error('Érvénytelen e-mail-cím.');
    if (key === 'upworkUrl') {
      let url; try { url = new URL(text); } catch { throw new Error('Érvénytelen Upwork-profilcím.'); }
      if (url.protocol !== 'https:' || !['www.upwork.com', 'upwork.com'].includes(url.hostname) || !url.pathname.startsWith('/freelancers/') || url.username || url.password) throw new Error('Upwork freelancer-profil linkjét add meg.');
    }
    result.settings[key] = text;
  }
  return result;
}
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function readContent(db, id) {
  if (!db) return { content: structuredClone(EMPTY_CONTENT), revision: 0, updatedAt: null, updatedBy: null };
  const row = await db.prepare('SELECT content_json, revision, updated_at, updated_by FROM site_content WHERE id = ?').bind(id).first();
  return row ? { content: validateContent(JSON.parse(row.content_json)), revision: row.revision, updatedAt: row.updated_at, updatedBy: row.updated_by } : { content: structuredClone(EMPTY_CONTENT), revision: 0, updatedAt: null, updatedBy: null };
}
export function siteContentScript(content) {
  // Escape the HTML parser's closing-tag boundary; text is rendered as text by Rust.
  const data = JSON.stringify(content).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  return `<script type="application/json" id="site-content">${data}</script>`;
}
