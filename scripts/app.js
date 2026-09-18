import site from './data.js';
import { selectProjects, categoryCounts, languageCounts, terms } from './filters.js';

const cards = document.getElementById('cards');
const chipsBox = document.getElementById('chips');
const search = document.getElementById('q');
const countLine = document.getElementById('count');
const empty = document.getElementById('empty');

const state = { query: '', category: 'all' };

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

function renderHeader() {
  document.getElementById('site-name').textContent = site.name;
  document.getElementById('site-tagline').textContent = site.tagline;
  document.getElementById('site-intro').textContent = site.intro;

  const languages = languageCounts(site.projects);
  const live = site.projects.filter((p) => p.demo).length;
  const stats = [
    ['Projects', String(site.projects.length)],
    ['Languages', languages.map((l) => l.name).join(' · ')],
    ['Live demos', String(live)],
  ];

  document.getElementById('stats').innerHTML = stats
    .map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`)
    .join('');
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

function cardHtml(project) {
  const points = (project.highlights || [])
    .map((point) => `<li>${highlight(point, state.query)}</li>`)
    .join('');
  const tags = (project.topics || [])
    .map((tag) => `<li>${highlight(tag, state.query)}</li>`)
    .join('');
  const demo = project.demo
    ? `<a class="btn primary" href="${escapeHtml(project.demo)}">Live demo</a>`
    : '';

  return `<li class="card">
  <header>
    <h2>${highlight(project.title, state.query)}</h2>
    <span class="lang">${escapeHtml(project.language)}</span>
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

  cards.innerHTML = shown.map(cardHtml).join('');
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
  render();
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
  render();
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
