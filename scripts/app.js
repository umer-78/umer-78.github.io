import site from './data.js';
import { selectProjects, categoryCounts, languageCounts, terms } from './filters.js';
import { loadRepoStats, timeAgo, ciBadgeUrl } from './github.js';
import { CATEGORY_STYLE, gemVars } from './palette.js';
import { environmentFor, romanNumeral } from './environments.js';

const $ = (id) => document.getElementById(id);
const root = document.documentElement;
const rows = $('cards');
const chipsBox = $('chips');
const search = $('q');
const countLine = $('count');
const empty = $('empty');
const envBox = $('env');
const envPanel = $('env-panel');
const siteBox = $('site');

const projects = site.projects;
const byName = new Map(projects.map((project, index) => [project.name, { project, index }]));
const baseTitle = document.title;
const state = { query: '', category: 'all', open: null };
let repoStats = null; // filled from GitHub after first paint; everything renders fine without it
let openedByPush = false;
let returnFocus = null;

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad2 = (n) => String(n).padStart(2, '0');

/** Everything that reaches innerHTML goes through this first. */
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

/** Wraps each search term where it appears, after escaping — never before. */
function highlight(text, query) {
  const safe = escapeHtml(text);
  const words = terms(query).filter((t) => t.length > 1);
  if (words.length === 0) return safe;
  const pattern = new RegExp(`(${words.map(escapeRegex).join('|')})`, 'gi');
  return safe.replace(pattern, '<mark>$1</mark>');
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Each row's element id, which is also the link to it: index.html#project-<name>. */
const cardId = (name) => `project-${name}`;
const repoUrl = (project) => `https://github.com/${site.owner}/${project.name}`;
/** A real link to a project's environment, so it opens in a new tab or can be shared. */
const envHref = (name) => `?p=${encodeURIComponent(name)}`;

/** Stars and last update (when GitHub answered), plus the live CI badge. */
function metaInner(project) {
  const s = repoStats?.[project.name];
  const bits = [];
  if (project.private) bits.push('<span>private repository</span>');
  if (s) {
    if (s.stars > 0) bits.push(`<span title="GitHub stars">★ ${s.stars}</span>`); // a row of zeros says nothing
    if (s.pushedAt) bits.push(`<span title="${escapeHtml(new Date(s.pushedAt).toLocaleString())}">updated ${escapeHtml(timeAgo(s.pushedAt))}</span>`);
    if (s.archived) bits.push('<span>archived</span>');
  }
  const badge = project.private ? '' : `<img class="ci" src="${escapeHtml(ciBadgeUrl(site.owner, project.name))}" alt="CI status for ${escapeHtml(project.name)}" height="20" loading="lazy" onerror="this.remove()">`;
  return bits.join('<span aria-hidden="true">·</span>') + badge;
}

function codeLink(project, className = '') {
  if (project.private) return '';
  return `<a class="${className}" href="${escapeHtml(repoUrl(project))}">Code <span aria-hidden="true">↗</span></a>`;
}

function demoLink(project, className = '', label = 'Live demo') {
  if (!project.demo) return '';
  return `<a class="${className}" href="${escapeHtml(project.demo)}">${label} <span aria-hidden="true">↗</span></a>`;
}

// ---------------------------------------------------------------- the hero

function renderHeader() {
  const year = new Date().getFullYear();
  $('year-roman').textContent = romanNumeral(year);
  $('site-tagline').textContent = site.tagline;
  $('site-intro').textContent = site.intro;
  $('hero-count').textContent = String(projects.length);
  $('foot-year').textContent = String(year);

  const languages = languageCounts(projects);
  const stats = [
    { label: 'Projects', value: projects.length },
    { label: 'Environments', value: projects.length },
    { label: 'Languages', value: languages.length, title: languages.map((l) => l.name).join(' · ') },
    { label: 'Live demos', value: projects.filter((p) => p.demo).length },
  ];
  $('stats').innerHTML = stats
    .map(({ label, value, title }) => `<div class="stat"${title ? ` title="${escapeHtml(title)}"` : ''}>
  <dt>${escapeHtml(label)}</dt>
  <dd class="stat-num" data-count="${value}">${reduceMotion() ? value : 0}</dd>
</div>`)
    .join('');
  if (!reduceMotion()) countUp();

  const counts = categoryCounts(projects, site.categories);
  $('gallery-key').innerHTML = counts
    .map(({ name, count }) => `<button type="button" data-category="${escapeHtml(name)}" style="${gemVars(name)}" title="${escapeHtml(name)}"><i class="gem-dot" aria-hidden="true"></i>${escapeHtml(CATEGORY_STYLE[name]?.short || name)} <span class="n">${count}</span></button>`)
    .join('');
}

function countUp() {
  document.querySelectorAll('#stats .stat-num').forEach((el, i) => {
    const goal = Number(el.dataset.count) || 0;
    const start = performance.now() + 500 + i * 140;
    const tick = (now) => {
      const t = Math.max(0, Math.min((now - start) / 1100, 1));
      el.textContent = String(Math.round(goal * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// ------------------------------------------------------- the collection

function renderFeatured() {
  const list = (site.featured || []).map((name) => byName.get(name)).filter(Boolean);
  $('featured').innerHTML = list
    .map(({ project, index }) => {
      const style = CATEGORY_STYLE[project.category] || {};
      const env = environmentFor(project, index);
      const media = project.preview
        ? `<img src="${escapeHtml(project.preview)}" alt="" loading="lazy" decoding="async" width="1280" height="520">`
        : `<span class="feat-monogram" aria-hidden="true">${escapeHtml(project.title.charAt(0))}</span>`;
      return `<li class="feat" style="${gemVars(project.category)}">
  <a class="feat-media" href="${envHref(project.name)}" data-enter="${escapeHtml(project.name)}" tabindex="-1" aria-hidden="true">
    ${media}
    <span class="feat-world"><span>Enter</span> ${escapeHtml(env.title)}</span>
  </a>
  <div class="feat-body">
    <p class="feat-no"><span>No. ${pad2(index + 1)}</span><i class="gem-dot" aria-hidden="true"></i>${escapeHtml(style.gem || '')} · ${escapeHtml(project.category)}</p>
    <h3 class="feat-title"><a href="${envHref(project.name)}" data-enter="${escapeHtml(project.name)}">${escapeHtml(project.title)}</a></h3>
    <p class="feat-sum">${escapeHtml(project.summary)}</p>
    <p class="meta" data-repo="${escapeHtml(project.name)}">${metaInner(project)}</p>
    <p class="feat-links">
      <a class="link-gold" href="${envHref(project.name)}" data-enter="${escapeHtml(project.name)}">Enter its environment <span aria-hidden="true">→</span></a>
      ${demoLink(project, 'link-quiet')}
      ${codeLink(project, 'link-quiet')}
    </p>
  </div>
</li>`;
    })
    .join('');
}

// ------------------------------------------------------------ the index

function renderChips() {
  const counts = categoryCounts(projects, site.categories);
  chipsBox.innerHTML = [{ name: 'all', count: projects.length }, ...counts]
    .map((entry) => {
      const label = entry.name === 'all' ? 'All' : entry.name;
      const dot = entry.name === 'all' ? '' : `<i class="gem-dot" style="${gemVars(entry.name)}" aria-hidden="true"></i>`;
      return `<button class="chip" type="button" data-category="${escapeHtml(entry.name)}" aria-pressed="${state.category === entry.name}">${dot}${escapeHtml(label)} <span class="n">${entry.count}</span></button>`;
    })
    .join('');
}

function rowHtml(project) {
  const { index } = byName.get(project.name);
  const style = CATEGORY_STYLE[project.category] || {};
  const env = environmentFor(project, index);
  const tags = (project.topics || []).map((tag) => `<li>${highlight(tag, state.query)}</li>`).join('');
  return `<li class="row" id="${escapeHtml(cardId(project.name))}" style="${gemVars(project.category)}" data-name="${escapeHtml(project.name)}">
  <span class="row-no" aria-hidden="true">${pad2(index + 1)}</span>
  <div class="row-main">
    <h3 class="row-title"><a href="${envHref(project.name)}" data-enter="${escapeHtml(project.name)}">${highlight(project.title, state.query)}</a></h3>
    <p class="row-sum">${highlight(project.summary, state.query)}</p>
    <ul class="tags">${tags}</ul>
  </div>
  <dl class="row-facts">
    <div><dt>Category</dt><dd><i class="gem-dot" aria-hidden="true"></i>${escapeHtml(style.short || project.category)}</dd></div>
    <div><dt>Language</dt><dd>${escapeHtml(project.language)}</dd></div>
    <div><dt>World</dt><dd>${escapeHtml(env.title.replace(/^The /, ''))}</dd></div>
  </dl>
  <div class="row-end">
    <p class="meta" data-repo="${escapeHtml(project.name)}">${metaInner(project)}</p>
    <p class="row-links">${demoLink(project, '', 'Demo')}${codeLink(project)}</p>
  </div>
</li>`;
}

function render() {
  const shown = selectProjects(projects, state);
  rows.innerHTML = shown.map(rowHtml).join('');
  empty.hidden = shown.length > 0;
  const total = projects.length;
  countLine.textContent = shown.length === total ? `${total} projects` : `${shown.length} of ${total} projects`;
  $('showAll').hidden = !state.query && state.category === 'all';
  for (const chip of chipsBox.querySelectorAll('.chip')) {
    chip.setAttribute('aria-pressed', String(chip.dataset.category === state.category));
  }
  writeUrl();
  // the gallery dims the monoliths of projects the filters hide
  document.dispatchEvent(new CustomEvent('portfolio:shown', { detail: { names: shown.length === total ? null : shown.map((p) => p.name) } }));
}

/** Keeps the filters (and an open environment) in the address bar so any view can be linked to. */
function urlFor() {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.category !== 'all') params.set('c', state.category);
  if (state.open) params.set('p', state.open);
  const query = params.toString();
  return (query ? `?${query}` : location.pathname) + (state.open ? '' : location.hash);
}

function writeUrl() {
  history.replaceState(history.state, '', urlFor());
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  state.query = params.get('q') || '';
  const category = params.get('c');
  state.category = category && site.categories.includes(category) ? category : 'all';
  search.value = state.query;
  return params.get('p');
}

function withTransition(fn) {
  if (!reduceMotion() && typeof document.startViewTransition === 'function') document.startViewTransition(fn);
  else fn();
}

function resetFilters() {
  state.query = '';
  state.category = 'all';
  search.value = '';
}

chipsBox.addEventListener('click', (event) => {
  const chip = event.target.closest('.chip');
  if (!chip) return;
  state.category = chip.dataset.category;
  withTransition(render);
});

search.addEventListener('input', () => {
  state.query = search.value;
  render();
});

$('showAll').addEventListener('click', () => {
  resetFilters();
  withTransition(render);
});

$('clear').addEventListener('click', () => {
  resetFilters();
  search.focus();
  withTransition(render);
});

// The key under the gallery: hovering lights a category's monoliths, clicking filters the index by it.
const key = $('gallery-key');
const lightCategory = (category) => document.dispatchEvent(new CustomEvent('portfolio:highlight', { detail: { category } }));
key.addEventListener('pointerover', (e) => lightCategory(e.target.closest('button')?.dataset.category || null));
key.addEventListener('pointerleave', () => lightCategory(null));
key.addEventListener('focusin', (e) => lightCategory(e.target.closest('button')?.dataset.category || null));
key.addEventListener('focusout', () => lightCategory(null));
key.addEventListener('click', (e) => {
  const button = e.target.closest('button');
  if (!button) return;
  state.query = '';
  search.value = '';
  state.category = button.dataset.category;
  render();
  $('index').scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
});

// ------------------------------------------------- a project's environment

function envHtml(project, index) {
  const style = CATEGORY_STYLE[project.category] || {};
  const env = environmentFor(project, index);
  const points = (project.highlights || [])
    .map((point, i) => `<li><span class="num" aria-hidden="true">${romanNumeral(i + 1)}</span><span>${escapeHtml(point)}</span></li>`)
    .join('');
  const tags = (project.topics || []).map((tag) => `<li>${escapeHtml(tag)}</li>`).join('');
  const target = project.demo || (project.private ? '' : repoUrl(project));
  const img = project.preview ? `<img src="${escapeHtml(project.preview)}" alt="" loading="lazy" decoding="async" width="1280" height="520">` : '';
  // the picture links to the demo, or the code; a private project without a demo has neither to offer
  const shot = !img ? '' : target
    ? `<a class="env-shot" href="${escapeHtml(target)}" tabindex="-1" aria-hidden="true">${img}</a>`
    : `<div class="env-shot" aria-hidden="true">${img}</div>`;
  return `<p class="env-kicker"><i class="gem-dot" aria-hidden="true"></i>${escapeHtml(style.gem || '')} · ${escapeHtml(project.category)} · ${escapeHtml(project.language)}</p>
<h2 class="env-title" id="env-title" tabindex="-1">${escapeHtml(project.title)}</h2>
<p class="env-world"><em>${escapeHtml(env.title)}</em> — ${escapeHtml(env.line)}</p>
<p class="env-sum">${escapeHtml(project.summary)}</p>
<ol class="env-points">${points}</ol>
<ul class="tags">${tags}</ul>
<p class="meta" data-repo="${escapeHtml(project.name)}">${metaInner(project)}</p>
<div class="env-actions">${demoLink(project, 'btn gold', 'Visit the live demo')}${project.private ? '' : `<a class="btn ghost" href="${escapeHtml(repoUrl(project))}">View the source <span aria-hidden="true">↗</span></a>`}</div>
${shot}`;
}

function neighbour(step) {
  const { index } = byName.get(state.open);
  return projects[(index + step + projects.length) % projects.length];
}

function fillEnv() {
  const { project, index } = byName.get(state.open);
  envBox.style.setProperty('--gem', CATEGORY_STYLE[project.category]?.color || '');
  // absolute, because a url() in a custom property resolves against the stylesheet that uses it
  envBox.style.setProperty('--shot', project.preview ? `url("${new URL(project.preview, document.baseURI).href}")` : 'none');
  envPanel.innerHTML = envHtml(project, index);
  envPanel.scrollTop = 0;
  $('env-edition').textContent = `No. ${pad2(index + 1)} / ${pad2(projects.length)}`;
  const next = neighbour(1);
  const prev = neighbour(-1);
  $('env-next').setAttribute('aria-label', `Next project: ${next.title}`);
  $('env-prev').setAttribute('aria-label', `Previous project: ${prev.title}`);
  $('env-teaser-title').textContent = next.title;
  $('env-teaser').href = envHref(next.name);
  document.title = `${project.title} — ${baseTitle}`;
}

function openEnv(name, { push = true } = {}) {
  if (!byName.has(name)) return;
  const wasOpen = Boolean(state.open);
  if (!wasOpen) returnFocus = document.activeElement;
  state.open = name;
  root.dataset.env = name;
  root.classList.add('env-open');
  envBox.hidden = false;
  siteBox.inert = true;
  fillEnv();
  if (push && !wasOpen) {
    history.pushState({ env: name }, '', urlFor());
    openedByPush = true;
  } else {
    writeUrl();
  }
  document.dispatchEvent(new CustomEvent('portfolio:open', { detail: { name } }));
  requestAnimationFrame(() => $('env-title')?.focus({ preventScroll: true }));
}

function closeEnv({ fromHistory = false } = {}) {
  if (!state.open) return;
  if (!fromHistory && openedByPush) {
    openedByPush = false;
    history.back(); // popstate comes back here with fromHistory
    return;
  }
  state.open = null;
  openedByPush = false;
  delete root.dataset.env;
  root.classList.remove('env-open');
  envBox.hidden = true;
  siteBox.inert = false;
  document.title = baseTitle;
  if (!fromHistory) writeUrl();
  document.dispatchEvent(new CustomEvent('portfolio:close'));
  if (returnFocus && document.contains(returnFocus)) returnFocus.focus({ preventScroll: true });
}

function step(by) {
  if (!state.open) return;
  openEnv(neighbour(by).name, { push: false });
}

$('env-close').addEventListener('click', () => closeEnv());
$('env-prev').addEventListener('click', () => step(-1));
$('env-next').addEventListener('click', () => step(1));
$('env-teaser').addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  step(1);
});

// Every "enter" link is a real link; a plain click opens the environment in place.
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[data-enter]');
  if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  openEnv(link.dataset.enter);
});

// A monolith in the gallery was clicked.
document.addEventListener('portfolio:enter', (e) => openEnv(e.detail?.name));
document.addEventListener('world:explored', () => envBox.classList.add('explored'));
document.addEventListener('world:ready', () => {
  if (state.open) document.dispatchEvent(new CustomEvent('portfolio:open', { detail: { name: state.open } }));
});

addEventListener('popstate', () => {
  const wanted = readUrl();
  render();
  if (wanted && byName.has(wanted)) openEnv(wanted, { push: false });
  else closeEnv({ fromHistory: true });
});

document.addEventListener('keydown', (event) => {
  const typing = event.target.closest?.('input, textarea, select, [contenteditable="true"]');
  if (state.open) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeEnv();
    } else if (!typing && event.key === 'ArrowRight') {
      step(1);
    } else if (!typing && event.key === 'ArrowLeft') {
      step(-1);
    } else if (event.key === 'Tab') {
      trapFocus(event);
    }
    return;
  }
  // "/" focuses the search box, the way most code-browsing sites behave.
  if (event.key === '/' && !typing) {
    event.preventDefault();
    search.focus();
    search.select();
  }
  if (event.key === 'Escape' && document.activeElement === search) {
    search.value = '';
    state.query = '';
    render();
  }
});

