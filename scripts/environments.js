/**
 * Every project opens into its own 3D environment.
 *
 * There are sixteen kinds of world, each built around what a group of projects
 * actually does: a vault of turning dials for password strength, a radar sweep
 * for intrusion detection, a decision grove for gradient boosting. A project's
 * name seeds everything inside its world (how many dials, how the paths run,
 * how fast things turn), so two projects of the same kind still never look
 * alike.
 *
 * This module has no DOM and no three.js in it, so the tests check the same
 * mapping the page draws.
 */

export const ENVIRONMENTS = {
  vault: { title: 'The Cipher Vault', line: 'Gold dials turn like a combination lock around a guarded stone.' },
  radar: { title: 'The Watchtower', line: 'A sweeping beam turns up whatever does not belong.' },
  neural: { title: 'The Neural Cathedral', line: 'Arches of neurons; signal travels from one to the next.' },
  constellation: { title: 'The Observatory', line: 'A star chart of nodes, and the one path that joins them.' },
  nebula: { title: 'The Nebula Room', line: 'Clouds of points that settle into their own kind.' },
  terrain: { title: 'The Topography Hall', line: 'A landscape drawn in gold contour lines, with a forecast above it.' },
  skyline: { title: 'The Skyline', line: 'Obsidian columns rising and falling like a living chart.' },
  silk: { title: 'The Silk Room', line: 'Series of data drifting through the dark like ribbons.' },
  foundry: { title: 'The Foundry', line: 'Blocks of stone stacked level on level, a lookup falling through them.' },
  oracle: { title: 'The Oracle', line: 'A dark orb in a golden armillary, with tokens in orbit.' },
  library: { title: 'The Library', line: 'Pages on a spiral stair; the right one is drawn out and lit.' },
  arcade: { title: 'The Arcade', line: 'A neon grid under a setting sun, and something to chase.' },
  grove: { title: 'The Grove', line: 'Trees of gold where every fork is a decision.' },
  mosaic: { title: 'The Mosaic', line: 'A wall of tiles, read and rewritten one window at a time.' },
  maelstrom: { title: 'The Maelstrom', line: 'A vortex of light drawn down into a golden ring.' },
  gatehouse: { title: 'The Gatehouse', line: 'Gates in procession; only what is allowed walks through.' },
};

/** Which world each project lives in. A project missing here gets its category's default. */
export const PROJECT_ENVIRONMENT = {
  'regex-engine': 'constellation',
  'route-planner': 'constellation',
  'graph-rag': 'constellation',
  'research-agents': 'constellation',
  'password-strength-checker': 'vault',
  'bank-ledger-csharp': 'vault',
  warmstart: 'vault',
  'log-sentinel': 'radar',
  'file-integrity-monitor': 'radar',
  'anomaly-detection': 'radar',
  'llm-regression-detector': 'radar',
  'security-headers-scanner': 'gatehouse',
  'url-shortener-go': 'gatehouse',
  doorman: 'gatehouse',
  'text-to-sql-guardrails': 'gatehouse',
  'subnet-calculator': 'foundry',
  'mini-sql-engine': 'foundry',
  'kv-store': 'foundry',
  'task-board': 'foundry',
  'text-search': 'library',
  'rag-document-qa': 'library',
  'self-healing-docs': 'library',
  fieldnote: 'library',
  'timeseries-forecasting': 'terrain',
  'weather-now': 'terrain',
  groundtruth: 'terrain',
  'sales-insights': 'skyline',
  stocksense: 'skyline',
  'inventory-management-system': 'skyline',
  'llm-cost-autopilot': 'skyline',
  'ta-indicators': 'silk',
  diffkit: 'silk',
  coinvantage: 'silk',
  'sentiment-analyzer': 'silk',
  'pebble-lang': 'oracle',
  'umer-78-llm-gateway': 'oracle',
  'llm-arbitration': 'oracle',
  slotfill: 'oracle',
  loadgun: 'maelstrom',
  leadflow: 'maelstrom',
  'prompt-ab-platform': 'maelstrom',
  'project-tracker': 'mosaic',
  'image-toolkit': 'mosaic',
  'pipeline-forensics': 'mosaic',
  'ui-lab': 'arcade',
  'snake-game': 'arcade',
  GD_PROJECT: 'arcade',
  'gradient-boosting': 'grove',
  'ai-feature-flags': 'grove',
  casefile: 'grove',
  'recommender-engine': 'nebula',
  'customer-segmentation-clustering': 'nebula',
  'judge-calibration': 'nebula',
  'eval-dataset-generator': 'nebula',
  'customer-churn-prediction': 'neural',
  'neural-network-from-scratch': 'neural',
  'ml-model-serving-api': 'neural',
  distill: 'neural',
  'lexical-analyzer-flex': 'oracle',
  'compiler-parser': 'grove',
  'arcanum-of-warrior': 'arcade',
  'treasure-hunt': 'terrain',
};

/** The world a new project gets until it is given one of its own. */
export const CATEGORY_ENVIRONMENT = {
  'Security & networking': 'vault',
  'Machine learning & AI': 'neural',
  'LLM engineering': 'oracle',
  'Data & analytics': 'terrain',
  'Applications & services': 'foundry',
  'Games & interactive': 'arcade',
};

/** FNV-1a: a stable 32-bit number from a string, the same in every browser and in Node. */
export function hashString(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** A small seeded generator (mulberry32): the same seed always gives the same world. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function environmentKind(project) {
  return PROJECT_ENVIRONMENT[project.name] || CATEGORY_ENVIRONMENT[project.category] || 'oracle';
}

/** Everything the page needs to name and build one project's world. */
export function environmentFor(project, index = 0) {
  const kind = environmentKind(project);
  return {
    kind,
    title: ENVIRONMENTS[kind].title,
    line: ENVIRONMENTS[kind].line,
    seed: hashString(project.name),
    edition: index + 1,
  };
}

/** 2026 → "MMXXVI", for the edition marks. */
export function romanNumeral(value) {
  let n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0 || n >= 4000) return '';
  const steps = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [size, mark] of steps) {
    while (n >= size) {
      out += mark;
      n -= size;
    }
  }
  return out;
}
