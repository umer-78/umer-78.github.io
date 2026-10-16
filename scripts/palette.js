/**
 * One gemstone per category, shared by the gallery's monoliths, each project's
 * environment, the index and the filter chips. The page is a single dark theme,
 * so each category needs one colour, and it has to hold up as small text on the
 * page background as well as glow in 3D. `short` labels the key under the
 * gallery, where the full names do not fit.
 */
export const PAGE_BACKGROUND = '#070708';
export const GOLD = '#d6b46c';

export const CATEGORY_STYLE = {
  'Security & networking': { short: 'Security', gem: 'Ruby', color: '#e0566f' },
  'Machine learning & AI': { short: 'ML & AI', gem: 'Amethyst', color: '#a98be9' },
  'LLM engineering': { short: 'LLM', gem: 'Sapphire', color: '#6ea6f2' },
  'Data & analytics': { short: 'Data', gem: 'Topaz', color: '#e9a84c' },
  'Applications & services': { short: 'Apps', gem: 'Emerald', color: '#4fc897' },
  'Games & interactive': { short: 'Games', gem: 'Rose quartz', color: '#ee93c0' },
};

/** Inline custom property that gives an element its category's gem colour. */
export function gemVars(category) {
  const style = CATEGORY_STYLE[category];
  return style ? `--gem:${style.color}` : '';
}
