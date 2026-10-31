import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { onRequest } from '../functions/_middleware.js';
const code = readFileSync(new URL('../language.js', import.meta.url), 'utf8');
function boot(languages, saved, blocked = false, fallback = 'en-US') {
  const attrs = new Map();
  const root = { lang: 'hu', setAttribute: (k, v) => attrs.set(k, v), removeAttribute: k => attrs.delete(k) };
  const storage = new Map(saved ? [['jrepas-language-choice', saved]] : []);
  const context = { document: { documentElement: root }, navigator: { languages, language: fallback }, window: {}, setTimeout: () => 1, clearTimeout() {} };
  Object.defineProperty(context, 'localStorage', { get() {
    if (blocked) throw Error('unavailable');
    return { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) };
  } });
  vm.runInNewContext(code, context);
  return { api: context.window.jrepasLanguage, root, attrs, storage, navigator: context.navigator };
}
for (const [list, saved, expected] of [
  [['hu-HU'], null, 'hu'], [['en-US'], null, 'en'], [['de-DE'], null, 'en'],
  [['de-DE', 'hu-HU', 'en-US'], null, 'hu'], [['fr', 'en-GB', 'hu'], null, 'en'],
  [['hu-RO'], null, 'hu'], [['en-AU'], null, 'en'], [['en-US'], 'hu', 'hu'],
  [['hu-HU'], 'en', 'en'], [['hu-HU'], 'invalid', 'hu'], [[], null, 'en'],
]) assert.equal(boot(list, saved).api.resolve(), expected);
assert.equal(boot(undefined, null, false, 'hu-HU').api.resolve(), 'hu');
assert.equal(boot(['fr', 'hu-HU'], null, true).api.resolve(), 'hu');
const locked = boot(['en-US']);
assert.equal(locked.attrs.has('data-language-pending'), true);
locked.api.ready(); assert.equal(locked.attrs.has('data-language-pending'), false);
assert.equal(locked.api.choose('hu'), true);
assert.equal(locked.storage.get('jrepas-language-choice'), 'hu');
locked.navigator.languages = ['en-GB']; assert.equal(locked.api.resolve(), 'hu');
assert.equal(locked.api.choose('de'), false);
const blocked = boot(['hu'], null, true); blocked.api.choose('en'); assert.equal(blocked.api.resolve(), 'en');
const response = new Response('content', { headers: { 'content-type': 'text/html' } });
assert.equal(await onRequest({ request: { url: 'https://jrepas.hu/', cf: { country: 'HU' } }, next: async () => response }), response);
assert.equal(response.headers.get('cache-control'), null);
assert.equal((await onRequest({ request: { url: 'https://jrepas.hu/index.html' }, next() { throw Error('not reached'); } })).headers.get('location'), 'https://jrepas.hu/');
console.log('PASS: language priority, preference list, variants, fallback, manual persistence, blocked storage, startup guard and country-independent middleware.');
