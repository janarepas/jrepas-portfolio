# JREPAS portfolio

Static portfolio site for **jrepas.hu**, hosted with Cloudflare Pages and deployed from `janarepas/jrepas.com` (`main`).

## Local preview

Run `python3 -m http.server 8000` from this directory, then open `http://localhost:8000`.

## Deploy

Copy these files into the local repository, commit, and push to `main`. Cloudflare Pages builds automatically (framework: None; build command: empty; output directory: `.`).

## Content

- `index.html` — homepage
- `packaging.html` — packaging project page
- `style.css` — site design and responsive styles
- `images/packaging.jpg` — existing project image

The second and third portfolio cards are deliberately marked “Coming soon” until actual project images and details are available. The abstract hero graphic is made entirely in CSS; no external image dependency.

Contact email is currently set to `jrepas@icloud.com`. Verify or change it before publishing if necessary.
