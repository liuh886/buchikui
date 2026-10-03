#!/usr/bin/env node
// 生成 legal-updates.js（浏览器载荷）= corpus 的事实 + editorial 的翻译。
//
//   corpus/law|cases|reference|portals.json  ──┐
//   editorial/rules.js        （翻译层）      ──┼──> legal-updates.js
//   editorial/authority-runtime.js（渲染层）   ──┘
//
// 事实字段（type / issuer / effective / verified / url / title）只在 corpus 里维护一次；
// 编辑层不允许写这些字段。改 corpus 或改翻译后运行本脚本。
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { loadCorpus, sourceTitle } from './lib/corpus.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEADER = '// 生成文件：请编辑 corpus/ 与 editorial/rules.js，再运行 node scripts/build-authority.mjs。';

const BATCH_VERIFIED = '2026-08-21';

/** 规则里的事实字段全部由 corpus 派生；这里只负责 join。 */
export function joinRule(rule, corpus, index = {}) {
  const sources = [];
  for (const id of rule.sourceIds || []) {
    const record = corpus.get(id);
    if (!record) throw new Error(`规则 ${rule.id} 引用了不存在的 sourceId: ${id}`);
    sources.push({
      title: sourceTitle(record),
      href: record.url,
      __record: record
    });
  }
  const records = sources.map(s => s.__record);

  // type：按 sourceIds 顺序取并集
  const types = [];
  for (const record of records) {
    const value = index.typeOf(record);
    for (const part of String(value || '').split('·').map(s => s.trim()).filter(Boolean)) {
      if (!types.includes(part)) types.push(part);
    }
  }

  // authority：机关并集
  const issuers = [];
  for (const record of records) {
    const value = record.issuer || record.court || record.publisher || record.operator || '';
    for (const part of String(value).split('·').map(s => s.trim()).filter(Boolean)) {
      if (!issuers.includes(part)) issuers.push(part);
    }
  }

  // effective：第一条能给出施行日期的、处于现行状态的来源
  const effective = records.find(r => r.status === '现行' && r.effective)?.effective
    || records.find(r => r.effective)?.effective
    || '';

  // verified：来源核验日期的最大值；没有则退回本批日期
  const dates = records.map(r => r.verified).filter(Boolean).sort();
  const verified = dates.length ? dates[dates.length - 1] : '';

  const out = { ...rule };
  delete out.sourceIds;
  if (types.length) out.type = types.join(' · ');
  if (issuers.length) out.authority = issuers.join(' · ');
  if (effective) out.effective = effective;
  if (verified) out.verified = verified;
  out.sources = sources.map(({ title, href }) => ({ title, href }));
  return out;
}

function makeIndex() {
  return {
    typeOf(record) {
      return record.kind === 'law' ? record.type || '' : record.kind === 'case' ? record.weight || '' : '';
    }
  };
}

export async function buildAuthority() {
  const corpus = await loadCorpus();
  const index = makeIndex();
  const runtime = await readFile(path.join(root, 'editorial', 'authority-runtime.js'), 'utf8');

  const sandbox = { window: { addEventListener() {}, removeEventListener() {} }, console };
  vm.createContext(sandbox);
  vm.runInContext(await readFile(path.join(root, 'editorial', 'rules.js'), 'utf8'), sandbox, { filename: 'editorial/rules.js' });
  const editorial = sandbox.window.BUCHIKUI_RULES || {};
  const batch = sandbox.window.BUCHIKUI_BATCH_VERIFIED || BATCH_VERIFIED;

  const updates = {};
  for (const [slug, item] of Object.entries(editorial)) {
    updates[slug] = {
      rules: (item.rules || []).map(rule => joinRule(rule, corpus, index))
    };
  }

  const body = `(function(){
  const VERIFIED='${batch}';
  const updates=${JSON.stringify(updates, null, 2).replace(/\n/g, '\n  ')};
${runtime}})();
`;
  // 生成即校验：语法错误当场失败，不让坏产物进仓库
  try {
    new Function(body);
  } catch (error) {
    throw new Error(`生成的 legal-updates.js 语法不合法: ${error.message}\n尾部: ${JSON.stringify(body.slice(-120))}`);
  }
  return `${HEADER}\n${body}`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const target = path.resolve(process.argv[2] || root);
  const file = path.join(target, 'legal-updates.js');
  await writeFile(file, await buildAuthority(), 'utf8');
  console.log(`Built ${file}`);
}