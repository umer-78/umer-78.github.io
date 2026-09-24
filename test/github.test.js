import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeRepos, timeAgo, ciBadgeUrl, loadRepoStats } from '../scripts/github.js';

test('summarizeRepos keeps stars, last push and archived, keyed by name', () => {
  const out = summarizeRepos([
    { name: 'a', stargazers_count: 3, pushed_at: '2026-09-20T10:00:00Z', archived: false },
    { name: 'b', stargazers_count: null, updated_at: '2026-01-01T00:00:00Z', archived: true },
    { nope: true },
  ]);
  assert.deepEqual(out, {
    a: { stars: 3, pushedAt: '2026-09-20T10:00:00Z', archived: false },
    b: { stars: 0, pushedAt: '2026-01-01T00:00:00Z', archived: true },
  });
  assert.deepEqual(summarizeRepos({ message: 'rate limited' }), {});
});

test('timeAgo uses whole units and never goes negative', () => {
  const now = Date.parse('2026-09-24T12:00:00Z');
  assert.equal(timeAgo('2026-09-24T11:59:30Z', now), 'just now');
  assert.equal(timeAgo('2026-09-24T09:00:00Z', now), '3 hours ago');
  assert.equal(timeAgo('2026-09-23T12:00:00Z', now), '1 day ago');
  assert.equal(timeAgo('2026-07-01T00:00:00Z', now), '2 months ago');
  assert.equal(timeAgo('2026-09-25T00:00:00Z', now), 'just now');
  assert.equal(timeAgo('not a date', now), '');
});

test('the CI badge points at the repo\'s ci.yml on main', () => {
  assert.equal(ciBadgeUrl('umer-78', 'kv-store'), 'https://github.com/umer-78/kv-store/actions/workflows/ci.yml/badge.svg?branch=main');
});

test('a failed or rate-limited request gives null, not zeros', async () => {
  const failing = async () => ({ ok: false, status: 403, json: async () => ({}) });
  assert.equal(await loadRepoStats('umer-78', failing), null);
  const offline = async () => { throw new Error('offline'); };
  assert.equal(await loadRepoStats('umer-78', offline), null);
});