/** Keeps Tab inside the open environment, the way a modal dialog should. */
function trapFocus(event) {
  const focusable = [...envBox.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && (document.activeElement === first || !envBox.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

// ----------------------------------------------------------- small touches

// The nav takes a glass background once the page moves.
const nav = $('nav');
const onScroll = () => nav.classList.toggle('scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

// A still of the live demo follows the pointer down the index (fine pointers only).
const peek = $('peek');
if (peek && matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const img = peek.querySelector('img');
  const pos = { x: 0, y: 0, tx: 0, ty: 0 };
  let raf = 0;
  const follow = () => {
    pos.x += (pos.tx - pos.x) * 0.18;
    pos.y += (pos.ty - pos.y) * 0.18;
    peek.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
    raf = Math.abs(pos.tx - pos.x) + Math.abs(pos.ty - pos.y) > 0.5 ? requestAnimationFrame(follow) : 0;
  };
  rows.addEventListener('pointermove', (e) => {
    const row = e.target.closest('.row');
    const project = row && byName.get(row.dataset.name)?.project;
    if (!project?.preview) {
      peek.classList.remove('on');
      return;
    }
    if (img.getAttribute('src') !== project.preview) img.src = project.preview;
    peek.style.setProperty('--gem', CATEGORY_STYLE[project.category]?.color || '');
    // beside the pointer, flipping to its left near the right edge, never off screen
    const pw = peek.offsetWidth || 320;
    const ph = peek.offsetHeight || 180;
    pos.tx = e.clientX + 28 + pw > innerWidth - 12 ? e.clientX - 28 - pw : e.clientX + 28;
    pos.ty = Math.min(Math.max(e.clientY - 90, 12), innerHeight - ph - 12);
    if (!peek.classList.contains('on')) {
      pos.x = pos.tx;
      pos.y = pos.ty;
      peek.classList.add('on');
    }
    if (!raf) raf = requestAnimationFrame(follow);
  });
  rows.addEventListener('pointerleave', () => peek.classList.remove('on'));
}

// The collection's pictures tilt a little towards the pointer.
if (!reduceMotion() && matchMedia('(hover: hover)').matches) {
  $('featured').addEventListener('pointermove', (e) => {
    const media = e.target.closest('.feat-media');
    if (!media) return;
    const r = media.getBoundingClientRect();
    media.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - 0.5) * -6}deg`);
    media.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 8}deg`);
  });
  $('featured').addEventListener('pointerout', (e) => {
    const media = e.target.closest('.feat-media');
    if (media && !media.contains(e.relatedTarget)) {
      media.style.removeProperty('--rx');
      media.style.removeProperty('--ry');
    }
  });
}

// ------------------------------------------------------------------- start

const wanted = readUrl();
renderHeader();
renderFeatured();
renderChips();
render();
if (wanted && byName.has(wanted)) openEnv(wanted, { push: false });

// A link to one project (index.html#project-<name>) lands on its row once the rows exist.
if (!state.open && location.hash.startsWith('#project-')) {
  const row = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (row) {
    requestAnimationFrame(() => {
      row.scrollIntoView({ block: 'center' });
      row.classList.add('spotlight');
    });
  }
}

loadRepoStats(site.owner).then((stats) => {
  if (!stats) return;
  repoStats = stats;
  for (const el of document.querySelectorAll('.meta[data-repo]')) {
    const project = byName.get(el.dataset.repo)?.project;
    if (project) el.innerHTML = metaInner(project);
  }
});
