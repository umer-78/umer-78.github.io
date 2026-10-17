import test from 'node:test';
import assert from 'node:assert/strict';
import site from '../scripts/data.js';
import {
  ENVIRONMENTS, PROJECT_ENVIRONMENT, CATEGORY_ENVIRONMENT,
  environmentFor, environmentKind, hashString, mulberry32, romanNumeral,
} from '../scripts/environments.js';

test('every project opens into a world that exists', () => {
  site.projects.forEach((project, index) => {
    const env = environmentFor(project, index);
    assert.ok(ENVIRONMENTS[env.kind], `${project.name}: unknown world "${env.kind}"`);
    assert.ok(env.title && env.line, `${project.name}: world without a name`);
    assert.equal(env.edition, index + 1);
  });
});

test('every project is placed by hand, and the map names no project that is gone', () => {
  const names = new Set(site.projects.map((p) => p.name));
  for (const project of site.projects) {
    assert.ok(PROJECT_ENVIRONMENT[project.name], `${project.name} falls back to its category's world; give it one of its own`);
  }
  for (const name of Object.keys(PROJECT_ENVIRONMENT)) {
    assert.ok(names.has(name), `${name} is mapped but is not in the project list`);
  }
});

test('no two projects share an environment: same kind means a different seed', () => {
  const signatures = site.projects.map((p) => `${environmentKind(p)}:${hashString(p.name)}`);
  assert.equal(new Set(signatures).size, signatures.length);
});

test('every kind of world is used, and none is crowded', () => {
  const counts = {};
  for (const project of site.projects) counts[environmentKind(project)] = (counts[environmentKind(project)] || 0) + 1;
  for (const kind of Object.keys(ENVIRONMENTS)) {
    assert.ok(counts[kind] >= 1, `${kind} is built but no project uses it`);
    assert.ok(counts[kind] <= 5, `${kind} holds ${counts[kind]} projects; spread them out`);
  }
});

test('a new project falls back to its category, and every category has a fallback', () => {
  for (const category of site.categories) {
    assert.ok(ENVIRONMENTS[CATEGORY_ENVIRONMENT[category]], `${category} has no fallback world`);
  }
  assert.equal(environmentKind({ name: 'not-yet-mapped', category: 'Games & interactive' }), 'arcade');
});

test('seeds are stable and the generator stays in [0, 1)', () => {
  assert.equal(hashString('regex-engine'), hashString('regex-engine'));
  assert.notEqual(hashString('regex-engine'), hashString('route-planner'));
  const a = mulberry32(42);
  const b = mulberry32(42);
  for (let i = 0; i < 200; i += 1) {
    const x = a();
    assert.equal(x, b());
    assert.ok(x >= 0 && x < 1);
  }
});

test('featured projects exist and are not listed twice', () => {
  const names = new Set(site.projects.map((p) => p.name));
  assert.ok(site.featured.length >= 3);
  assert.equal(new Set(site.featured).size, site.featured.length);
  for (const name of site.featured) assert.ok(names.has(name), `${name} is featured but not a project`);
});

test('roman numerals for the edition marks', () => {
  assert.equal(romanNumeral(2026), 'MMXXVI');
  assert.equal(romanNumeral(4), 'IV');
  assert.equal(romanNumeral(58), 'LVIII');
  assert.equal(romanNumeral(0), '');
});
