# Browser language selection

## Implementation

Branch: `feat/intelligent-language-selection`, based on `main` (`52428b6`). No general development branch exists; existing topic branches were not used as the base.

`language.js` is a small, same-origin bootstrap used by the homepage, About page and printable CV. It selects the existing translations in this order:

1. Valid explicit `jrepas-language-choice` from localStorage.
2. The first supported primary language in `navigator.languages`, accepting HU/EN region variants. `navigator.language` is used when the preference list is missing or empty.
3. English.

Only a manual HU/EN action writes the preference. Clicking the already-active language also records the explicit choice. With unavailable storage, selection remains usable for the current page; persistence across visits is unavailable by browser design. A browser `languagechange` event re-evaluates automatic selection on the public pages without overriding a manual choice.

The existing dictionaries, translation text, fonts, colors, page geometry and animation files are unchanged. The Cloudflare middleware retains canonical redirects and no longer injects country data or disables HTML caching for language detection.

## First paint and accessibility

The bootstrap executes in the head before body parsing and updates `html[lang]`. English startup temporarily uses `visibility:hidden` on the body until the existing renderer has applied translations. Visibility does not alter layout geometry. No language redirect, duplicate page or external service is introduced.

A three-second guard fails open to the Hungarian static source if the renderer cannot load; the fallback also restores `lang=hu`. Without JavaScript, the existing Hungarian HTML remains visible. The CV releases the guard as soon as localized content is present, without waiting for image decoding.

The public HU/EN controls keep their existing accessible names and receive mutually exclusive `aria-pressed` states. Canonical URLs remain unchanged. There are no separate language URLs, so no fabricated hreflang links were added. Existing homepage title, description and Open Graph localization are retained.

## Validation — 2026-10-31

Runtime: bundled Node.js and Playwright with installed Brave/Chromium, served locally on port 8001.

- `node tests/language-unit.js`: passed. Priority, supported variants, unsupported-first preference lists, fallback, invalid saved preferences, blocked storage, explicit selection, ready guard and country-independent middleware/canonical redirects.
- `node tests/language-browser.js`: passed. 66 page cases across 390px mobile and 1440px desktop, covering homepage, About and CV. Also checks explicit switching, reload/new-page persistence, languagechange, delayed English render without visible Hungarian source, renderer failure, no-JavaScript visibility, selected-control accessibility, canonical URLs and absent hreflang links.
- `node tests/runtime-browser.js`: passed. Country-independent browser selection, saved choices, blocked storage, system theme, rapid language/theme switching and no WASM requests.
- `node tests/seo-browser.js`: passed. Static Hungarian source, metadata/schema, canonical URLs, robots, sitemap, translated metadata and existing redirects.
- JavaScript syntax checks and `git diff --check`: passed.

Reproduce with `npm ci`, `npx playwright install chromium`, a local HTTP server, then `npm run test:language`, `npm run test:runtime` and `npm run test:seo`. `TEST_BASE_URL` and `CHROMIUM_EXECUTABLE_PATH` can override the defaults. The new language browser suite also runs its unit checks and is included in `npm run test:all`.

Only the relevant suites above were run locally; the complete browser matrix is configured for the existing PR workflow. No main merge or production deployment is authorized by this task.
