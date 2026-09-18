import test from 'node:test';
import assert from 'node:assert/strict';
import site from '../scripts/data.js';
import { selectProjects, categoryCounts, languageCounts, matchesQuery, terms, haystack } from '../scripts/filters.js';

test('every project carries the fields the page renders', () => {
  for (const project of site.projects) {
    assert.ok(project.name, 'name');
    assert.ok(project.title, `title for ${project.name}`);
    assert.ok(project.summary, `summary for ${project.name}`);
    assert.ok(project.language, `language for ${project.name}`);
    assert.ok(Array.isArray(project.highlights) && project.highlights.length >= 2, `highlights for ${project.name}`);
    assert.ok(Array.isArray(project.topics) && project.topics.length >= 2, `topics for ${project.name}`);
  }
});

test('project names are unique', () => {
  const names = site.projects.map((p) => p.name);
  assert.equal(new Set(names).size, names.length);
});

test('every category used is one the page offers as a chip', () => {
  for (const project of site.projects) {
    assert.ok(site.categories.includes(project.category), `${project.name}: ${project.category}`);
  }
});

test('demo links are absolute https URLs under the owner pages domain', () => {
  for (const project of site.projects.filter((p) => p.demo)) {
    const url = new URL(project.demo);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, `${site.owner}.github.io`);
    assert.ok(url.pathname.startsWith(`/${project.name}`), `${project.name} demo path`);
  }
});

test('an empty query selects everything', () => {
  assert.equal(selectProjects(site.projects, {}).length, site.projects.length);
  assert.equal(selectProjects(site.projects, { query: '   ' }).length, site.projects.length);
});

test('search is case-insensitive and matches topics as well as text', () => {
  const byTopic = selectProjects(site.projects, { query: 'SQLITE' });
  assert.ok(byTopic.length >= 2);
  assert.ok(byTopic.every((p) => haystack(p).includes('sqlite')));
});

test('several words must all match, not any of them', () => {
  const python = selectProjects(site.projects, { query: 'python' });
  const pythonSecurity = selectProjects(site.projects, { query: 'python security' });
  assert.ok(pythonSecurity.length > 0);
  assert.ok(pythonSecurity.length < python.length);
  assert.ok(pythonSecurity.every((p) => python.includes(p)));
});

test('a query that matches nothing returns nothing rather than everything', () => {
  assert.deepEqual(selectProjects(site.projects, { query: 'zzzz-not-a-thing' }), []);
});

test('category and query narrow together', () => {
  const ml = selectProjects(site.projects, { category: 'Machine learning & AI' });
  const mlRetrieval = selectProjects(site.projects, { category: 'Machine learning & AI', query: 'retrieval' });
  assert.ok(ml.length >= 4);
  assert.equal(mlRetrieval.length, 1);
  assert.equal(mlRetrieval[0].name, 'rag-document-qa');
});

test('category counts add up to the project total and follow the declared order', () => {
  const counts = categoryCounts(site.projects, site.categories);
  assert.equal(counts.reduce((sum, c) => sum + c.count, 0), site.projects.length);
  const order = counts.map((c) => c.name);
  assert.deepEqual(order, site.categories.filter((c) => order.includes(c)));
});

test('language counts are sorted biggest first', () => {
  const counts = languageCounts(site.projects);
  for (let i = 1; i < counts.length; i += 1) {
    assert.ok(counts[i - 1].count >= counts[i].count);
  }
  assert.equal(counts.reduce((sum, c) => sum + c.count, 0), site.projects.length);
});

test('terms ignores extra whitespace', () => {
  assert.deepEqual(terms('  go   sqlite '), ['go', 'sqlite']);
  assert.deepEqual(terms(''), []);
  assert.deepEqual(terms(null), []);
});

test('matchesQuery reads the summary, not only the name', () => {
  const ledger = site.projects.find((p) => p.name === 'bank-ledger-csharp');
  assert.ok(matchesQuery(ledger, 'overdraft'));
  assert.ok(matchesQuery(ledger, 'Bank Ledger'));
  assert.ok(!matchesQuery(ledger, 'kubernetes'));
});
