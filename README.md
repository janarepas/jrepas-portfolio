# JREPAS portfolio

Bilingual graphic design portfolio for **jrepas.hu**. HTML and CSS provide the
content and design; the interactive application is written in **Rust**, compiled
to **WebAssembly** with wasm-bindgen. Cloudflare Pages serves the static files.

## Develop

Install Rust using rustup. `rust-toolchain.toml` pins the compiler and WebAssembly
target. Install the matching binding generator once:

```sh
cargo install wasm-bindgen-cli --version 0.2.104 --locked
```

From the checkout root:

```sh
cargo test --locked
./scripts/build.sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open the local server in a browser when developing locally. WebAssembly must be
served over HTTP, not opened directly as a `file:` URL.

- `src/lib.rs`: country/browser language selection, translations, language and
  theme controls, the six-step illustrated design process, accessibility labels, page titles,
  metadata and persistence.
- `src/translations.json`: Hungarian and English text, keyed by HTML `data-i18n`.
- `index.html`: semantic content and indexable Hungarian copy.
- `style.css`: responsive layout, both themes and self-hosted fonts.
- `fonts/`: DM Serif Display 400 Italic for headings and DM Sans for body text; licenses included.
- `scripts/build.sh`: locked release build and wasm-bindgen packaging.
- `assets/rust/<content-hash>/`: generated JavaScript bindings and `.wasm` binary.
- `site.js`: generated module loader; edit Rust instead of this file.
- `functions/_middleware.js`: small Cloudflare-specific middleware that supplies
  the visitor's country to Rust through the HTML `data-country` attribute.

A Hungarian visitor starts in Hungarian; other known countries use English.
Without country information, the browser language is used. The colour scheme
follows the browser until explicitly changed. Manual choices persist in local
storage. Static HTML remains readable if JavaScript/WebAssembly is unavailable.

## Build and deploy

After changing Rust or translations, run `./scripts/build.sh` and commit the
updated `site.js` and generated assets alongside the sources. Keep previous
hashed asset directories available for cached pages. The generated loader is
served with a version query in the HTML file; bump that query on a new release.

The generated files are checked in so the existing Cloudflare Pages configuration
continues to work: **framework None, empty build command, output directory `.`**.
Pushing to `main` triggers the existing automatic deployment. No Rust server or
new hosting service is required. The root `functions/` directory retains the
Cloudflare Pages country middleware.

The eight service entries are non-clickable illustrated cards. Their graphic
covers illustrate the services. The about section separately presents four real
Behance project covers, each linking to its corresponding project.
Contact: `jrepas@icloud.com`.

## Typography

The Adobe Fonts web-project stylesheet is `https://use.typekit.net/qtn2utl.css`,
loaded by the main HTML page. Heading font stacks use `ivypresto-display` and body
copy uses `freight-text-pro`. Bundled DM Serif Display Italic and DM Sans remain
fallbacks if Adobe Fonts is unavailable. Font files supplied through Adobe Fonts
are served by Adobe rather than copied into this repository.

Language changes use a short opacity fade. Theme changes apply immediately.
The colour palette defines three yellows and three dark tones; each yellow/dark
pair exceeds 4.5:1 text contrast.


## Content editing

The site runs without a database, admin panel or Cloudflare Access subscription.
Edit bilingual text in `src/translations.json`, structure in the HTML files, and
images in `images/`, then rebuild Rust assets when translations change.
Run `npm test` against the local HTTP server to check the public site.

## Scroll and progressive display

`motion.js` adds locally served Lenis 1.3.27 for smooth mouse-wheel scrolling;
touch scrolling stays native. Off-screen content reveals once as it enters the
viewport. Reduced-motion preferences disable interpolation and reveals. A masked
blur and theme-coloured fade soften the viewport top after scrolling. The transparent menu
scrolls away with the page, without its own background, border or blur. The vendor bundle and MIT license live in
`assets/vendor/lenis-1.3.27/`. Run `npm run test:motion` with the local server.

## Search and indexability

`scripts/prepare-seo.py` runs during the Rust build. It syncs the visible Hungarian
HTML from `src/translations.json`, with page-specific titles and descriptions,
canonical URLs on `https://jrepas.hu`, Open Graph/Twitter metadata, Schema.org
Person/WebSite/WebPage/Service data, `robots.txt` and `sitemap.xml`. The body is
readable without JavaScript; Rust preserves the existing language/theme controls.
The middleware only supplies visitor country, leaving the static HTML language
consistent until the client applies the selected language.

Run `npm run test:seo` against the local server. See [docs/seo.md](docs/seo.md) for
the Google Search Console submission and the limits of local verification.

## Quote-request journey

The hero and about CTAs lead to `#contact`, a short invitation with one email
button and a directly accessible email address. Rust prepares a localised
`mailto:` draft; the visitor sends it in their own email app. There is no form,
automatic submission, order checkout or payment. Static HTML includes the same
working default mail draft for JavaScript-free visits. Test the journey and both
languages/themes with `npm run test:ux`.

The former `/packaging` and `/packaging.html` pages redirect permanently to
`/#service-packaging`. Packaging design is presented only on the homepage and
the sitemap contains only the homepage.

## Responsive sizing checks

Run `npm run test:sizing` against the local HTTP server (`TEST_BASE_URL` overrides
the default port). This checks 18 viewport widths from 320 to 2560 CSS pixels in
both languages and themes, including the 700/701 and 1000/1001 breakpoints. It
asserts text/card containment, separation of service illustrations and titles,
header item bounds and spacing above the hero. Tests run in Chromium; native
select labels may truncate while their popup retains the full option text.

## Selected Behance work

The about section shows four real local Behance covers as separate image tiles
in a wider, gapless two-column grid (one full-width column on mobile). Tiles
have square corners, no visible captions, no gallery heading and no quote CTA. Each tile opens its own
project in a safe new tab. Accessible names are bilingual and 404/808px WebP
sources load lazily. Source URLs are recorded in `docs/portfolio-sources.json`.
Run `npm run test:portfolio` to verify image decoding, individual destinations,
layout and the JavaScript-free fallback.
