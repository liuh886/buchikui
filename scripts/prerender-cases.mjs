#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFacets } from './facets.mjs';

export const SITE='https://liuh886.github.io/buchikui';
export const BASE_PATH=`${new URL(SITE).pathname.replace(/\/$/,'')}/`;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const DATA_FILES=[
  'cases.js','compact-cases.js','mobile-plan-case.js','court-case.js','investment-advisor-case.js',
  'bank-wealth-case.js','rental-payment-case.js','appliance-repair-case.js','airport-sales-case.js',
  'dating-safety-case.js','thailand-travel-safety-case.js','alibaba-auction-case.js','layoff-compensation-case.js',
  'qingdao-travel-case.js','transport-platform-case.js','case-facets.js',
];
const RENDER_FILES=['render-cases.js','legal-updates.js'];

async function loadSandbox(files){
  const window={addEventListener(){},removeEventListener(){}};
  const sandbox={window,console,URL,URLSearchParams};
  vm.createContext(sandbox);
  for(const file of files){
    const code=await readFile(path.join(root,file),'utf8');
    vm.runInContext(code,sandbox,{filename:file});
  }
  return window;
}

export async function loadCases(){
  const runtime=await loadSandbox(DATA_FILES);
  return runtime.BUCHIKUI_CASES;
}

export async function loadRuntime(){
  const runtime=await loadSandbox([...DATA_FILES,...RENDER_FILES]);
  return {
    cases:runtime.BUCHIKUI_CASES,
    render:runtime.BuchikuiRender,
    authority:runtime.BuchikuiAuthority,
    stage:runtime.BUCHIKUI_FACET_STAGE||{}
  };
}

const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const plain=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const jsonLd=value=>JSON.stringify(value).replace(/</g,'\\u003c');

function rewriteAssets(html,prefix){
  return html.replace(/((?:src|href)=")(?!https?:|#|\/)([^"]+)"/g,`$1${prefix}$2"`);
}

function staticHeader(base,name){
  return `<div class="shell header-inner"><a class="brand" href="${base}" aria-label="不吃亏首页">不吃亏</a><span class="header-note">${esc(name||'消费普法 · 只看关键依据')}</span></div>`;
}

function articleJsonLd(item,canonical){
  const citation=(item.sources||[]).map(source=>({
    '@type':'CreativeWork',
    name:plain(source.title),
    ...(source.href?{url:source.href}:{}),
  }));
  return {
    '@context':'https://schema.org',
    '@type':'Article',
    headline:plain(item.hero?.title||item.name),
    name:plain(item.name),
    description:plain(item.meta?.description||item.hero?.copy),
    inLanguage:'zh-CN',
    url:canonical,
    mainEntityOfPage:canonical,
    dateModified:item.updated||undefined,
    author:{'@type':'Organization',name:'不吃亏'},
    publisher:{'@type':'Organization',name:'不吃亏'},
    ...(citation.length?{citation}:{}),
  };
}

function replaceJsonLd(html,data){
  const block=data?`<script type="application/ld+json">\n${jsonLd(data)}\n  </script>`:'';
  return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\n?/,block);
}

export async function prerender(outDir){
  const {cases,render,authority,stage}=await loadRuntime();
  const facets=buildFacets(cases,authority,render.CATEGORIES,stage);
  const shell=await readFile(path.join(root,'index.html'),'utf8');
  const outputs=[];
  for(const item of cases){
    const canonical=`${SITE}/c/${item.slug}/`;
    const authorityHtml=authority.staticBlock(item.slug);
    const body=render.caseArticleHtml(item,{
      base:'../../',
      rich:value=>esc(plain(value)),
      related:facets[item.slug]?.related||[],
      authorityHtml:`<div id="rightsPulse">${authorityHtml}</div>`,
    });

    let page=shell
      .replace(/<title>.*?<\/title>/,`<title>${esc(item.meta.title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/,`$1${esc(item.meta.description)}$2`)
      .replace(/(<link rel="canonical" href=")[^"]*(")/,`$1${canonical}$2`)
      .replace(/(<meta property="og:type" content=")[^"]*(")/,`$1article$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/,`$1${esc(item.meta.ogTitle||item.meta.title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/,`$1${esc(item.meta.ogDescription||item.meta.description)}$2`)
      .replace(/(<meta property="og:url" content=")[^"]*(")/,`$1${canonical}$2`)
      .replace(/(<meta name="twitter:title" content=")[^"]*(")/,`$1${esc(item.meta.ogTitle||item.meta.title)}$2`)
      .replace(/(<meta name="twitter:description" content=")[^"]*(")/,`$1${esc(item.meta.ogDescription||item.meta.description)}$2`);

    page=replaceJsonLd(page,articleJsonLd(item,canonical));
    page=rewriteAssets(page,'../../');
    page=page
      .replace('<header class="site-header" id="siteHeader"></header>',`<header class="site-header" id="siteHeader">${staticHeader('../../',item.name)}</header>`)
      .replace('<main id="app" tabindex="-1"></main>',`<main id="app" tabindex="-1">${body}</main>`)
      .replace('<script defer src="../../app.js"></script>','<script defer src="../../legal-updates.js"></script>\n<script defer src="../../app.js"></script>');

    const dir=path.join(outDir,'c',item.slug);
    await mkdir(dir,{recursive:true});
    const file=path.join(dir,'index.html');
    await writeFile(file,page,'utf8');
    outputs.push({slug:item.slug,file});
  }
  return outputs;
}

export async function prerenderNotFound(outDir){
  const {render}=await loadRuntime();
  const shell=await readFile(path.join(root,'index.html'),'utf8');
  const body=render.missingHtml(BASE_PATH);
  let page=shell
    .replace(/<title>.*?<\/title>/,`<title>页面不存在｜不吃亏</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/,`$1没有找到这个页面，请回到全部消费主题。$2`)
    .replace(/\s*<link rel="canonical" href="[^"]*">/,'')
    .replace(/\s*<meta property="og:url" content="[^"]*">/,'');
  page=replaceJsonLd(page,null);
  page=page.replace(/(<meta name="application-name" content="不吃亏">)/,`$1\n  <meta name="robots" content="noindex,follow">`);
  page=rewriteAssets(page,BASE_PATH);
  page=page
    .replace('<body>','<body data-not-found="1">')
    .replace('<header class="site-header" id="siteHeader"></header>',`<header class="site-header" id="siteHeader">${staticHeader(BASE_PATH,'')}</header>`)
    .replace('<main id="app" tabindex="-1"></main>',`<main id="app" tabindex="-1">${body}</main>`);
  const file=path.join(outDir,'404.html');
  await writeFile(file,page,'utf8');
  return {file};
}

const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  const outArg=process.argv[2];
  if(!outArg) throw new Error('Usage: node scripts/prerender-cases.mjs <output-directory>');
  const outDir=path.resolve(outArg);
  const outputs=await prerender(outDir);
  await prerenderNotFound(outDir);
  await writeFile(path.join(outDir,'sitemap.xml'),await buildSitemap(),'utf8');
  console.log(`Prerendered ${outputs.length} CASE pages + 404 + sitemap.`);
}

export async function buildSitemap(){
  const {cases}=await loadRuntime();
  const urls=[`  <url><loc>${SITE}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`];
  for(const item of [...cases].sort((a,b)=>String(a.slug).localeCompare(String(b.slug)))){
    const lastmod=item.updated?`<lastmod>${item.updated}</lastmod>`:'';
    urls.push(`  <url><loc>${SITE}/c/${item.slug}/</loc>${lastmod}<changefreq>monthly</changefreq><priority>0.8</priority></url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
