#!/usr/bin/env node
// 生成首页用的 cases-data.js。
//
// 这里**不能**拼接 editorial/cases/*.js 的源码。那些文件是 `push()` 片段，
// 依赖数组已存在——Node 沙箱里 loadSandbox 会初始化，浏览器里没人初始化，
// 结果 cases-data.js 抛错、app.js 的 Array.isArray 兜底成空数组，首页一片空白
// 而所有结构校验照样通过。
//
// 正确做法：序列化**已解析**的 CASE（来源已由 corpus/ 解析成 title/href），
// 用赋值而不是 push。顺带解决首页来源列表读到未解析 sourceId 的问题。
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuntime } from './prerender-cases.mjs';
import { buildFacets } from './facets.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const HEADER='// 生成文件：请编辑 editorial/cases/<slug>.js 与 editorial/rules.js，再运行 npm run build。';

export async function buildBundle(){
  const {cases,authority,render,stage}=await loadRuntime();
  const facets=buildFacets(cases,authority,render.CATEGORIES,stage);
  return [
    HEADER,
    `window.BUCHIKUI_CASES=${JSON.stringify(cases,null,2)};`,
    `window.BUCHIKUI_FACETS=${JSON.stringify(facets)};`
  ].join('\n')+'\n';
}

export const BUNDLE_FILE='cases-data.js';

const isMain=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isMain){
  const target=path.resolve(process.argv[2]||root);
  const {cases}=await loadRuntime();
  await writeFile(path.join(target,BUNDLE_FILE),await buildBundle(),'utf8');
  console.log(`Bundled ${cases.length} resolved CASE records into ${path.join(target,BUNDLE_FILE)}.`);
}
