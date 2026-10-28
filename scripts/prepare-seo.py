#!/usr/bin/env python3
"""Keep indexable Hungarian HTML and search metadata in sync with the copy."""
from pathlib import Path
import html
import json
import re
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[1]
COPY = json.loads((ROOT / 'content/translations.json').read_text())
BASE = 'https://jrepas.hu'
IMAGE = BASE + '/images/social-preview.jpg'
PERSON = {'@type': 'Person', '@id': BASE + '/#janos-repas', 'name': 'Répás János',
          'url': BASE + '/', 'jobTitle': 'Grafikus és webdesigner',
          'email': 'hello@jrepas.hu', 'sameAs': ['https://www.upwork.com/freelancers/jrepas', 'https://www.behance.net/jrepas'],
          'knowsAbout': ['Grafikai tervezés', 'Vektorgrafika', 'Csomagolástervezés',
                         'Nyomdai előkészítés', 'Kiadványszerkesztés', 'Digitális kreatívok']}

for filename, title_key, description_key in [('index.html', '134', '135')]:
    file = ROOT / filename
    source = file.read_text()
    # Preserve markup and layout, including inline SVGs, while replacing only copy.
    source = re.sub(r'(<([a-z][a-z0-9]*)\b[^>]*\bdata-i18n="(\d+)"[^>]*>).*?(</\2>)',
                    lambda m: m[1] + COPY[m[3]]['hu'] + m[4], source, flags=re.S)
    source = re.sub(r'(<html\b[^>]*\blang=")[^"]+', r'\g<1>hu', source)
    title, description = COPY[title_key]['hu'], COPY[description_key]['hu']
    url = BASE + '/'
    source = re.sub(r'<title>.*?</title>', '<title>' + html.escape(title) + '</title>', source, flags=re.S)
    source = re.sub(r'<meta name="description" content="[^"]*">',
                    '<meta name="description" content="' + html.escape(description, quote=True) + '">', source)
    source = re.sub(r'<!-- SEO:start -->.*?<!-- SEO:end -->\s*', '', source, flags=re.S)
    graph = [PERSON, {'@type': 'WebSite', '@id': BASE + '/#website', 'url': BASE + '/',
                     'name': 'jrepas.hu – Répás János', 'publisher': {'@id': PERSON['@id']},
                     'inLanguage': ['hu', 'en']},
             {'@type': 'WebPage', '@id': url + '#webpage', 'url': url, 'name': title,
              'description': description, 'inLanguage': 'hu',
              'isPartOf': {'@id': BASE + '/#website'}, 'about': {'@id': PERSON['@id']},
              'primaryImageOfPage': {'@type': 'ImageObject', 'url': IMAGE}}]
    if filename == 'index.html':
        graph.append({'@type': 'Service', '@id': BASE + '/#graphic-design',
                      'name': 'Grafikai tervezés', 'serviceType': 'Grafikai tervezés és nyomdai előkészítés',
                      'provider': {'@id': PERSON['@id']}, 'url': BASE + '/#work',
                      'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': 'Grafikai szolgáltatások',
                          'itemListElement': [
                              {'@type': 'Offer', 'itemOffered': {'@type': 'Service',
                               'name': COPY[str(key)]['hu'], 'description': COPY[str(key + 1)]['hu']}}
                              for key in range(50, 66, 2)]}})
    schema = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, separators=(',', ':'))
    esc = lambda value: html.escape(value, quote=True)
    metadata = f'''<!-- SEO:start -->
<link rel="canonical" href="{url}">
<meta name="robots" content="index, follow, max-image-preview:large">
<meta property="og:type" content="website">
<meta property="og:site_name" content="jrepas.hu">
<meta property="og:locale" content="hu_HU">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(description)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Répás János grafikai tervezés – sárga és fekete vizuális koncepció">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(description)}">
<meta name="twitter:image" content="{IMAGE}">
<script type="application/ld+json">{schema}</script>
<!-- SEO:end -->
'''
    source = source.replace('</head>', metadata + '</head>', 1)
    if 'rel="preconnect"' not in source:
        source = source.replace('<meta charset="utf-8">', '<meta charset="utf-8"><link rel="preconnect" href="https://use.typekit.net" crossorigin><link rel="preconnect" href="https://p.typekit.net" crossorigin>', 1)
    source = source.replace('href="index.html', 'href="/')
    source = source.replace('aria-label="Main navigation"', 'aria-label="Főmenü"')
    source = source.replace('aria-label="JREPAS home"', 'aria-label="JREPAS kezdőlap"')
    source = source.replace('aria-label="Design process"', 'aria-label="A tervezés folyamata"')
    source = source.replace('aria-label="Dark mode"', 'aria-label="Sötét mód"')
    source = source.replace('data-language="hu" aria-pressed="false"', 'data-language="hu" aria-pressed="true"')
    source = source.replace('data-language="en" aria-pressed="true"', 'data-language="en" aria-pressed="false"')
    source = source.replace('alt="Foldable Duo phone displaying yellow and black geometric artwork"',
                            'alt="Répás János grafikai koncepciója egy hajlítható telefon kijelzőjén"')
    source = source.replace('alt="Packaging design project"', 'alt="Csomagolásgrafika és nyomdai előkészítés – Répás János"')
    if filename == 'index.html':
        service = COPY['173']['hu']
        subject = COPY['166']['hu'] + ' – ' + service
        body = (COPY['167']['hu'] + '\n\n' + COPY['168']['hu'] + ': ' + service + '\n\n' +
                COPY['169']['hu'] + ':\n\n' + COPY['170']['hu'] + ':\n\n' + COPY['171']['hu'] + ':\n')
        href = 'mailto:hello@jrepas.hu?subject=' + quote(subject, safe='') + '&body=' + quote(body, safe='')
        source = re.sub(r'(<a id="quote-mail"[^>]*href=")[^"]*', lambda m: m[1] + html.escape(href, quote=True), source)
    file.write_text(source)

(ROOT / 'robots.txt').write_text('User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: https://jrepas.hu/sitemap.xml\n')
(ROOT / 'sitemap.xml').write_text('''<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://jrepas.hu/</loc></url>
</urlset>
''')
print('Prepared indexable Hungarian HTML, canonical metadata, schema, robots.txt and sitemap.xml.')

# Serve the same copy to the browser without a compiler or JSON fetch.
import hashlib
module = 'export default ' + json.dumps(COPY, ensure_ascii=False, separators=(',', ':')) + ';\n'
(ROOT / 'translations.js').write_text(module)
revision = hashlib.sha256(module.encode()).hexdigest()[:12]
site = ROOT / 'site.js'
site.write_text(re.sub(r"from './translations.js(?:\?v=[^']*)?'", "from './translations.js?v=" + revision + "'", site.read_text()))
