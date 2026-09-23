import site from './data.js';
import { selectProjects, categoryCounts, languageCounts, terms } from './filters.js';

const cards = document.getElementById('cards');
const chipsBox = document.getElementById('chips');
const search = document.getElementById('q');
const countLine = document.getElementById('count');
const empty = document.getElementById('empty');

const state = { query: '', category: 'all' };

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Per-language accent used for the gradient language pills. */
const LANG_COLORS = {
  Python: '#3b82f6',
  Go: '#0d9488',
  JavaScript: '#b45309',
  TypeScript: '#0284c7',
  'C#': '#7c3aed',
};

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

function repoUrl(project) {
  return `https://github.com/${site.owner}/${project.name}`;
}

/** Eased count-up for the hero stat numbers. */
function animateNumber(el, target, duration = 900) {
  if (reduceMotion()) {
    el.textContent = String(target);
    return;
  }
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(target * eased));
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function countUpStats() {
  document.querySelectorAll('#stats .stat-num').forEach((el, index) => {
    const target = Number(el.dataset.count) || 0;
    window.setTimeout(() => animateNumber(el, target), 250 + index * 140);
  });
}

/** Runs a render inside a View Transition when the browser supports it. */
function withTransition(fn) {
  if (!reduceMotion() && typeof document.startViewTransition === 'function') {
    document.startViewTransition(fn);
  } else {
    fn();
  }
}

function renderHeader() {
  document.getElementById('site-name').textContent = site.name;
  document.getElementById('site-tagline').textContent = site.tagline;
  document.getElementById('site-intro').textContent = site.intro;

  const languages = languageCounts(site.projects);
  const live = site.projects.filter((p) => p.demo).length;
  const stats = [
    { label: 'Projects', value: site.projects.length },
    { label: 'Languages', value: languages.length, sub: languages.map((l) => l.name).join(' · ') },
    { label: 'Live demos', value: live },
  ];

  document.getElementById('stats').innerHTML = stats
    .map(({ label, value, sub }) => `<div class="stat">
  <dt>${escapeHtml(label)}</dt>
  <dd><span class="stat-num" data-count="${value}">0</span></dd>
  ${sub ? `<dd class="stat-sub">${escapeHtml(sub)}</dd>` : ''}
</div>`)
    .join('');

  countUpStats();
}

function renderChips() {
  const counts = categoryCounts(site.projects, site.categories);
  const all = { name: 'all', count: site.projects.length };

  chipsBox.innerHTML = [all, ...counts]
    .map((entry) => {
      const label = entry.name === 'all' ? 'All' : entry.name;
      const pressed = state.category === entry.name;
      return `<button class="chip" type="button" data-category="${escapeHtml(entry.name)}" aria-pressed="${pressed}">${escapeHtml(label)} <span class="n">${entry.count}</span></button>`;
    })
    .join('');
}

function cardHtml(project, index) {
  const points = (project.highlights || [])
    .map((point) => `<li>${highlight(point, state.query)}</li>`)
    .join('');
  const tags = (project.topics || [])
    .map((tag) => `<li>${highlight(tag, state.query)}</li>`)
    .join('');
  const demo = project.demo
    ? `<a class="btn primary" href="${escapeHtml(project.demo)}">Live demo</a>`
    : '';
  const langColor = LANG_COLORS[project.language] || 'var(--accent)';

  return `<li class="card" style="--i:${Math.min(index, 14)}">
  <header>
    <h2>${highlight(project.title, state.query)}</h2>
    <span class="lang" style="--lang-color:${langColor}">${escapeHtml(project.language)}</span>
  </header>
  <p class="summary">${highlight(project.summary, state.query)}</p>
  <ul class="points">${points}</ul>
  <ul class="tags">${tags}</ul>
  <div class="actions">
    ${demo}
    <a class="btn" href="${escapeHtml(repoUrl(project))}">Code</a>
  </div>
</li>`;
}

function render() {
  const shown = selectProjects(site.projects, state);

  cards.innerHTML = shown.map((project, index) => cardHtml(project, index)).join('');
  empty.hidden = shown.length > 0;

  const total = site.projects.length;
  countLine.textContent = shown.length === total
    ? `${total} projects`
    : `${shown.length} of ${total} projects`;

  for (const chip of chipsBox.querySelectorAll('.chip')) {
    chip.setAttribute('aria-pressed', String(chip.dataset.category === state.category));
  }

  writeUrl();
}

/** Keeps the filters in the address bar so a filtered view can be linked to. */
function writeUrl() {
  const params = new URLSearchParams();
  if (state.query) params.set('q', state.query);
  if (state.category !== 'all') params.set('c', state.category);
  const query = params.toString();
  history.replaceState(null, '', query ? `?${query}` : location.pathname);
}

function readUrl() {
  const params = new URLSearchParams(location.search);
  state.query = params.get('q') || '';
  const category = params.get('c');
  state.category = category && site.categories.includes(category) ? category : 'all';
  search.value = state.query;
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

document.getElementById('clear').addEventListener('click', () => {
  state.query = '';
  state.category = 'all';
  search.value = '';
  search.focus();
  withTransition(render);
});

// "/" focuses the search box, the way most code-browsing sites behave.
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== search) {
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

readUrl();
renderHeader();
renderChips();
render();
