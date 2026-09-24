/**
 * Live repository facts for the project cards: stars, last push and CI status.
 *
 * One unauthenticated request lists every public repo (GitHub allows 60 an hour
 * per visitor), and the answer is cached for an hour. If GitHub is unreachable or
 * rate-limited, the cards simply show without the line, never with a wrong one.
 * CI status is GitHub's own badge image, which needs no API call at all.
 */
const CACHE_KEY = 'gh:repos:v1';
const MAX_AGE = 60 * 60 * 1000;

/** Keeps only what the cards show, keyed by repo name. */
export function summarizeRepos(list) {
  const out = {};
  for (const repo of Array.isArray(list) ? list : []) {
    if (!repo || typeof repo.name !== 'string') continue;
    out[repo.name] = {
      stars: Number(repo.stargazers_count) || 0,
      pushedAt: repo.pushed_at || repo.updated_at || null,
      archived: Boolean(repo.archived),
    };
  }
  return out;
}

/** "3 days ago", "just now", "5 months ago" — whole units, never a future date. */
export function timeAgo(iso, now = Date.now()) {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const s = Math.max(0, Math.round((now - then) / 1000));
  const steps = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [unit, size] of steps) {
    const n = Math.floor(s / size);
    if (n >= 1) return `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  }
  return 'just now';
}

export function ciBadgeUrl(owner, name) {
  return `https://github.com/${owner}/${name}/actions/workflows/ci.yml/badge.svg?branch=main`;
}

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    return cached && typeof cached.at === 'number' && cached.repos ? cached : null;
  } catch {
    return null;
  }
}

/** Resolves to { name: { stars, pushedAt, archived } }, or null when nothing is known. */
export async function loadRepoStats(owner, fetchImpl = globalThis.fetch) {
  const cached = readCache();
  if (cached && Date.now() - cached.at < MAX_AGE) return cached.repos;
  try {
    const res = await fetchImpl(`https://api.github.com/users/${encodeURIComponent(owner)}/repos?per_page=100&type=owner`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
    const repos = summarizeRepos(await res.json());
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), repos })); } catch { /* private mode */ }
    return repos;
  } catch {
    return cached ? cached.repos : null; // an hour-old count beats none; no count beats a made-up one
  }
}
