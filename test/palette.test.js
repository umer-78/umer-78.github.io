import test from 'node:test';
import assert from 'node:assert/strict';
import site from '../scripts/data.js';
import { CATEGORY_STYLE, PAGE_BACKGROUND, GOLD, gemVars } from '../scripts/palette.js';

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

test('every category has a gem, a colour and a short, unique label for the gallery key', () => {
  for (const category of site.categories) {
    const style = CATEGORY_STYLE[category];
    assert.ok(style, `${category} has no style`);
    assert.match(style.color, /^#[0-9a-f]{6}$/);
    assert.ok(style.gem, `${category} has no gem`);
    assert.ok(style.short.length <= 8, `${category}: "${style.short}" is too long for the key`);
  }
  const shorts = site.categories.map((c) => CATEGORY_STYLE[c].short);
  const gems = site.categories.map((c) => CATEGORY_STYLE[c].gem);
  assert.equal(new Set(shorts).size, shorts.length);
  assert.equal(new Set(gems).size, gems.length);
});

test('gem colours and the gold accent are readable as small text on the page background', () => {
  // the colours label categories in the index, so they are held to the 4.5:1 text ratio, not just 3:1 for graphics
  for (const [category, style] of Object.entries(CATEGORY_STYLE)) {
    const ratio = contrast(style.color, PAGE_BACKGROUND);
    assert.ok(ratio >= 4.5, `${category} ${ratio.toFixed(2)}`);
  }
  assert.ok(contrast(GOLD, PAGE_BACKGROUND) >= 4.5);
});

test('gemVars gives the gem colour, and nothing for an unknown category', () => {
  assert.equal(gemVars('LLM engineering'), '--gem:#6ea6f2');
  assert.equal(gemVars('Nope'), '');
});
