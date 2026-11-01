#!/usr/bin/env python3
"""Bygger nettstedet fra src/ til dist/ (Vercel) og art/ (claude.ai-forhåndsvisning)."""
import os, re, shutil, sys

SRC = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(SRC)
NPM = os.path.join(ROOT, 'npm', 'node_modules')

def L(no, en):
    return f'<span class="no">{no}</span><span class="en">{en}</span>'

NAV = [('index.html', 'Hjem', 'Home'), ('om-oss.html', 'Om oss', 'About'), ('maskinpark.html', 'Maskinpark', 'Fleet'),
       ('referanser.html', 'Referanser', 'References'), ('galleri.html', 'Galleri', 'Gallery')]

def header(active, home):
    links = ''.join(f'<a href="{h}"{" aria-current=\"page\"" if h == active else ""}>{L(n, e)}</a>' for h, n, e in NAV)
    cta = f'<a class="btn" href="{"#kontakt" if home else "index.html#kontakt"}">{L("Be om befaring", "Request a site visit")}</a>'
    return f'''<header class="top">
  <a class="brand" href="index.html" aria-label="Kurt Sandnes AS">
    <img src="img/logo-maskin.png" alt="" width="60" height="31">
    <span><b><i>Maskinentreprenør</i> Kurt Sandnes AS</b><small>{L("Brøyting · Tromsø · siden 1997", "Snow clearing · Tromsø · since 1997")}</small></span>
  </a>
  <div class="right">
    <nav class="nav" id="nav" aria-label="Meny">{links}{cta}</nav>
    <button class="lang" type="button">EN</button>
  </div>
</header>'''

FOOTER = f'''<footer>
  <div class="wrap">
    <div class="foot">
      <div class="lockup"><img src="img/logo-maskin.png" alt="" width="140" height="72"><b>Maskinentreprenør<br>Kurt Sandnes AS</b></div>
      <div><h4>{L("Kontakt", "Contact")}</h4><p>Kurt Sandnes<br><a href="tel:+4790555989">905 55 989</a><br><a href="mailto:post@kurtsandnes.no">post@kurtsandnes.no</a></p></div>
      <div><h4>{L("Firmaadresse", "Company address")}</h4><p>Langsundveien 918<br>9130 Hansnes</p></div>
      <div><h4>{L("Verksted", "Workshop")}</h4><p>Alkevegen 10B<br>9015 Tromsø</p></div>
    </div>
    <div class="legal"><span>Org.nr. 989 510 800</span><span>{L("Etablert mars 1997", "Established March 1997")}</span><span>{L("Brøyting og vintervedlikehold i Tromsø", "Snow clearing and winter maintenance in Tromsø")}</span></div>
  </div>
</footer>'''

def mcta(home):
    k = '#kontakt' if home else 'index.html#kontakt'
    return f'<div class="mcta"><a class="btn" href="{k}">{L("Be om befaring", "Site visit")}</a><a class="btn ghost" href="tel:+4790555989">{L("Ring Kurt", "Call Kurt")}</a></div>'

def cta_band():
    return f'''<section class="band alt"><div class="wrap sec-head" style="margin-block:0">
  <p class="eyebrow">{L("Kontakt", "Contact")}</p>
  <h2>{L("Klar for vinteren?", "Ready for winter?")}</h2>
  <p class="lede">{L("Fortell oss hva du trenger, så avtaler vi en befaring.", "Tell us what you need and we will arrange a site visit.")}</p>
  <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:8px"><a class="btn" href="index.html#kontakt">{L("Be om befaring", "Request a site visit")}</a><a class="btn ghost" href="tel:+4790555989">905 55 989</a><a class="btn ghost" href="mailto:post@kurtsandnes.no">{L("Send oss en e-post", "Email us")}</a></div>
</div></section>'''

def page(name):
    raw = open(os.path.join(SRC, 'pages', name), encoding='utf-8').read()
    m = re.match(r'<!--\s*title:(.*?)\|\s*desc:(.*?)\|\s*home:(\d)\s*-->\n', raw)
    title, desc, home = m.group(1).strip(), m.group(2).strip(), m.group(3) == '1'
    body = raw[m.end():]
    body = body.replace('{{L(', '{{L(')
    body = re.sub(r'\{\{L\("(.*?)",\s*"(.*?)"\)\}\}', lambda mm: L(mm.group(1), mm.group(2)), body, flags=re.S)
    body = body.replace('{{CTA}}', cta_band())
    if '{{GALLERY}}' in body:
        import subprocess
        gdir = os.path.join(SRC, 'img', 'g'); items = []
        names = sorted(os.listdir(gdir)); f = [n for n in names if n.startswith('f')]; c = [n for n in names if n.startswith('c')]
        order = []
        while f or c:
            order += f[:3]; f = f[3:]
            order += c[:1]; c = c[1:]
        for n in order:
            w, h = subprocess.check_output(['identify', '-format', '%w %h', os.path.join(gdir, n)]).decode().split()
            items.append(f'<button type="button" aria-label="Vis større"><img src="img/g/{n}" alt="Fra vinterdriften" data-alt-en="From the winter work" width="{w}" height="{h}" loading="lazy"></button>')
        body = body.replace('{{GALLERY}}', ''.join(items))
    return title, desc, home, header(name, home) + '\n<main id="main">\n' + body + '\n</main>\n' + FOOTER + '\n' + mcta(home)

