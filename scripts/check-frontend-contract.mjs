import { readFile, mkdtemp, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadCases, prerender, prerenderNotFound, buildSitemap, BASE_PATH, DATA_FILES } from './prerender-cases.mjs';
import { buildBundle } from './bundle-cases.mjs';

const fail=message=>{throw new Error(message);};
const [html,app,render,styles,rights,legal,manifest,sw,sitemap]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../app.js',import.meta.url),'utf8'),
  readFile(new URL('../render-cases.js',import.meta.url),'utf8'),
  readFile(new URL('../styles.css',import.meta.url),'utf8'),
  readFile(new URL('../rights-pulse.css',import.meta.url),'utf8'),
  readFile(new URL('../legal-updates.js',import.meta.url),'utf8'),
  readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'),
  readFile(new URL('../sw.js',import.meta.url),'utf8'),
  readFile(new URL('../sitemap.xml',import.meta.url),'utf8'),
]);

for(const required of [
  'id="app"',
  'id="siteHeader"',
  'src="render-cases.js"',
  'src="cases-data.js"',
  'src="app.js"',
  'href="styles.css"',
  'href="rights-pulse.css"',
  'class="skip-link"',
  '<noscript>',
  'rel="canonical"',
  'property="og:image"',
  'name="twitter:card"',
  'application/ld+json',
  'id="shareStatus"',
]) if(!html.includes(required)) fail(`Missing reader shell contract: ${required}`);

for(const retired of [
  'caseSwitcher',
  'panic-card',
  'progressCount',
  'templateDetails',
  'discussionTitle',
  'data-print',
  'read-progress.js',
  'case-library.css',
  'feedback.js',
  'feedback.css',
  'membership-config.js',
]) if(html.includes(retired)) fail(`Retired reader UI returned: ${retired}`);

if(html.includes('src="legal-updates.js"')) fail('legal-updates.js must stay off the home page for payload reasons');
for(const file of DATA_FILES) if(html.includes(`src="${file}"`)) fail(`Home page must ship the bundle, not the loose CASE source: ${file}`);

for(const required of [
  'function renderHome()',
  'function renderCase(item)',
  'function filterTopics(query)',
  'function applyFilters()',
  'function renderNotFound()',
  "document.body.dataset.page='home'",
  "document.body.dataset.page='case'",
  'window.BuchikuiRights.render(item.slug)',
  'BuchikuiRender',
  'BUCHIKUI_FACETS',
  'topic-facets',
  'facet-chip',
  "new URLSearchParams(location.search).get('case')",
  '最近值得知道',
]) if(!app.includes(required)) fail(`Missing public-legal-literacy contract: ${required}`);

for(const retired of [
  'Math.random(',
  'localStorage',
  'renderSwitcher',
  'renderTemplate',
  'renderDiscussion',
  'progressBar',
  'criticalCount',
]) if(app.includes(retired)) fail(`Retired AI/tool path returned: ${retired}`);

for(const required of [
  'caseArticleHtml',
  'caseReminders',
  'reminderRow',
  'relatedRow',
  'routeRow',
  'sourceRow',
  'homeRow',
  'topicRow',
  'missingHtml',
  'related-topics',
  'reminder-basis',
  'data-category',
  'hero?.title',
  'item.panic?.title',
  'item.route?.intro',
  '这些地方最容易被忽视',
  '依据与出处',
]) if(!render.includes(required)) fail(`Shared renderer missing contract: ${required}`);
if(render.includes('document.')) fail('Shared renderer must stay DOM-free so prerender and browser share it');

for(const required of [
  '.home-hero',
  '.search-box',
  '.recent-row',
  '.topic-row',
  '.topic-facets',
  '.facet-chip',
  '.related-list',
  '.reminder-basis',
  '.authority-section',
  '.reminder-row',
  '.source-list',
  '.case-nav',
  '.sr-only',
]) if(!styles.includes(required)) fail(`Missing editorial design contract: ${required}`);

for(const required of [
  '.rights-pulse-meta',
  '.rights-pulse-document',
  '.rights-pulse-action',
  '.rights-pulse-sources',
  '.rights-pulse+.rights-pulse',
  '.rights-pulse-content h3',
]) if(!rights.includes(required)) fail(`Missing authority layer style: ${required}`);

for(const required of ['裁判参考','裁判要点','权威依据','现实提醒']){
  if(!legal.includes(required)) fail(`Authority layer is missing canonical terminology: ${required}`);
}

