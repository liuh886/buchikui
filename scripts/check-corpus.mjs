#!/usr/bin/env node
// 语料层门禁：结构、必填字段、版本关系、引用完整性、引用计数与待核验数量。
// 被 check-frontend-contract.mjs 调用，也可单独运行。
import { loadCorpus, validateCorpus, validateReferences, referenceCounts } from './lib/corpus.mjs';
import { loadRawCases } from './prerender-cases.mjs';
import { loadEditorialRules } from './build-authority.mjs';

/**
 * 收集「谁引用了哪条语料」。走编辑层的 sourceId，而不是解析后的 href，
 * 所以统计口径与 CASE 实际引用一致，不受显示名变化影响。
 */
export async function collectReferences() {
  const [{cases},{editorial}]=await Promise.all([loadRawCases(),loadEditorialRules()]);
  const references = [];
  for (const item of cases) {
    for (const source of item.sources || []) {
      references.push({ from: `${item.slug}/*`, sourceId: source.sourceId });
    }
    for (const rule of editorial[item.slug]?.rules || []) {
      for (const sourceId of rule.sourceIds || []) {
        references.push({ from: `${item.slug}/${rule.id}`, sourceId });
      }
    }
  }
  return references;
}

export async function checkCorpus(references) {
  const corpus = await loadCorpus();
  // 单独运行时自己收集引用：曾经默认传 []，导致「零引用 134」这种
  // 把全部记录都算成孤儿的假数字。
  const refs = references || (await collectReferences());
  const problems = [...validateCorpus(corpus), ...validateReferences(corpus, refs)];
  const counts = referenceCounts(corpus, refs);
  const all = [...corpus.values()];
  const stats = {
    total: corpus.size,
    law: all.filter(r => r.kind === 'law').length,
    case: all.filter(r => r.kind === 'case').length,
    reference: all.filter(r => r.kind === 'reference').length,
    portal: all.filter(r => r.kind === 'portal').length,
    pending: all.filter(r => r.status === '待核验').length,
    needsReview: all.filter(r => r.needsReview).length,
    unreferenced: counts.filter(c => c.refs === 0).length,
    superseded: all.filter(r => r.status === '已取代' || r.status === '已废止').map(r => r.id)
  };
  return { corpus, problems, counts, stats };
}

const isMain = process.argv[1] && process.argv[1].endsWith('check-corpus.mjs');
if (isMain) {
  const { problems, stats, counts } = await checkCorpus();
  for (const p of problems.filter(p => p.level === 'error')) console.error(`ERROR [${p.id}] ${p.message}`);
  for (const p of problems.filter(p => p.level === 'warn')) console.warn(`WARN  [${p.id}] ${p.message}`);
  console.log(`corpus: ${stats.total} 条（law ${stats.law} / case ${stats.case} / reference ${stats.reference} / portal ${stats.portal}）`);
  console.log(`  待核验 ${stats.pending} · needsReview ${stats.needsReview} · 零引用 ${stats.unreferenced} · 已取代 ${stats.superseded.join(', ') || '无'}`);
  if (process.argv.includes('--orphans')) {
    console.log('\n零引用记录（采集沉没成本，可考虑删除）：');
    for (const c of counts.filter(x => x.refs === 0)) console.log(`  ${c.id}  ${c.title}`);
  }
  const errors = problems.filter(p => p.level === 'error').length;
  console.log(errors ? `\n${errors} 个错误` : '\ncorpus OK');
  if (errors) process.exitCode = 1;
}
