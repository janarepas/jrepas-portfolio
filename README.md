# jrepas.com

Static portfolio site (HTML/CSS) for Cloudflare Pages.

## Local preview

From this directory run `python3 -m http.server 8000` and visit http://localhost:8000.

## Git

```sh
git init
git add .
git commit -m "Initial jrepas.com website"
git branch -M main
```

Create an empty GitHub repository named `jrepas.com`, then:

```sh
git remote add origin https://github.com/YOUR_USERNAME/jrepas.com.git
git push -u origin main
```

## Cloudflare Pages

Create a Pages project using **Import an existing Git repository**. Select the repository.
- Framework preset: None
- Build command: leave blank
- Build output directory: `.`

Once deployed, add the custom domain `jrepas.com` under the Pages project's Custom domains settings and follow Cloudflare's DNS instructions. Do not change nameservers before verifying the required DNS setup with your domain registrar.

## Later CMS

Choose and configure the CMS separately; do not expose an admin interface without authentication.
