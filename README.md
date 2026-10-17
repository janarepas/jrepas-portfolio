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
- `fonts/`: Cormorant Garamond Light for headings and DM Sans for body text; licenses included.
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

The eight portfolio entries come from the designer's Upwork portfolio and link
to the profile. Their graphic covers are placeholders, not original project
images. Contact: `jrepas@icloud.com`.
