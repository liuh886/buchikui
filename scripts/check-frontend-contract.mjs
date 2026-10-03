import { readFile, mkdtemp, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadCases, loadRawCases, loadRuntime, prerender, prerenderNotFound, buildSitemap, BASE_PATH, listDataFiles } from './prerender-cases.mjs';
import { buildBundle } from './bundle-cases.mjs';
import { buildContentIndex, CONTENT_INDEX } from './build-content-index.mjs';
import { checkCorpus } from './check-corpus.mjs';
import { buildAuthority } from './build-authority.mjs';
import { validateCases } from './lib/case-schema.mjs';
import { unmappedTypes } from './facets.mjs';
import { loadCorpus, urlIndex } from './lib/corpus.mjs';

const fail=message=>{throw new Error(message);};
const dataFileList=await listDataFiles();
const [html,app,render,styles,rights,authorityRuntime,manifest,sw,sitemap]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../app.js',import.meta.url),'utf8'),
  readFile(new URL('../render-cases.js',import.meta.url),'utf8'),
  readFile(new URL('../styles.css',import.meta.url),'utf8'),
  readFile(new URL('../rights-pulse.css',import.meta.url),'utf8'),
  readFile(new URL('../editorial/authority-runtime.js',import.meta.url),'utf8'),
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
for(const file of dataFileList) if(html.includes(`src="${file}"`)) fail(`Home page must ship the bundle, not the loose CASE source: ${file}`);

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
  'mergedSources',
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
  'opts.authoritySources',
  'opts.verified',
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
  '.facet-chip{min-height:44px}',
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

for(const required of ['裁判参考','裁判要点','权威依据','现实提醒','本批核验','allSources:slug=>','verifiedAt:slug=>']){
  if(!authorityRuntime.includes(required)) fail(`Authority runtime is missing canonical terminology: ${required}`);
}
for(const retired of ['syncSources','sourceList','sourcesTitle',"getElementById('caseName')","querySelector('.hero')"]){
  if(authorityRuntime.includes(retired)) fail(`Authority layer still carries dead code: ${retired}`);
}

for(const retired of ['case-library.css','read-progress.js','feedback.css','feedback.js','membership-config.js']){
  if(sw.includes(retired)) fail(`Retired asset still cached by service worker: ${retired}`);
}
if(!sw.includes('render-cases.js')) fail('Service worker must cache the shared renderer');
if(!sw.includes('cases-data.js')) fail('Service worker must cache the CASE bundle');
for(const file of dataFileList) if(sw.includes(`'./${file}'`)) fail(`Service worker still precaches the loose CASE source: ${file}`);
if(!sw.includes("const CACHE_NAME='buchikui-pwa-v15'")) fail('PWA cache version must be v15 after the source-hygiene release');

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
  if(!item?.meta?.question) fail(`CASE is missing meta.question (docs/content-index.md is generated from it): ${item?.slug||'unknown'}`);
  if(slugs.has(item.slug)) fail(`Duplicate CASE slug: ${item.slug}`);
  slugs.add(item.slug);
}