def fonts_css():
    faces = [('Big Shoulders Display', 'big-shoulders-display', [('600','normal'),('800','normal'),('900','normal')]),
             ('Barlow', 'barlow', [('400','normal'),('400','italic'),('500','normal'),('600','normal')]),
             ('IBM Plex Mono', 'ibm-plex-mono', [('400','normal'),('500','normal')])]
    out = []
    for fam, slug, vs in faces:
        for w, st in vs:
            for sub, rng in (('latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'),):
                fn = f'{slug}-{sub}-{w}-{st}.woff2'
                out.append(f"@font-face{{font-family:'{fam}';font-style:{st};font-weight:{w};font-display:swap;src:url(fonts/{fn}) format('woff2');unicode-range:{rng}}}")
    return '\n'.join(out), [(slug, f'{slug}-latin-{w}-{st}.woff2') for fam, slug, vs in faces for w, st in vs]

GFONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800;900&family=Barlow:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">'
CDN = ['https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js', 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js', 'https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js']
LOCAL = ['js/gsap.min.js', 'js/ScrollTrigger.min.js', 'js/lenis.min.js']

def build(target):
    out = os.path.join(ROOT, target)
    if os.path.isdir(out): shutil.rmtree(out)
    shutil.copytree(os.path.join(SRC, 'img'), os.path.join(out, 'img'))
    css = open(os.path.join(SRC, 'site.css'), encoding='utf-8').read()
    sitejs = open(os.path.join(SRC, 'site.js'), encoding='utf-8').read()
    filmjs = open(os.path.join(SRC, 'film.js'), encoding='utf-8').read()
    if target == 'dist':
        os.makedirs(os.path.join(out, 'js')); os.makedirs(os.path.join(out, 'fonts'))
        shutil.copy(os.path.join(NPM, 'gsap/dist/gsap.min.js'), os.path.join(out, 'js'))
        shutil.copy(os.path.join(NPM, 'gsap/dist/ScrollTrigger.min.js'), os.path.join(out, 'js'))
        shutil.copy(os.path.join(NPM, 'lenis/dist/lenis.min.js'), os.path.join(out, 'js'))
        ff, files = fonts_css()
        for slug, fn in files: shutil.copy(os.path.join(NPM, '@fontsource', slug, 'files', fn), os.path.join(out, 'fonts'))
        open(os.path.join(out, 'site.css'), 'w', encoding='utf-8').write(ff + '\n' + css)
        open(os.path.join(out, 'site.js'), 'w', encoding='utf-8').write(sitejs)
        open(os.path.join(out, 'film.js'), 'w', encoding='utf-8').write(filmjs)
    for name in sorted(os.listdir(os.path.join(SRC, 'pages'))):
        title, desc, home, body = page(name)
        libs = LOCAL if target == 'dist' else CDN
        scripts = ''.join(f'<script src="{s}"></script>' for s in libs)
        if target == 'dist':
            head = f'<link rel="preload" href="fonts/big-shoulders-display-latin-900-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="site.css">'
            scripts += '<script src="site.js"></script>' + ('<script src="film.js"></script>' if home else '')
        else:
            head = GFONTS + f'<style>{css}</style>'
            scripts += f'<script>{sitejs}</script>' + (f'<script>{filmjs}</script>' if home else '')
        cls = 'home' if home else 'sub'
        meta = f'<title>{title}</title><meta name="description" content="{desc}"><meta name="claude:viewport-fit-sides" content="cover"><meta name="theme-color" content="#0C1626"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:image" content="img/og.jpg"><meta property="og:type" content="website"><meta property="og:locale" content="nb_NO"><meta name="twitter:card" content="summary_large_image">'
        # forhåndsvisningen (art) får hjem-siden uten eget dokument-skall
        if target == 'art' and home:
            html = f'{meta}{head}\n{body}<script>document.body.classList.add("{cls}")</script>{scripts}'
        else:
            html = f'<!doctype html><html lang="no"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">{meta}<link rel="icon" href="img/favicon.png">{head}</head><body class="{cls}"><a class="skip" href="#main">{L("Hopp til innhold", "Skip to content")}</a>{body}{scripts}</body></html>'
        open(os.path.join(out, name), 'w', encoding='utf-8').write(html)
    if target == 'dist':
        base = 'https://kurtsandnes.no/'
        open(os.path.join(out, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\nSitemap: {base}sitemap.xml\n')
        urls = ''.join(f'<url><loc>{base}{"" if n == "index.html" else n}</loc></url>' for n in sorted(os.listdir(os.path.join(SRC, 'pages'))))
        open(os.path.join(out, 'sitemap.xml'), 'w').write(f'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{urls}</urlset>')
    print('built', target)

if __name__ == '__main__':
    for t in (sys.argv[1:] or ['dist', 'art']): build(t)
