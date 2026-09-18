/**
 * Pure selection logic for the project list.
 *
 * It lives in its own module with no DOM in it so the same functions the page
 * runs are the ones the tests run — a filter that passes here cannot behave
 * differently in the browser.
 */

/** Lowercased haystack for one project: everything a search should match. */
export function haystack(project) {
  return [
    project.name,
    project.title,
    project.summary,
    project.language,
    ...(project.topics || []),
    ...(project.highlights || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Splits a query into terms. Every term must match (AND), which is what people expect. */
export function terms(query) {
  return String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function matchesQuery(project, query) {
  const hay = haystack(project);
  return terms(query).every((term) => hay.includes(term));
}

export function matchesCategory(project, category) {
  return !category || category === 'all' || project.category === category;
}

export function selectProjects(projects, { query = '', category = 'all' } = {}) {
  return projects.filter((p) => matchesCategory(p, category) && matchesQuery(p, query));
}

/** Categories present in the data, each with its count, in a stable order. */
export function categoryCounts(projects, order) {
  const counts = new Map();
  for (const project of projects) {
    counts.set(project.category, (counts.get(project.category) || 0) + 1);
  }
  const known = order.filter((name) => counts.has(name));
  const rest = [...counts.keys()].filter((name) => !order.includes(name)).sort();
  return [...known, ...rest].map((name) => ({ name, count: counts.get(name) }));
}

/** Language totals for the summary strip, biggest first, ties broken by name. */
export function languageCounts(projects) {
  const counts = new Map();
  for (const project of projects) {
    counts.set(project.language, (counts.get(project.language) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
