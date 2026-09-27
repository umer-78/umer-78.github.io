import test from 'node:test';
import assert from 'node:assert/strict';
import site from '../scripts/data.js';
import { CATEGORY_STYLE, categoryVars } from '../scripts/palette.js';

/** WCAG relative luminance of a #rrggbb colour. */
function luminance(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

test('every category has a colour for each theme and a short, unique label for the 3D key', () => {
  for (const category of site.categories) {
    const style = CATEGORY_STYLE[category];
    assert.ok(style, `${category} has no colour`);
    assert.match(style.light, /^#[0-9a-f]{6}$/);
    assert.match(style.dark, /^#[0-9a-f]{6}$/);
    assert.ok(style.short.length <= 8, `${category}: "${style.short}" is too long for the key`);
  }
  const shorts = site.categories.map((c) => CATEGORY_STYLE[c].short);
  assert.equal(new Set(shorts).size, shorts.length);
});

test('category colours keep at least 3:1 contrast on the page background in both themes', () => {
  // WCAG 1.4.11 asks 3:1 for graphics that carry meaning, such as these dots and orbits
  for (const [category, style] of Object.entries(CATEGORY_STYLE)) {
    assert.ok(contrast(style.light, '#fafbfc') >= 3, `${category} light ${contrast(style.light, '#fafbfc').toFixed(2)}`);
    assert.ok(contrast(style.dark, '#0a0c10') >= 3, `${category} dark ${contrast(style.dark, '#0a0c10').toFixed(2)}`);
  }
});

test('categoryVars gives both shades, and nothing for an unknown category', () => {
  assert.equal(categoryVars('LLM engineering'), '--c-l:#0284c7;--c-d:#38bdf8');
  assert.equal(categoryVars('Nope'), '');
});
