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
import { loadCorpus, sourceTitle, sourceLabel, authoritySourceProblems } from './lib/corpus.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HEADER = '// 生成文件：请编辑 corpus/ 与 editorial/rules.js，再运行 node scripts/build-authority.mjs。';

const BATCH_VERIFIED = '2026-08-21';

/** 规则里的事实字段全部由 corpus 派生；这里只负责 join。 */
export function joinRule(rule, corpus, index = makeIndex(), at = new Date().toISOString().slice(0, 10)) {
  if (!['现行', '即将生效', '近期', '官方提醒'].includes(rule.status)) throw new Error(`规则 ${rule.id} 的公开状态无效: ${rule.status}`);
  if (rule.kind !== undefined && !['case', 'advisory'].includes(rule.kind)) throw new Error(`规则 ${rule.id} 的类型无效: ${rule.kind}`);
  if ((rule.status === '官方提醒') !== (rule.kind === 'advisory')) throw new Error(`规则 ${rule.id} 的官方提醒状态与类型不匹配`);
  if (rule.status === '近期' && rule.kind !== 'case') throw new Error(`规则 ${rule.id} 只有案例参考可标注近期`);
  if (rule.kind === 'case' && rule.status === '即将生效') throw new Error(`规则 ${rule.id} 的案例参考不能标为即将生效`);
  const sources = [];
  for (const id of rule.sourceIds || []) {
    const record = corpus.get(id);
    if (!record) throw new Error(`规则 ${rule.id} 引用了不存在的 sourceId: ${id}`);
    if (record.kind === 'law' && ['已取代', '已废止'].includes(record.status)) throw new Error(`规则 ${rule.id} 引用了失效法源: ${id}`);
    sources.push({
      title: sourceTitle(record),
      href: record.url,
      __record: record
    });
  }
  // 待核验背景可以继续在 CASE 原文里保存，但不能被包装成公开权威依据。
  const usable = sources.filter(source => {
    const record = source.__record;
    if (authoritySourceProblems(record, at).length) return false;
    if (rule.kind === 'advisory') return record.kind === 'reference' && record.authorityRole === 'official-advisory';
    if (record.kind === 'reference') return false;
    return rule.status === '即将生效'
      ? record.kind === 'law' && record.status === '即将生效'
      : record.kind !== 'law' || record.status === '现行';
  });
  if (!usable.length) {
    const reasons = sources.map(source => `${source.__record.id}: ${authoritySourceProblems(source.__record, at).join('、') || '效力状态不匹配'}`);
    throw new Error(`规则 ${rule.id} 没有合格的公开依据（${reasons.join('；') || '未提供 sourceIds'}）`);
  }
  const records = usable.map(s => s.__record);
  if (rule.kind === 'case' && !records.some(record => record.kind === 'case')) throw new Error(`规则 ${rule.id} 的裁判参考缺少合格案例来源`);

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

  // 最早的来源核验日代表整条依据的共同核验下限，不能用一条新日期遮住旧来源。
  const dates = records.map(r => r.verified).filter(Boolean).sort();
  const verified = dates[0];

  const out = { ...rule };
  delete out.sourceIds;
  for (const fact of ['type', 'authority', 'effective', 'issued', 'date', 'verified', 'sources']) delete out[fact];
  if (!out.kind && records.every(record => record.kind === 'case')) out.kind = 'case';
  if (types.length) out.type = types.join(' · ');
  if (issuers.length) out.authority = issuers.join(' · ');
  if (effective) out.effective = effective;
  else if (records[0].issued) out.issued = records[0].issued;
  else if (records[0].date) out.date = records[0].date;
  if (verified) out.verified = verified;
  out.sources = usable.map(({ title, href }) => ({ title, href }));
  return out;
}

function makeIndex() {
  return {
    typeOf(record) {
      return sourceLabel(record);
    }
  };
}

export async function loadEditorialRules() {
  const sandbox = {window:{}};
  vm.createContext(sandbox);
  vm.runInContext(await readFile(path.join(root,'editorial','rules.js'),'utf8'),sandbox);
  const editorial=sandbox.window.BUCHIKUI_RULES||{};
  const additions=JSON.parse(await readFile(path.join(root,'editorial','game-rules.json'),'utf8'));
  for(const {slug,rule} of additions){
    editorial[slug] ||= {rules:[]};
    if(editorial[slug].rules.some(item=>item.id===rule.id)) throw new Error(`重复规则 ${slug}/${rule.id}`);
    editorial[slug].rules.push(rule);
  }
  return {editorial,batch:sandbox.window.BUCHIKUI_BATCH_VERIFIED||BATCH_VERIFIED};
}

export async function buildAuthority() {
  const corpus = await loadCorpus();
  const index = makeIndex();
  const runtime = await readFile(path.join(root, 'editorial', 'authority-runtime.js'), 'utf8');

  const {editorial,batch}=await loadEditorialRules();

  const updates = {};
  const errors = [];
  for (const [slug, item] of Object.entries(editorial)) {
    updates[slug] = {
      rules: (item.rules || []).flatMap(rule => {
        try { return [joinRule(rule, corpus, index)]; }
        catch (error) { errors.push(`${slug}/${rule.id}: ${error.message}`); return []; }
      })
    };
  }
  if (errors.length) throw new Error(`公开依据准入失败：\n${errors.join('\n')}`);

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
