#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listDataFiles, loadRuntime } from './prerender-cases.mjs';
import { buildFacets } from './facets.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const HEADER='// 生成文件：请编辑 editorial/cases/<slug>.js 与 editorial/rules.js，再运行 npm run build。';

export async function buildBundle(){
  const parts=[];
  const dataFiles=await listDataFiles();
  for(const file of dataFiles){
    const code=(await readFile(path.join(root,file),'utf8')).replace(/\r\n/g,'\n').trimEnd();
    parts.push(code);
  }
  const {cases,authority,render,stage}=await loadRuntime();
  const facets=buildFacets(cases,authority,render.CATEGORIES,stage);
  parts.push(`window.BUCHIKUI_FACETS=${JSON.stringify(facets)};`);
  return `${HEADER}\n${parts.join('\n\n')}\n`;
}

export const BUNDLE_FILE='cases-data.js';

const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  const target=path.resolve(process.argv[2]||root);
  const dataFiles=await listDataFiles();
  await writeFile(path.join(target,BUNDLE_FILE),await buildBundle(),'utf8');
  console.log(`Bundled ${dataFiles.length} CASE sources into ${path.join(target,BUNDLE_FILE)}.`);
}
