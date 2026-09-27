/**
 * One colour per category, shared by the hero's 3D orbits, the filter chips and
 * the cards. `light` is the deeper shade that holds contrast on the light theme,
 * `dark` the brighter one for the dark theme. `short` labels the key under the
 * 3D scene, where the full names do not fit.
 */
export const CATEGORY_STYLE = {
  'Security & networking': { short: 'Security', light: '#e11d48', dark: '#fb7185' },
  'Machine learning & AI': { short: 'ML & AI', light: '#7c3aed', dark: '#a78bfa' },
  'LLM engineering': { short: 'LLM', light: '#0284c7', dark: '#38bdf8' },
  'Data & analytics': { short: 'Data', light: '#c2410c', dark: '#fbbf24' },
  'Applications & services': { short: 'Apps', light: '#047857', dark: '#34d399' },
  'Games & interactive': { short: 'Games', light: '#be185d', dark: '#f472b6' },
};

/** Inline custom properties that give an element its category's two shades. */
export function categoryVars(category) {
  const style = CATEGORY_STYLE[category];
  return style ? `--c-l:${style.light};--c-d:${style.dark}` : '';
}