for(const retired of ['case-library.css','read-progress.js','feedback.css','feedback.js','membership-config.js']){
  if(sw.includes(retired)) fail(`Retired asset still cached by service worker: ${retired}`);
}
if(!sw.includes('render-cases.js')) fail('Service worker must cache the shared renderer');
if(!sw.includes('cases-data.js')) fail('Service worker must cache the CASE bundle');
for(const file of DATA_FILES) if(sw.includes(`'./${file}'`)) fail(`Service worker still precaches the loose CASE source: ${file}`);
if(!sw.includes("const CACHE_NAME='buchikui-pwa-v14'")) fail('PWA cache version must be v14 after facet/cross-link release');

const normalizeEol=value=>value.replace(/\r\n/g,'\n');
const bundle=await readFile(new URL('../cases-data.js',import.meta.url),'utf8');
if(normalizeEol(bundle)!==normalizeEol(await buildBundle())) fail('cases-data.js is stale; run node scripts/bundle-cases.mjs');

const parsedManifest=JSON.parse(manifest);
if(!String(parsedManifest.name||'').includes('消费普法')) fail('Manifest must use the consumer legal-literacy positioning');

const cases=await loadCases();
if(!Array.isArray(cases)||cases.length<10) fail('CASE data failed to load');
const slugs=new Set();
for(const item of cases){
  if(!item?.slug||!item?.name||!item?.meta?.title||!item?.meta?.description) fail(`Invalid CASE record: ${item?.slug||'unknown'}`);
  if(slugs.has(item.slug)) fail(`Duplicate CASE slug: ${item.slug}`);
  slugs.add(item.slug);
}

const sitemapLocs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
const sitemapSlugs=new Set(sitemapLocs.map(loc=>(loc.match(/\/c\/([a-z0-9-]+)\/$/)||[])[1]).filter(Boolean));
for(const slug of slugs) if(!sitemapSlugs.has(slug)) fail(`Sitemap is missing CASE: ${slug}`);
for(const slug of sitemapSlugs) if(!slugs.has(slug)) fail(`Sitemap lists unknown CASE: ${slug}`);
if(!sitemapLocs.includes('https://liuh886.github.io/buchikui/')) fail('Sitemap is missing the home entry');

const generatedSitemap=await buildSitemap();
const generatedUrls=new Set([...generatedSitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]));
for(const url of sitemapLocs) if(!generatedUrls.has(url)) fail(`Sitemap entry is not derivable from CASE data: ${url}`);

if((await stat(new URL('../app.js',import.meta.url))).size>30*1024) fail('app.js exceeded 30KB simplicity budget');
if((await stat(new URL('../styles.css',import.meta.url))).size>24*1024) fail('styles.css exceeded 24KB simplicity budget');
if((await stat(new URL('../render-cases.js',import.meta.url))).size>12*1024) fail('render-cases.js exceeded 12KB simplicity budget');

const out=await mkdtemp(path.join(os.tmpdir(),'buchikui-prerender-'));
const outputs=await prerender(out);
if(outputs.length!==cases.length) fail(`Prerender count mismatch: ${outputs.length}/${cases.length}`);
const sample=await readFile(path.join(out,'c',cases[0].slug,'index.html'),'utf8');
if(!sample.includes(`rel="canonical" href="https://liuh886.github.io/buchikui/c/${cases[0].slug}/"`)) fail('Prerendered CASE lacks canonical URL');
if(!sample.includes('src="../../app.js"')) fail('Prerendered CASE assets are not rooted correctly');
if(!sample.includes('src="../../legal-updates.js"')) fail('Prerendered CASE must load the authority layer');
if(!sample.includes('<main id="app" tabindex="-1"><article class="case-page">')) fail('Prerendered CASE has no static body content');
if(!sample.includes('application/ld+json')) fail('Prerendered CASE lacks structured data');
if(!sample.includes(`"@type":"Article"`)) fail('Prerendered CASE lacks Article structured data');
if(!sample.includes(`/c/${cases[0].slug}/`)) fail('Prerendered CASE lacks its canonical path');
if(sample.includes('src="legal-updates.js"')) fail('Prerendered CASE asset rooting regressed');

const notFound=await prerenderNotFound(out);
const notFoundHtml=await readFile(notFound.file,'utf8');
if(!notFoundHtml.includes('data-not-found="1"')) fail('404.html must flag the not-found shell');
if(!notFoundHtml.includes('noindex')) fail('404.html must be noindex');
if(!notFoundHtml.includes(`href="${BASE_PATH}styles.css"`)) fail('404.html assets must be root-absolute');
if(!notFoundHtml.includes('<main id="app" tabindex="-1"><section class="missing shell">')) fail('404.html lacks static fallback content');

console.log(`Frontend contract OK: ${cases.length} topics, static case bodies, sitemap coverage, 404 shell.`);
