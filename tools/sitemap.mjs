// Writes sitemap.xml: this page, the AI video pages, and every project demo hosted on this domain.
// Run after adding a project or a page: node tools/sitemap.mjs (a test checks it is current).
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import site from '../scripts/data.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const HOST = 'https://umer-78.github.io/';

function pages(dir) {
  const out = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...pages(rel));
    else if (name === 'index.html') out.push(HOST + relative(ROOT, join(ROOT, dir)).split(sep).join('/') + '/');
  }
  return out;
}

export function sitemapUrls() {
  const demos = (site.projects ?? []).map((p) => p.demo).filter((u) => typeof u === 'string' && u.startsWith(HOST));
  return [...new Set([HOST, ...pages('ai-video-portfolio'), ...demos])].sort((a, b) => (a === HOST ? -1 : b === HOST ? 1 : a.localeCompare(b)));
}

export function sitemapXml() {
  const rows = sitemapUrls().map((u) => `  <url><loc>${u}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  writeFileSync(join(ROOT, 'sitemap.xml'), sitemapXml());
  console.log(`sitemap.xml: ${sitemapUrls().length} pages`);
}
