"""Generate every HTML page of the AI video portfolio from data.py + media/manifest.json.
Each video appears exactly once in the listings (Work page) and has one project page."""
import html, json, os, shutil, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from data import CATS, GITHUB, PORTFOLIO, SITE_TITLE, SITE_URL, UPWORK, all_projects, slugify

OUT = sys.argv[1] if len(sys.argv) > 1 else "build"
HERE = os.path.dirname(os.path.abspath(__file__))
MAN = json.load(open(os.path.join(HERE, "manifest.json")))
PROJECTS = all_projects()
ADS = [p for p in PROJECTS if p["kind"] == "ad"]
SHOTS = [p for p in PROJECTS if p["kind"] == "shot"]
E = lambda s: html.escape(str(s), quote=True)
YEAR = 2026

ARROW_NE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>'
ARROW_R = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>'
PLAY = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>'
I_BRIEF = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>'
I_CODE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>'
I_PIN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>'
I_FILM = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 4v16M17 4v16M2 9h5M2 15h5M17 9h5M17 15h5"/></svg>'
I_PHONE = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>'
I_SPARK = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>'
I_CUT = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.1 15.9M14.5 14.5L20 20M8.1 8.1L12 12"/></svg>'
FAVICON = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' "
           "rx='7' fill='%23050508'/%3E%3Ctext x='16' y='21' font-family='sans-serif' font-size='13' font-weight='700' "
           "text-anchor='middle' fill='%236366f1'%3EUH%3C/text%3E%3C/svg%3E")
NAV = [("Work", "work/index.html"), ("About", "about/index.html"), ("Services", "services/index.html"),
       ("Contact", "contact/index.html")]


def dur(slug):
    s = round(MAN[slug]["dur"])
    return f"{s // 60}:{s % 60:02d}"


def ratio(slug):
    w, h = MAN[slug]["w"], MAN[slug]["h"]
    return "9:16 vertical" if h > w else "16:9"


def page(path, active, title, desc, main, og_image="media/posters/burger-commercial.jpg", preloader=False,
         base=None, extra_js=(), body_class=""):
    depth = path.count("/")
    R = "" if base else "../" * depth
    def link(n, h):
        cur = ' nav__link--active" aria-current="page' if n == active else ""
        return f'<a href="{R}{h}" class="nav__link{cur}">{n}</a>'
    links = "".join(link(n, h) for n, h in NAV)
    mlinks = "".join(f'<a href="{R}{h}" class="mobile-menu__link">{n}</a>' for n, h in NAV)
    flinks = "".join(f'<a href="{R}{h}">{n}</a>' for n, h in NAV)
    canon = SITE_URL + ("" if path == "index.html" else path.replace("index.html", ""))
    pre = ('<div class="preloader" id="preloader"><div class="preloader__inner"><div class="preloader__text">UMER</div>'
           '<div class="preloader__bar"><div class="preloader__bar-fill"></div></div></div></div>\n') if preloader else ""
    scripts = "".join(f'  <script src="{R}{s}" defer></script>\n' for s in
                      ["vendor/three.min.js", "vendor/gsap.min.js", "vendor/ScrollTrigger.min.js",
                       "js/three-scene.js", "js/main.js", *extra_js])
    doc = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  {f'<base href="{base}" />' if base else ''}
  <title>{E(title)}</title>
  <meta name="description" content="{E(desc)}" />
  <link rel="canonical" href="{E(canon)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="{E(title)}" />
  <meta property="og:description" content="{E(desc)}" />
  <meta property="og:image" content="{E(SITE_URL + og_image)}" />
  <meta name="theme-color" content="#050508" />
  <link rel="icon" href="{FAVICON}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="{R}styles/main.css" />
  <link rel="stylesheet" href="{R}styles/site.css" />
