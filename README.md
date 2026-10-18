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
  theme controls, the ten-step design carousel, accessibility labels, page titles,
  metadata and persistence.
- `src/translations.json`: Hungarian and English text, keyed by HTML `data-i18n`.
- `index.html`, `packaging.html`: semantic content and fallback English copy.
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
served with a version query in both HTML files; bump that query on a new release.

The generated files are checked in so the existing Cloudflare Pages configuration
continues to work: **framework None, empty build command, output directory `.`**.
Pushing to `main` triggers the existing automatic deployment. No Rust server or
new hosting service is required. The root `functions/` directory retains the
Cloudflare Pages country middleware.

The eight portfolio entries come from the designer's Upwork portfolio and are
non-clickable cards. The contact section provides a separate Upwork profile link. Their graphic covers are placeholders, not original project
images. Contact: `jrepas@icloud.com`.

## Typography

The Adobe Fonts web-project stylesheet is `https://use.typekit.net/qtn2utl.css`,
loaded by both HTML pages. Heading font stacks use `ivypresto-display` and body
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
