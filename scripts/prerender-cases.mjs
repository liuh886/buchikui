#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE='https://liuh886.github.io/buchikui';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const DATA_FILES=[
  'cases.js','compact-cases.js','mobile-plan-case.js','court-case.js','investment-advisor-case.js',
  'bank-wealth-case.js','rental-payment-case.js','appliance-repair-case.js','airport-sales-case.js',
  'dating-safety-case.js','thailand-travel-safety-case.js','alibaba-auction-case.js','layoff-compensation-case.js',
  'qingdao-travel-case.js','transport-platform-case.js',
];

export async function loadCases(){
  const sandbox={window:{}};
  vm.createContext(sandbox);
  for(const file of DATA_FILES){
    const code=await readFile(path.join(root,file),'utf8');
    vm.runInContext(code,sandbox,{filename:file});
  }
  return sandbox.window.BUCHIKUI_CASES;
}

const escAttr=value=>String(value??'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

export async function prerender(outDir){
  const cases=await loadCases();
  const shell=await readFile(path.join(root,'index.html'),'utf8');
  const outputs=[];
  for(const item of cases){
    const canonical=`${SITE}/c/${item.slug}/`;
    const page=shell
      .replace(/<title>.*?<\/title>/,`<title>${escAttr(item.meta.title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/,`$1${escAttr(item.meta.description)}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/,`$1${escAttr(item.meta.ogTitle||item.meta.title)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/,`$1${escAttr(item.meta.ogDescription||item.meta.description)}$2`)
      .replace(/(<meta property="og:locale" content="zh_CN">)/,`$1\n  <link rel="canonical" href="${canonical}">\n  <meta property="og:url" content="${canonical}">`)
      .replace(/((?:src|href)=")(?!https?:|#|\/)([^"]+)"/g,'$1../../$2"');
    const dir=path.join(outDir,'c',item.slug);
    await mkdir(dir,{recursive:true});
    const file=path.join(dir,'index.html');
    await writeFile(file,page,'utf8');
    outputs.push({slug:item.slug,file});
  }
  return outputs;
}

const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  const outArg=process.argv[2];
  if(!outArg) throw new Error('Usage: node scripts/prerender-cases.mjs <output-directory>');
  const outputs=await prerender(path.resolve(outArg));
  console.log(`Prerendered ${outputs.length} CASE pages.`);
}