</head>
<body{f' class="{body_class}"' if body_class else ''}>
{pre}  <canvas id="three-canvas" aria-hidden="true"></canvas>
  <div class="custom-cursor" id="customCursor" aria-hidden="true"></div>
  <nav class="nav" id="nav" aria-label="Main">
    <div class="nav__left"><a href="{R}index.html" class="nav__logo" aria-label="Umer Hashmi, home">UMER<span class="nav__logo-accent">HASHMI</span></a></div>
    <div class="nav__links">{links}</div>
    <div class="nav__right"><a class="nav__cta" href="{UPWORK}" target="_blank" rel="noopener">Hire me</a></div>
    <button class="nav__hamburger" id="hamburger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobileMenu"><span></span><span></span><span></span></button>
  </nav>
  <div class="mobile-menu" id="mobileMenu">{mlinks}<a class="mobile-menu__cta" href="{UPWORK}" target="_blank" rel="noopener">Hire me on Upwork</a></div>
<main>
{main}
</main>
  <footer class="footer" id="footer">
    <div class="footer__top">
      <div class="footer__logo">UMER<span class="footer__logo-accent">HASHMI</span></div>
      <div class="footer__nav">{flinks}</div>
    </div>
    <div class="footer__bottom"><span>&copy; {YEAR} Umer Hashmi. Every video on this site is AI-generated.</span><span class="footer__made"><a href="{GITHUB}" target="_blank" rel="noopener">GitHub</a> &middot; <a href="{UPWORK}" target="_blank" rel="noopener">Upwork</a></span></div>
  </footer>
{scripts}</body>
</html>
"""
    out = os.path.join(OUT, path)
    os.makedirs(os.path.dirname(out) or OUT, exist_ok=True)
    open(out, "w", encoding="utf-8").write(doc)


def player_ui(sound):
    s = '<button class="player-btn" type="button" data-sound aria-pressed="false">Sound off</button>' if sound else ""
    return f'<div class="player-ui">{s}<button class="player-btn player-btn--play" type="button" data-play aria-label="Play video"></button></div>'


# ── Home ──────────────────────────────────────────────────────────────────────
words = ["AI VIDEO", "PRODUCT ADS", "FOOD ADS", "FASHION REELS", "CINEMATIC SHOTS", "LOGO REVEALS", "EDITING"]
marquee = "".join(f'<span>{w}</span><span class="marquee__dot">&#9670;</span>' for w in words * 2)
sr = MAN["_showreel"]
_srs = int(round(sr["dur"]))
SR_LABEL = f"{_srs // 60}:{_srs % 60:02d}"
home = f"""  <section class="hero" id="hero">
    <div class="hero__content">
      <div class="hero__badge"><span class="hero__badge-dot"></span>AI Video Portfolio</div>
      <h1 class="hero__title">
        <span class="hero__line hero__line--1"><span class="hero__word">CINEMATIC</span></span>
        <span class="hero__line hero__line--2"><span class="hero__word">AI</span><span class="hero__word hero__word--outline">VIDEO</span></span>
      </h1>
      <p class="hero__subtitle">Product ads, fashion reels and cinematic shots, made with AI video generation and edited into finished spots by Umer Hashmi.</p>
      <div class="hero__actions">
        <a href="work/index.html" class="btn btn--primary"><span>See the work</span>{ARROW_NE}</a>
        <a href="{UPWORK}" class="btn btn--ghost" target="_blank" rel="noopener"><span>Hire me on Upwork</span></a>
      </div>
    </div>
    <div class="hero__stats">
      <div class="hero__stat"><span class="hero__stat-number" data-count="{len(ADS)}">{len(ADS)}</span><span class="hero__stat-label">Finished ads</span></div>
      <div class="hero__stat"><span class="hero__stat-number" data-count="{len(SHOTS)}">{len(SHOTS)}</span><span class="hero__stat-label">AI shots</span></div>
      <div class="hero__stat"><span class="hero__stat-number" data-count="{len(CATS)}">{len(CATS)}</span><span class="hero__stat-label">Styles</span></div>
    </div>
    <div class="hero__scroll-hint" aria-hidden="true"><span class="hero__scroll-mouse"><span class="hero__scroll-wheel"></span></span><span>Scroll</span></div>
  </section>

  <section class="section section--cinema" id="showreel">
    <div class="section__header section__header--center"><div class="section__label">Showreel</div><h2 class="section__title">The <em>Reel</em></h2><p class="section__desc">{_srs} seconds cut from the ads and the strongest shots. Every frame is AI-generated.</p></div>
    <div class="cinema-feature" data-player>
      <video class="cinema-feature__video" muted loop playsinline preload="none" poster="media/posters/showreel.jpg" data-src="media/showreel.mp4" aria-label="Showreel"></video>
      <div class="cinema-feature__vignette"></div>
      <div class="cinema-feature__overlay"><div class="cinema-feature__meta"><span class="cinema-feature__badge">Showreel &middot; {SR_LABEL}</span><h3 class="cinema-feature__title">Ads &amp; AI shots</h3><a class="cinema-feature__link" href="work/index.html">Watch each one in full &rarr;</a></div></div>
      <div class="cinema-feature__grain"></div>
      {player_ui(sr.get("audio", False))}
    </div>
  </section>

  <div class="marquee" id="marquee" aria-hidden="true"><div class="marquee__track">{marquee}</div></div>

  <section class="cta-banner" id="ctaBanner">
    <div class="cta-banner__glow"></div>
    <div class="cta-banner__content">
      <h2 class="cta-banner__title">Need a video ad for your <em>product</em>?</h2>
      <p class="cta-banner__subtitle">Tell me what you sell and where it will run. I'll plan the shots, generate them with AI and deliver a finished ad.</p>
      <a href="{UPWORK}" class="btn btn--primary btn--lg" target="_blank" rel="noopener"><span>Hire me on Upwork</span>{ARROW_R}</a>
    </div>
  </section>"""
page("index.html", None, SITE_TITLE,
     "AI video portfolio of Umer Hashmi: product ads, fashion reels and cinematic shots made with AI video generation.",
     home, og_image="media/posters/showreel.jpg", preloader=True, body_class="page-home")

# ── Work: the one place every video is listed ────────────────────────────────
feat = []
for i, p in enumerate(ADS):
    rtl = ' style="direction:rtl"' if i % 2 else ""
    ltr = ';direction:ltr' if i % 2 else ""
    bg = p["poster"]
    pos = "center 30%" if p["orient"] == "portrait" else "center"
    feat.append(f"""      <a class="work-feature" href="{p['slug']}/index.html" data-preview="../{p['video']}"{rtl}>
        <div class="work-feature__poster" style="background-image:url(../{bg});background-position:{pos}{ltr}"><span class="work-feature__play"><span>{PLAY}</span></span></div>
        <div class="work-feature__body"{' style="direction:ltr"' if i % 2 else ''}>
          <span class="work-feature__cat">Spec ad &middot; {dur(p['slug'])} &middot; {ratio(p['slug'])}</span>
          <h3 class="work-feature__title">{E(p['title'])}</h3>
          <p class="work-feature__desc">{E(p['short'])}</p>
          <div class="work-feature__client">View the project &rarr;</div>
        </div>
      </a>""")
filters = '<button class="filters__btn filters__btn--active" type="button" data-filter="all" aria-pressed="true">All</button>' + "".join(
    f'<button class="filters__btn" type="button" data-filter="{slugify(c)}" aria-pressed="false">{E(c)}</button>' for c in CATS)
cards = []
for p in SHOTS:
    href = f"{p['slug']}/index.html"
    cards.append(f"""      <div class="gallery__item" data-category="{slugify(p['cat'])}" data-video="../{p['video']}" data-href="{href}" data-title="{E(p['title'])}" data-cat="{E(p['cat'])}" data-orient="landscape" data-preview="../{p['video']}">
        <div class="gallery__item-inner"><div class="gallery__video-wrap">
          <img class="gallery__poster" src="../{p['poster']}" alt="" loading="lazy" decoding="async" />
          <div class="gallery__overlay"><div class="gallery__meta"><span class="gallery__category">{E(p['cat'])}</span><h3 class="gallery__title"><a class="gallery__link" href="{href}">{E(p['title'])}</a></h3></div>
            <button class="gallery__play" type="button" aria-label="Play {E(p['title'])}">{PLAY}</button></div>
          <div class="gallery__duration">{dur(p['slug'])}</div>
        </div></div>
      </div>""")
work = f"""  <section class="section" id="work">
    <div class="section__header"><div class="section__label">Finished work</div><h1 class="section__title">Three <em>Ads</em></h1><p class="section__desc">Spec ads made end to end with AI video: concept, shot list, generation and edit. Hover to preview, click for the full project.</p></div>
    <div class="work-featured" style="margin-top:2.5rem">
{chr(10).join(feat)}
    </div>
  </section>
  <section class="section" id="shots">
    <div class="section__header"><div class="section__label">Single shots</div><h2 class="section__title">{len(SHOTS)} AI <em>Shots</em></h2><p class="section__desc">Cinematic shots and loops in {len(CATS)} styles. Press play to watch one here, or open it for the details.</p></div>
    <div class="filters" id="filters" role="group" aria-label="Filter shots by style">{filters}</div>
    <div class="gallery gallery--grid" id="gallery">
{chr(10).join(cards)}
    </div>
  </section>
  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="lightboxTitle">
    <div class="lightbox__backdrop"></div>
    <div class="lightbox__content">
      <button class="lightbox__close" id="lightboxClose" type="button" aria-label="Close video">&#10005;</button>
      <video class="lightbox__video" id="lightboxVideo" controls playsinline></video>
      <div class="lightbox__info"><span class="lightbox__category" id="lightboxCategory"></span><h3 class="lightbox__title" id="lightboxTitle"></h3><a class="lightbox__link" id="lightboxLink" href="#">Open project &rarr;</a></div>
    </div>
  </div>"""
page("work/index.html", "Work", "Work — Umer Hashmi, AI Video",
     f"{len(ADS)} finished AI video ads and {len(SHOTS)} cinematic AI shots by Umer Hashmi.", work)

# ── One page per video ───────────────────────────────────────────────────────
ordered = ADS + SHOTS
for i, p in enumerate(ordered):
    s = p["slug"]
    m = MAN[s]
    prev_p, next_p = ordered[i - 1], ordered[(i + 1) % len(ordered)]
    num = f"Ad {ADS.index(p) + 1:02d}" if p["kind"] == "ad" else f"Shot {SHOTS.index(p) + 1:02d}"
    portrait = m["h"] > m["w"]
    steps = "".join(f'<div class="project__step"><div class="project__step-num">{k + 1:02d}</div><div><h3>{E(t)}</h3><p>{E(d)}</p></div></div>'
                    for k, (t, d) in enumerate(p["steps"]))
    credits = [("Made by", "Umer Hashmi"), ("Method", "AI video generation")]
    if p["kind"] == "ad":
        credits.append(("Edit", "Umer Hashmi"))
    cred = "".join(f'<div class="project__credit"><span>{E(a)}</span><strong>{E(b)}</strong></div>' for a, b in credits)
    specs = [("Type", "Spec ad" if p["kind"] == "ad" else "AI shot"), ("Runtime", dur(s)), ("Format", ratio(s)),
             ("Resolution", f"{m['w']}×{m['h']}"), ("Frame rate", "24 fps"), ("Sound", "Yes" if m["audio"] else "No")]
    spec = "".join(f'<div class="project__spec-row"><span>{E(a)}</span><strong>{E(b)}</strong></div>' for a, b in specs)
    body = f"""  <section class="section section--project" id="project">
    <div class="project__top"><a class="project__back" href="../index.html">&larr; All work</a><div class="project__num">{num}</div></div>
    <div class="project__hero">
      <div class="project__hero-media{' project__hero-media--portrait' if portrait else ''}" data-player>
        <video class="project__hero-video" muted loop playsinline preload="metadata" poster="../../{p['poster']}" src="../../{p['video']}" aria-label="{E(p['title'])}"></video>
        <div class="project__hero-grain"></div>
        {player_ui(m['audio'])}
      </div>
      <div class="project__hero-meta">
        <span class="project__cat">{E(p['cat'] if p['kind'] == 'shot' else 'Spec ad')}</span>
        <h1 class="project__title">{E(p['title'])}</h1>
        <p class="project__desc">{E(p['desc'])}</p>
        <span class="project__ai-note">AI-generated video</span>
      </div>
    </div>
    <div class="project__grid">
      <div class="project__body reveal">
        <h2 class="project__h">Process</h2>
        {steps}
        <h2 class="project__h">Credits</h2>
        <div class="project__credits">{cred}</div>
      </div>
      <aside class="project__aside reveal">
        <div class="project__spec-card"><h3>Specs</h3>{spec}</div>
        <a class="btn btn--primary btn--block" href="{UPWORK}" target="_blank" rel="noopener"><span>Want one like this? Hire me</span></a>
      </aside>
    </div>
    <div class="project__pager"><a class="project__pager-btn" href="../{prev_p['slug']}/index.html"><span>Previous</span>{E(prev_p['title'])}</a><a class="project__pager-btn project__pager-btn--next" href="../{next_p['slug']}/index.html"><span>Next</span>{E(next_p['title'])}</a></div>
  </section>"""
    kind = "AI video ad" if p["kind"] == "ad" else "AI video shot"
    page(f"work/{s}/index.html", "Work", f"{p['title']} — {kind} by Umer Hashmi", p["desc"], body, og_image=p["poster"])

# ── About ────────────────────────────────────────────────────────────────────
about = f"""  <section class="section section--about" id="about">
    <div class="section__header section__header--center"><div class="section__label">About</div><h1 class="section__title">Hi, I'm <em>Umer</em></h1><p class="section__desc">AI video creator and software engineer, based in Lahore, Pakistan.</p></div>
    <div class="about__grid">
      <div class="about__visual">
        <div class="about__card"><div class="about__card-glow"></div><div class="about__card-inner"><div class="about__avatar"><div class="about__avatar-ring"></div><div class="about__avatar-core"><span>UH</span></div></div><h2 class="about__name">Umer Hashmi</h2><p class="about__role">AI video &amp; software</p><div class="about__tags"><span>AI video</span><span>Prompting</span><span>Editing</span><span>AI apps</span></div></div></div>
      </div>
      <div class="about__content">
        <div class="about__label">What I do</div>
        <h2 class="about__title">Ads and shots, <br /><em>made with AI</em></h2>
        <p class="about__text">I make product ads, fashion reels and cinematic shots with AI video generation, then edit them into finished spots. Everything on this site was made with AI video tools and cut for the web.</p>
        <p class="about__text">I'm also a software engineer: a Computer Science graduate who worked as a software developer at GigaLabs in Lahore, and I build AI apps and automations. That helps on the video side too: detailed prompts, a shot list that keeps one consistent look, and files delivered in the sizes each platform needs.</p>
        <ul class="about__list">
          <li>Product and food ads, 15 to 30 seconds</li>
          <li>Vertical fashion and lifestyle reels for Instagram and TikTok</li>
          <li>Cinematic shots and loops for websites and intros</li>
          <li>Edits, end lines and versions for each platform</li>
        </ul>
        <div class="about__actions">
          <a href="{UPWORK}" class="btn btn--primary" target="_blank" rel="noopener"><span>Hire me on Upwork</span>{ARROW_NE}</a>
          <a href="{PORTFOLIO}" class="btn btn--ghost" target="_blank" rel="noopener"><span>My software portfolio</span></a>
        </div>
      </div>
    </div>
  </section>"""
page("about/index.html", "About", "About — Umer Hashmi, AI Video",
     "Umer Hashmi makes AI video ads and cinematic shots, and builds AI software. Based in Lahore, Pakistan.", about)

# ── Services ─────────────────────────────────────────────────────────────────
svc = [(I_FILM, "AI Product Ads", "Short ads for food, drinks and products: close-ups, a hero shot and an end line. 15 to 30 seconds.", ["Food", "Product", "16:9 or 9:16"]),
       (I_PHONE, "Fashion & Lifestyle Reels", "Vertical reels with an AI model for clothing and lifestyle brands, made for Instagram and TikTok.", ["Fashion", "Reels", "9:16"]),
       (I_SPARK, "Cinematic Shots & Loops", "Single shots for websites, intros and presentations: nature, interiors, craft, tech and more.", ["Shots", "Loops", "Web"]),
       (I_CUT, "Editing & Versions", "Sequencing and pacing, end lines, and a version for every platform you post on.", ["Edit", "End lines", "Versions"])]
svc_html = "".join(f'<div class="service"><div class="service__icon">{ic}</div><h3 class="service__title">{E(t)}</h3><p class="service__desc">{E(d)}</p><div class="service__tags">{"".join(f"<span>{E(x)}</span>" for x in tags)}</div></div>' for ic, t, d, tags in svc)
proc = [("Brief", "You tell me the product, the audience and where the video will run."),
        ("Shot list & prompts", "I plan every shot and write a detailed prompt for each, so the look stays consistent."),
        ("Generate & select", "I generate the shots with AI video and keep only the best takes."),
        ("Edit & deliver", "I cut the ad, add the end line and deliver files in the sizes you need.")]
proc_html = "".join(f'<div class="process__step"><h3>{E(a)}</h3><p>{E(b)}</p></div>' for a, b in proc)
services = f"""  <section class="section section--services" id="services">
    <div class="section__header section__header--center"><div class="section__label">Services</div><h1 class="section__title">What I <em>Make</em></h1><p class="section__desc">AI-generated video, planned and edited for your brand.</p></div>
    <div class="services">{svc_html}</div>
    <div class="process">
      <div class="process__title">How I work</div>
      <div class="process__list">{proc_html}</div>
    </div>
    <p class="section__note">Everything is AI-generated. To keep your real product on screen, send clear product photos and I'll animate them with image-to-video.</p>
    <div class="hero__actions" style="justify-content:center;margin-top:2.5rem">
      <a href="{UPWORK}" class="btn btn--primary" target="_blank" rel="noopener"><span>Hire me on Upwork</span>{ARROW_NE}</a>
      <a href="../work/index.html" class="btn btn--ghost"><span>See the work</span></a>
    </div>
  </section>"""
page("services/index.html", "Services", "Services — Umer Hashmi, AI Video",
     "AI product ads, fashion reels, cinematic shots and editing by Umer Hashmi.", services)

# ── Contact (no fake form: everything goes through Upwork) ───────────────────
contact = f"""  <section class="section section--contact" id="contact">
    <div class="section__header"><div class="section__label">Contact</div><h1 class="section__title">Let's work <em>together</em></h1></div>
    <div class="contact__grid">
      <div class="contact__info">
        <div class="contact__info-item"><div class="contact__info-icon">{I_BRIEF}</div><div><div class="contact__info-label">Upwork</div><a href="{UPWORK}" class="contact__info-value" target="_blank" rel="noopener">Umer H. on Upwork</a></div></div>
        <div class="contact__info-item"><div class="contact__info-icon">{I_CODE}</div><div><div class="contact__info-label">GitHub</div><a href="{GITHUB}" class="contact__info-value" target="_blank" rel="noopener">github.com/umer-78</a></div></div>
        <div class="contact__info-item"><div class="contact__info-icon">{I_PIN}</div><div><div class="contact__info-label">Location</div><span class="contact__info-value">Lahore, Pakistan &middot; works remotely</span></div></div>
      </div>
      <div class="contact__form contact__card">
        <h3>Start a project</h3>
        <p>I take video projects through Upwork, so messages and payments are protected for both of us. In your first message, tell me:</p>
        <ul>
          <li>what you sell, with a link or product photos</li>
          <li>where the video will run (Instagram, TikTok, YouTube, your website)</li>
          <li>the length you need and your deadline</li>
        </ul>
        <a href="{UPWORK}" class="btn btn--primary btn--block" target="_blank" rel="noopener"><span>Message me on Upwork</span>{ARROW_R}</a>
      </div>
    </div>
  </section>"""
page("contact/index.html", "Contact", "Contact — Umer Hashmi, AI Video",
     "Hire Umer Hashmi for AI video ads and reels through Upwork.", contact)

# ── 404 (GitHub Pages serves this for any missing path, so links use <base>) ──
nf = f"""  <section class="section" style="min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
    <div class="section__label">404</div>
    <h1 class="section__title">Page not <em>found</em></h1>
    <p class="section__desc">That page doesn't exist or has moved.</p>
    <div class="hero__actions" style="justify-content:center;margin-top:2rem"><a href="index.html" class="btn btn--primary"><span>Back to home</span></a><a href="work/index.html" class="btn btn--ghost"><span>See the work</span></a></div>
  </section>"""
page("404.html", None, "Page not found — Umer Hashmi", "Page not found.", nf,
     base="/ai-video-portfolio/")

print("pages built:", sum(1 for _, _, fs in os.walk(OUT) for f in fs if f.endswith(".html")))
