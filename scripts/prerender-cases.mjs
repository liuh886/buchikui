#!/usr/bin/env node
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFacets } from './facets.mjs';
import { loadCorpus, sourceTitle } from './lib/corpus.mjs';

export const SITE='https://liuh886.github.io/buchikui';
export const BASE_PATH=`${new URL(SITE).pathname.replace(/\/$/,'')}/`;
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const CASES_DIR='editorial/cases';

/** CASE 数据文件 = editorial/cases/ 下全部文件（一个 CASE 一个，文件名即 slug）+ 处境映射。
 *  加一个 CASE 就是加一个文件，不需要改任何清单。 */
export async function listDataFiles(){
  const dir=path.join(root,CASES_DIR);
  const files=(await readdir(dir)).filter(name=>name.endsWith('.js')).sort().map(name=>`${CASES_DIR}/${name}`);
  return [...files,'case-facets.js'];
}

/** @deprecated 同步读取会拿不到 glob 结果；请用 await listDataFiles() */
export const DATA_FILES=[];

const RENDER_FILES=['render-cases.js','legal-updates.js'];

/**
 * 在 vm 沙箱里跑 CASE 源文件，拿到它们挂到 window 上的数据。
 * 这是全项目唯一的加载入口：预渲染、bundle、契约检查、测试都走它，
 * 避免各处复制一份「读文件 + 建沙箱 + 取 window」的逻辑。
 */
export async function loadSandbox(files){
  const window={BUCHIKUI_CASES:[],addEventListener(){},removeEventListener(){}};
  const sandbox={window,console,URL,URLSearchParams};
  vm.createContext(sandbox);
  for(const file of files){
    const code=await readFile(path.join(root,file),'utf8');
    vm.runInContext(code,sandbox,{filename:file});
  }
  return window;
}

/** CASE 的 sources 只存 sourceId；名称与链接在这里由 corpus/ 解析。
 *  编辑层因此无法手写法源名，也不会与语料层漂移。 */
async function resolveSources(cases){
  const corpus=await loadCorpus();
  return cases.map(item=>({
    ...item,
    sources:(item.sources||[]).map(entry=>{
      const record=corpus.get(entry.sourceId);
      if(!record) throw new Error(`${item.slug}: sources 引用了不存在的 sourceId: ${entry.sourceId}`);
      return {title:sourceTitle(record),href:record.url,note:entry.note||''};
    })
  }));
}

/** 编辑层原始数据（sources 仍是 sourceId，未解析）。schema 校验用这个。 */
export async function loadRawCases(){
  const runtime=await loadSandbox(await listDataFiles());
  return {cases:runtime.BUCHIKUI_CASES,stage:runtime.BUCHIKUI_FACET_STAGE||{}};
}

export async function loadCases(){
  const runtime=await loadSandbox(await listDataFiles());
  return resolveSources(runtime.BUCHIKUI_CASES);
}

let runtimePromise=null;
export async function loadRuntime(){
  if(!runtimePromise) runtimePromise=(async()=>{
    const runtime=await loadSandbox([...(await listDataFiles()),...RENDER_FILES]);
    return {
      cases:await resolveSources(runtime.BUCHIKUI_CASES),
      render:runtime.BuchikuiRender,
      authority:runtime.BuchikuiAuthority,
      stage:runtime.BUCHIKUI_FACET_STAGE||{}
    };
  })();
  return runtimePromise;
}

const esc=value=>String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const plain=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();
const jsonLd=value=>JSON.stringify(value).replace(/</g,'\\u003c');

// 与 app.js 的 sanitizeRichHtml 同口径的静态序列化：只保留白名单标签，属性只放过安全 href，
// 其余标签连壳带内容一起丢弃（标签保留、属性全清），使预渲染正文与浏览器渲染一致。
const RICH_TAGS=new Set(['a','b','br','code','em','li','ol','p','small','span','strong','ul']);
const safeHref=value=>{
  const href=String(value||'').trim();
  if(!href) return '';
  if(href.startsWith('#')||href.startsWith('./')||href.startsWith('../')||(/^\/(?!\/)/).test(href)) return href;
  if(/^https?:\/\//i.test(href)) return href;
  return '';
};

export function richStatic(value){
  let html='';
  let cursor=0;
  const tokens=/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  let match;
  while((match=tokens.exec(String(value||'')))){
    html+=esc(String(value||'').slice(cursor,match.index));
    cursor=match.index+match[0].length;
    const tag=match[1].toLowerCase();
    const closing=match[0].startsWith('</');
    if(!RICH_TAGS.has(tag)) continue;
    if(closing){ html+=`</${tag}>`; continue; }
    if(tag==='br'){ html+='<br>'; continue; }
    const attrs=String(match[2]||'');
    if(tag==='a'){
      const href=safeHref((attrs.match(/href\s*=\s*("([^"]*)"|'([^']*)')/)||[]).slice(2).find(Boolean));
      html+=href?`<a href="${esc(href)}"${/^https?:\/\//i.test(href)?' target="_blank" rel="noopener"':''}>`:'<a>';
      continue;
    }
    if(tag==='span'&&/class\s*=\s*("|')key\1/.test(attrs)){ html+='<span class="key">'; continue; }
    html+=`<${tag}>`;
  }
  html+=esc(String(value||'').slice(cursor));
  return html;
}

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
      rich:richStatic,
      related:facets[item.slug]?.related||[],
      authoritySources:authority.allSources(item.slug),
      verified:authority.verifiedAt(item.slug),
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
