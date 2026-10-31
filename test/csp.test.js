import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

for (const page of ['index.html', '404.html']) {
  test(`${page} runs no inline script the CSP does not name by hash`, () => {
    const html = readFileSync(new URL(`../${page}`, import.meta.url), 'utf8');
    const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
    for (const d of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "script-src-attr 'none'"]) assert.ok(csp.includes(d), d);
    assert.doesNotMatch(csp, /unsafe-eval|script-src[^;]*unsafe-inline/);
    for (const [, attrs, body] of html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
      const hash = createHash('sha256').update(body).digest('base64');
      assert.ok(csp.includes(`'sha256-${hash}'`), `inline script ${attrs.trim()} is allowed by its hash`);
    }
    assert.doesNotMatch(html, /\son[a-z]+="/, 'no inline event handlers');
  });
}

test('no script writes an inline event handler', () => {
  for (const f of ['app.js', 'gallery.js', 'world.js', 'scenes.js']) {
    const src = readFileSync(new URL(`../scripts/${f}`, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /\son(error|load|click)="/, f);
  }
});
