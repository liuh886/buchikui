import { readFile, mkdtemp, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadCases, prerender } from './prerender-cases.mjs';

const fail=message=>{throw new Error(message);};
const [html,app,styles,rights,legal,manifest,sw]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../app.js',import.meta.url),'utf8'),
  readFile(new URL('../styles.css',import.meta.url),'utf8'),
  readFile(new URL('../rights-pulse.css',import.meta.url),'utf8'),
  readFile(new URL('../legal-updates.js',import.meta.url),'utf8'),
  readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'),
  readFile(new URL('../sw.js',import.meta.url),'utf8'),
]);

for(const required of [
  'id="app"',
  'id="siteHeader"',
  'src="legal-updates.js"',
  'src="app.js"',
  'href="styles.css"',
  'href="rights-pulse.css"',
  'class="skip-link"',
  '<noscript>',
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
]) if(html.includes(retired)) fail(`Retired reader UI returned: ${retired}`);

for(const required of [
  'function renderHome()',
  'function renderCase(item)',
  'function filterTopics(query)',
  'function caseReminders(item)',
  "document.body.dataset.page='home'",
  "document.body.dataset.page='case'",
  'window.BuchikuiRights.render(item.slug)',
  "label.textContent=label.textContent.includes('案例')?'裁判参考':'权威依据'",
  '最近值得知道',
  '这些地方最容易被忽视',
  '依据与出处',
]) if(!app.includes(required)) fail(`Missing public-legal-literacy contract: ${required}`);

for(const retired of [
  'Math.random(',
  "searchParams.get('case')",
  'localStorage',
  'renderSwitcher',
  'renderTemplate',
  'renderDiscussion',
  'progressBar',
  'criticalCount',
]) if(app.includes(retired)) fail(`Retired AI/tool path returned: ${retired}`);

for(const required of [
  '.home-hero',
  '.search-box',
  '.recent-row',
  '.topic-row',
  '.authority-section',
  '.reminder-row',
  '.source-list',
]) if(!styles.includes(required)) fail(`Missing editorial design contract: ${required}`);

for(const required of [
  '.rights-pulse-meta',
  '.rights-pulse-document',
  '.rights-pulse-action',
  '.rights-pulse-sources',
]) if(!rights.includes(required)) fail(`Missing authority layer style: ${required}`);

for(const retired of ['case-library.css','read-progress.js']){
  if(sw.includes(retired)) fail(`Retired asset still cached by service worker: ${retired}`);
}
if(!sw.includes("const CACHE_NAME='buchikui-pwa-v11'")) fail('PWA cache version must be v11 after shell replacement');

const parsedManifest=JSON.parse(manifest);
if(!String(parsedManifest.name||'').includes('消费普法')) fail('Manifest must use the consumer legal-literacy positioning');

const cases=await loadCases();
if(!Array.isArray(cases)||cases.length<10) fail('CASE data failed to load');
const slugs=new Set();
for(const item of cases){
  if(!item?.slug||!item?.name||!item?.meta?.title||!item?.meta?.description) fail(`Invalid CASE record: ${item?.slug||'unknown'}`);
  if(slugs.has(item.slug)) fail(`Duplicate CASE slug: ${item.slug}`);
  slugs.add(item.slug);
  const escaped=item.slug.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  if(!new RegExp(`['\"]?${escaped}['\"]?\\s*:\\s*\\{`).test(legal)) fail(`Missing authoritative-material entry: ${item.slug}`);
}

if((await stat(new URL('../app.js',import.meta.url))).size>30*1024) fail('app.js exceeded 30KB simplicity budget');
if((await stat(new URL('../styles.css',import.meta.url))).size>24*1024) fail('styles.css exceeded 24KB simplicity budget');

const out=await mkdtemp(path.join(os.tmpdir(),'buchikui-prerender-'));
const outputs=await prerender(out);
if(outputs.length!==cases.length) fail(`Prerender count mismatch: ${outputs.length}/${cases.length}`);
const sample=await readFile(path.join(out,'c',cases[0].slug,'index.html'),'utf8');
if(!sample.includes(`rel="canonical" href="https://liuh886.github.io/buchikui/c/${cases[0].slug}/"`)) fail('Prerendered CASE lacks canonical URL');
if(!sample.includes('src="../../app.js"')) fail('Prerendered CASE assets are not rooted correctly');

console.log(`Frontend contract OK: ${cases.length} topics, searchable library + authority-first CASE pages.`);