// 权威依据层纪律：每条依据必须有可打开的一手或明确标注的报道链接，媒体与网络爆料不得单独作依据。
const {authority,render:caseRender}=await loadRuntime();
const MEDIA_ONLY=/网络爆料|网传|网络热议|舆论热议|自媒体|论坛|Reddit/i;
let missingVerified=0;
for(const item of cases){
  const rules=authority.getRules(item.slug)||[];
  if(!rules.length) fail(`CASE has no authoritative material: ${item.slug}`);
  const ids=new Set(rules.map(rule=>rule.id));
  for(const rule of rules){
    if(MEDIA_ONLY.test(String(rule.type||''))) fail(`Authority rule leans on unverified media: ${item.slug}/${rule.id} (${rule.type})`);
    const sources=rule.sources||[];
    if(!sources.length) fail(`Authority rule has no source: ${item.slug}/${rule.id}`);
    for(const source of sources){
      let url;
      try{ url=new URL(source.href); }catch{ fail(`Authority source is not a URL: ${item.slug}/${rule.id} -> ${source.href}`); continue; }
      if(url.protocol!=='https:'&&url.protocol!=='http:') fail(`Authority source is not http(s): ${item.slug}/${rule.id}`);
      if(!url.pathname.replace(/\/+$/,'')) fail(`Authority source points at a bare domain, not the document: ${item.slug}/${rule.id} -> ${source.href}`);
    }
  }
  for(const reminder of caseRender.caseReminders(item)){
    if(reminder.ruleId&&!ids.has(reminder.ruleId)) fail(`Scenario links to a missing rule: ${item.slug} -> #rule-${reminder.ruleId}`);
  }
  if(!authority.verifiedAt(item.slug)) missingVerified+=1;
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

// 语料层门禁：所有对外链接必须在 corpus/ 登记，且不得指向已取代 / 已废止的法源。
const corpusPeek=await loadCorpus();
const peekIndex=urlIndex(corpusPeek);
const corpusReferences=[];
for(const item of cases){
  for(const source of item.sources||[]) { const id=peekIndex.get(String(source.href||'')); if(id) corpusReferences.push({from:`${item.slug}/*`,sourceId:id}); }
  for(const rule of authority.getRules(item.slug)||[]){
    for(const source of rule.sources||[]) { const id=peekIndex.get(String(source.href||'')); if(id) corpusReferences.push({from:`${item.slug}/${rule.id}`,sourceId:id}); }
  }
}
const corpusRun=await checkCorpus(corpusReferences);
for(const problem of corpusRun.problems.filter(p=>p.level==='error')) fail(`语料层：${problem.id} ${problem.message}`);
const corpusByUrl=urlIndex(corpusRun.corpus);
for(const item of cases){
  const links=[...(item.sources||[]).map(s=>({from:`${item.slug}/*`,...s}))];
  for(const rule of authority.getRules(item.slug)||[]){
    for(const source of rule.sources||[]) links.push({from:`${item.slug}/${rule.id}`,...source});
  }
  for(const link of links){
    const sourceId=corpusByUrl.get(String(link.href||''));
    if(!sourceId) fail(`链接未在 corpus/ 登记，先补记录再引用: ${link.from} -> ${link.href}`);
    const record=corpusRun.corpus.get(sourceId);
    if(record&&record.kind==='law'&&(record.status==='已取代'||record.status==='已废止')){
      fail(`引用了失效法源（${record.status}）: ${link.from} -> ${sourceId}，现行版本是 ${record.supersededBy||'见 note'}`);
    }
  }
}

// 编辑层不得手抄事实字段
const editorialRules=await readFile(new URL('../editorial/rules.js',import.meta.url),'utf8');
for(const fact of ['type','authority','effective','verified','href']){
  if(new RegExp(`^\\s*${fact}:`, 'm').test(editorialRules)) fail(`编辑层不得手抄事实字段（应由 corpus 提供）: ${fact}:`);
}
if(/sources:\s*\[/.test(editorialRules)) fail('编辑层必须用 sourceIds 引用 corpus，不得内联来源');

// legal-updates.js 是生成物：必须与 corpus + editorial 同步
const normalizeEol2=value=>value.replace(/\r\n/g,'\n');
const built=await buildAuthority();
if(normalizeEol2(await readFile(new URL('../legal-updates.js',import.meta.url),'utf8'))!==normalizeEol2(built)){
  fail('legal-updates.js 已过期；运行 node scripts/build-authority.mjs');
}

// CASE 编辑层 schema：结构问题一律 error。事实问题（sourceId 是否登记、是否指向失效法源）由上面的语料层门禁负责。
const raw=await loadRawCases();
for(const problem of validateCases(raw.cases,raw.stage)){
  const at=`CASE schema：${problem.id} ${problem.message}`;
  if(problem.level==='error') fail(at); else console.warn(`WARN ${at}`);
}

// 筛选维度靠语料层枚举精确映射；新增法源类型而忘了映射，会静默落进「其他」。
const unmapped=unmappedTypes();
if(unmapped.length) fail(`scripts/facets.mjs 缺少这些语料类型的筛选映射：${unmapped.join('、')}`);

const indexFile=new URL(`../${CONTENT_INDEX}`,import.meta.url);
if(normalizeEol(await readFile(indexFile,'utf8'))!==normalizeEol(await buildContentIndex())){
  fail(`${CONTENT_INDEX} is stale; run node scripts/build-content-index.mjs`);
}

const escapeAttr=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
const sampleCase=cases.find(item=>item.slug==='qingdao-travel')||cases[0];
const sampleOut=await readFile(path.join(out,'c',sampleCase.slug,'index.html'),'utf8');
for(const source of authority.allSources(sampleCase.slug)){
  if(!sampleOut.includes(`href="${escapeAttr(source.href)}"`)) fail(`Prerendered CASE cannot open an authority source: ${source.href}`);
}
if(!sampleOut.includes('最近核验 ')) fail('Prerendered CASE does not show the source verification date');

let reminderTotal=0;
let linkedTotal=0;
for(const item of cases){
  const reminders=caseRender.caseReminders(item);
  reminderTotal+=reminders.length;
  linkedTotal+=reminders.filter(entry=>entry.ruleId).length;
}

console.log(`Frontend contract OK: ${cases.length} topics, static case bodies, sitemap coverage, 404 shell.`);
console.log(`  authority rules ${cases.reduce((n,c)=>n+(authority.getRules(c.slug)||[]).length,0)} · scenario→rule links ${linkedTotal}/${reminderTotal} · ${cases.length - missingVerified}/${cases.length} topics carry a per-rule verified date`);
console.log(`  corpus ${corpusRun.stats.total} records (law ${corpusRun.stats.law} · case ${corpusRun.stats.case} · reference ${corpusRun.stats.reference} · portal ${corpusRun.stats.portal}) · 待核验 ${corpusRun.stats.pending} · needsReview ${corpusRun.stats.needsReview} · 零引用 ${corpusRun.stats.unreferenced}`);
