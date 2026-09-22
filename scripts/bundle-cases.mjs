#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_FILES, loadRuntime } from './prerender-cases.mjs';
import { buildFacets } from './facets.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const HEADER='// 生成文件：请编辑各 CASE 源文件，再运行 node scripts/bundle-cases.mjs 重新拼接。';

export async function buildBundle(){
  const parts=[];
  for(const file of DATA_FILES){
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
  await writeFile(path.join(target,BUNDLE_FILE),await buildBundle(),'utf8');
  console.log(`Bundled ${DATA_FILES.length} CASE sources into ${path.join(target,BUNDLE_FILE)}.`);
}
