import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sitemapXml, sitemapUrls } from '../tools/sitemap.mjs';

test('sitemap.xml lists this page, the AI video pages and every demo on this domain', () => {
  assert.equal(readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8'), sitemapXml(), 'run: node tools/sitemap.mjs');
  const urls = sitemapUrls();
  assert.equal(urls[0], 'https://umer-78.github.io/');
  assert.ok(urls.includes('https://umer-78.github.io/ai-video-portfolio/'));
  assert.ok(urls.every((u) => u.startsWith('https://umer-78.github.io/') && u.endsWith('/')));
});

test('robots.txt points crawlers at the sitemap', () => {
  assert.match(readFileSync(new URL('../robots.txt', import.meta.url), 'utf8'), /^Sitemap: https:\/\/umer-78\.github\.io\/sitemap\.xml$/m);
});
