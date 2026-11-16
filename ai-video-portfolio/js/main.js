/* Umer Hashmi — AI Video Portfolio: shared interactions */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  const playSafe = (v) => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };

  // ── Preloader: never leave the page covered, even if a big asset is slow ──
  const preloader = document.getElementById('preloader');
  function dismissPreloader() {
    if (!preloader || preloader.classList.contains('preloader--hidden')) return;
    preloader.classList.add('preloader--hidden');
    try { animateHero(); } catch (e) { /* the entrance animation is optional */ }
  }
  if (preloader) {
    preloader.addEventListener('transitionend', () => { preloader.style.display = 'none'; }, { once: true });
    if (document.readyState === 'complete') setTimeout(dismissPreloader, 150);
    else window.addEventListener('load', () => setTimeout(dismissPreloader, 150));
    setTimeout(dismissPreloader, 3000);
  } else {
    animateHero();
  }

  // ── Custom cursor (mouse devices only) ──
  const cursor = document.getElementById('customCursor');
  if (cursor && canHover && !reduceMotion) {
    let cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
    document.addEventListener('mouseover', (e) => {
      cursor.classList.toggle('custom-cursor--hover', !!e.target.closest('a, button, .gallery__item, .service'));
    });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate(${cx - 12}px, ${cy - 12}px)`;
      requestAnimationFrame(loop);
    })();
  }

  // ── Nav: scrolled state + mobile menu ──
  const nav = document.getElementById('nav');
  const updateNav = () => { if (nav) nav.classList.toggle('nav--scrolled', window.scrollY > 50); };
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    const setOpen = (open) => {
      hamburger.classList.toggle('nav__hamburger--active', open);
      mobileMenu.classList.toggle('mobile-menu--open', open);
      hamburger.setAttribute('aria-expanded', String(open));
    };
    hamburger.addEventListener('click', () => setOpen(!mobileMenu.classList.contains('mobile-menu--open')));
    mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  // ── Hero entrance + counters ──
  function animateHero() {
    const counters = document.querySelectorAll('.hero__stat-number');
    if (!hasGsap || reduceMotion) {
      counters.forEach((el) => { el.textContent = el.dataset.count || '0'; });
      return;
    }
    const has = (sel) => document.querySelector(sel) !== null;
    if (has('.hero__badge')) {
      const tl = gsap.timeline({ delay: 0.15 });
      tl.from('.hero__badge', { y: 30, opacity: 0, duration: 0.6 });
      if (has('.hero__line--1')) tl.from('.hero__line--1', { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out' }, '-=0.2');
      if (has('.hero__line--2')) tl.from('.hero__line--2 .hero__word', { y: 60, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.15 }, '-=0.5');
      if (has('.hero__subtitle')) tl.from('.hero__subtitle', { y: 30, opacity: 0, duration: 0.6 }, '-=0.4');
      if (has('.hero__actions .btn')) tl.from('.hero__actions .btn', { y: 30, opacity: 0, duration: 0.5, stagger: 0.1 }, '-=0.3');
    }
    counters.forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const obj = { v: 0 };
      gsap.to(obj, { v: target, duration: 1.6, ease: 'power2.out', delay: 0.3,
        onUpdate: () => { el.textContent = String(Math.round(obj.v)); } });
    });
  }

  // ── Scroll reveal ──
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('reveal--visible'); io.unobserve(e.target); } });
    }, { threshold: 0.1 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('reveal--visible'));
  }

  // ── Play videos only while they are on screen ──
  function autoplayInView(video, onFirst) {
    if (!video) return;
    if (!('IntersectionObserver' in window)) { if (onFirst) onFirst(); playSafe(video); return; }
    let started = false;
    new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          if (!started && onFirst) onFirst();
          started = true;
          if (!video.dataset.userPaused && !reduceMotion) playSafe(video);
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25 }).observe(video);
  }

  // Play/pause + sound buttons for any featured player (cinema, showreel, project hero)
  function wirePlayer(video, playBtn, soundBtn) {
    if (!video) return;
    if (playBtn) {
      const sync = () => {
        const playing = !video.paused;
        playBtn.classList.toggle('is-playing', playing);
        playBtn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
      };
      playBtn.addEventListener('click', () => {
        if (video.paused) { delete video.dataset.userPaused; playSafe(video); }
        else { video.dataset.userPaused = '1'; video.pause(); }
      });
      video.addEventListener('play', sync);
      video.addEventListener('pause', sync);
      sync();
    }
    if (soundBtn) {
      const sync = () => {
        soundBtn.classList.toggle('is-on', !video.muted);
        soundBtn.textContent = video.muted ? 'Sound off' : 'Sound on';
        soundBtn.setAttribute('aria-pressed', String(!video.muted));
      };
      soundBtn.addEventListener('click', () => {
        video.muted = !video.muted;
        if (!video.muted && video.paused) { delete video.dataset.userPaused; playSafe(video); }
        sync();
      });
      video.addEventListener('volumechange', sync);
      sync();
    }
  }

  document.querySelectorAll('[data-player]').forEach((wrap) => {
    const video = wrap.querySelector('video');
    const lazySrc = video && video.dataset.src;
    autoplayInView(video, lazySrc ? () => { if (!video.src) { video.src = lazySrc; video.load(); } } : null);
    wirePlayer(video, wrap.querySelector('[data-play]'), wrap.querySelector('[data-sound]'));
  });

  // ── Lightbox ──
  const lightbox = document.getElementById('lightbox');
  const lbVideo = document.getElementById('lightboxVideo');
  const lbTitle = document.getElementById('lightboxTitle');
  const lbCat = document.getElementById('lightboxCategory');
  const lbLink = document.getElementById('lightboxLink');
  let lastFocus = null;

  function openLightbox(item) {
    if (!lightbox || !lbVideo || !item || !item.dataset.video) return;
    lastFocus = document.activeElement;
    lbVideo.src = item.dataset.video;
    lbVideo.classList.toggle('lightbox__video--portrait', item.dataset.orient === 'portrait');
    if (lbTitle) lbTitle.textContent = item.dataset.title || '';
    if (lbCat) lbCat.textContent = item.dataset.cat || '';
    if (lbLink) lbLink.href = item.dataset.href || '#';
    lightbox.classList.add('lightbox--open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    playSafe(lbVideo);
    const close = document.getElementById('lightboxClose');
    if (close) close.focus();
  }
  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('lightbox--open')) return;
    lightbox.classList.remove('lightbox--open');
    lightbox.setAttribute('aria-hidden', 'true');
    lbVideo.pause();
    lbVideo.removeAttribute('src');
    lbVideo.load();
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }
  if (lightbox) {
    const closeBtn = document.getElementById('lightboxClose');
    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    const backdrop = lightbox.querySelector('.lightbox__backdrop');
    if (backdrop) backdrop.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
    document.querySelectorAll('.gallery__play').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openLightbox(btn.closest('[data-video]'));
      });
    });
  }

  // ── Gallery filters (work page) ──
  const filterBtns = document.querySelectorAll('#filters .filters__btn');
  const galleryItems = document.querySelectorAll('#gallery .gallery__item');
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => { b.classList.remove('filters__btn--active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('filters__btn--active');
      btn.setAttribute('aria-pressed', 'true');
      const f = btn.dataset.filter;
      galleryItems.forEach((it) => it.classList.toggle('gallery__item--hidden', f !== 'all' && it.dataset.category !== f));
    });
  });

  // ── Hover previews on cards (mouse only) ──
  if (canHover && !reduceMotion) {
    document.querySelectorAll('[data-preview]').forEach((card) => {
      const host = card.querySelector('.proj-card__media, .gallery__video-wrap, .work-feature__poster');
      if (!host) return;
      let v = null;
      card.addEventListener('mouseenter', () => {
        if (!v) {
          v = document.createElement('video');
          v.className = 'hover-preview';
          v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
          v.src = card.dataset.preview;
          v.setAttribute('aria-hidden', 'true');
          host.appendChild(v);
        }
        playSafe(v);
      });
      card.addEventListener('mouseleave', () => { if (v) v.pause(); });
    });
  }

  // ── Filmstrip rows: tiles built from data-items, each plays only while visible ──
  document.querySelectorAll('.filmstrip__track[data-items]').forEach((track) => {
    let items = [];
    try { items = JSON.parse(track.dataset.items); } catch (e) { return; }
    track.style.setProperty('--speed', (track.dataset.speed || '40') + 's');
    const build = (dup) => items.forEach((it) => {
      const tile = document.createElement('a');
      tile.className = 'filmstrip__tile' + (it.w ? ' filmstrip__tile--wide' : '');
      tile.href = it.h;
      if (dup) { tile.setAttribute('aria-hidden', 'true'); tile.tabIndex = -1; }
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none';
      v.poster = it.i;
      v.src = it.p;
      tile.appendChild(v);
      const ov = document.createElement('div');
      ov.className = 'filmstrip__tile-overlay';
      const s = document.createElement('span'); s.textContent = it.t;
      const em = document.createElement('em'); em.textContent = it.d;
      ov.append(s, em);
      tile.appendChild(ov);
      track.appendChild(tile);
      if (!reduceMotion && 'IntersectionObserver' in window) {
        new IntersectionObserver((en) => en.forEach((x) => (x.isIntersecting ? playSafe(v) : v.pause())),
          { threshold: 0.1 }).observe(tile);
      }
    });
    build(false);
    build(true);
  });

  // ── GSAP scroll touches ──
  if (hasGsap && !reduceMotion) {
    const marqueeTrack = document.querySelector('.marquee__track');
    if (marqueeTrack) {
      ScrollTrigger.create({
        trigger: '.marquee', start: 'top bottom', end: 'bottom top',
        onToggle: (self) => { marqueeTrack.style.animationPlayState = self.isActive ? 'running' : 'paused'; },
      });
    }
    document.querySelectorAll('.section__header').forEach((h) => {
      gsap.from(h, { scrollTrigger: { trigger: h, start: 'top 85%' }, y: 30, opacity: 0, duration: 0.7 });
    });
    if (document.querySelector('.services')) {
      gsap.from('.service', { scrollTrigger: { trigger: '.services', start: 'top 75%' }, y: 40, opacity: 0, duration: 0.5, stagger: 0.12 });
    }
  }
})();
