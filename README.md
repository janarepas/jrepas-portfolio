# JREPAS — Graphic design portfolio

**Thoughtful design. From a good idea.**

The bilingual portfolio of **János Répás**, graphic designer and webdesigner. Branding, packaging, editorial design, and digital campaign creatives — with more than ten years of experience.

[Visit the website](https://jrepas.hu/) · [Behance](https://www.behance.net/jrepas) · [Upwork](https://www.upwork.com/freelancers/jrepas)

## A simple website

The site uses **HTML, CSS, and plain JavaScript**. No application framework, Rust toolchain, WebAssembly, database, or application server is needed to serve the portfolio.

- Hungarian and English copy, with accessible language controls.
- Light and dark themes, system preferences, and saved manual choices.
- Eight illustrated services and a six-step design process.
- Animated FAQ answers, subtle scroll reveals, and reduced-motion support.
- Direct email quote requests with a localized message draft.
- Indexable HTML, structured data, canonical URLs, and social previews.
- Responsive images and local font fallbacks.

## Run locally

Use any static HTTP server. For example, with Python 3:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000**. The checked-in files are ready to serve; no build is needed to preview the site.

## Edit the site

| File | Purpose |
| --- | --- |
| `index.html` | Semantic page structure and default Hungarian content |
| `style.css` | Layout, typography, responsive styles, and themes |
| `site.js` | Language, theme, metadata, and email-link interactions |
| `content/translations.json` | Source for Hungarian and English copy |
| `translations.js` | Generated browser translation module |
| `motion.js` | Scroll effects and FAQ animations |
| `images/`, `fonts/` | Images and local fallback fonts |
| `assets/vendor/` | Locally served Lenis and its license |
| `functions/_middleware.js` | Cloudflare country detection and canonical redirects |

After editing translations, run:

```sh
npm run build
```

This requires **Python 3 and npm**. It synchronizes the default HTML, browser translations, search metadata, structured data, `robots.txt`, and `sitemap.xml`. Commit the generated files with the copy changes. JavaScript and CSS edits do not require compilation.

The main domain for search engines is **https://jrepas.hu/**. Country information supplied by Cloudflare determines the initial language; browser language is the fallback. Manual choices are stored locally. The static Hungarian content and email link remain usable without JavaScript.

## Checks

Browser checks require Node.js, npm dependencies, and Chromium at `/usr/bin/chromium`:

```sh
npm ci
npm test
npm run test:runtime
npm run test:seo
npm run test:ux
npm run test:motion
npm run test:faq
npm run test:sizing
```

Keep the local HTTP server running while testing. Set `TEST_BASE_URL` to use another address. The sizing checks cover 18 viewport widths from 320 to 2560 pixels in both languages and themes.

## Deployment

Cloudflare Pages serves the committed files from the `main` branch:

| Setting | Value |
| --- | --- |
| Framework | None |
| Build command | Empty |
| Output directory | `.` |

Push to `main` to trigger the connected deployment. The root `functions/` directory provides the Pages middleware; local static preview does not simulate Cloudflare country detection. Packaging design is part of the homepage, with redirects for the former standalone page.

## Typography and assets

Headings use IvyPresto Display and body copy uses Freight Text Pro through Adobe Fonts, with bundled DM Serif Display and DM Sans fallbacks. Adobe Fonts domain authorization is managed in the Adobe web project. Third-party font and Lenis licenses accompany their bundled files.

Contact: [jrepas@icloud.com](mailto:jrepas@icloud.com). Search Console setup and verification notes are in [docs/seo.md](docs/seo.md).
