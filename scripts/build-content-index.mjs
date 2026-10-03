#!/usr/bin/env node
// 从 CASE 数据与权威依据层生成 docs/content-index.md（编辑目录）。
// 生成物由 scripts/check-frontend-contract.mjs 比对，改内容后运行本脚本。
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuntime } from './prerender-cases.mjs';
import { typeBuckets, TYPE_LABELS, TYPE_ORDER } from './facets.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CONTENT_INDEX = 'docs/content-index.md';

const plain = value => String(value || '').replace(/\s+/g, ' ').trim();

function typeList(rules) {
  const buckets = [];
  for (const rule of rules || []) {
    for (const key of typeBuckets(rule.type)) if (!buckets.includes(key)) buckets.push(key);
  }
  return TYPE_ORDER.filter(key => buckets.includes(key)).map(key => TYPE_LABELS[key]).join(' · ');
}

export async function buildContentIndex() {
  const { cases, authority, render } = await loadRuntime();
  const categories = render.CATEGORIES;

  const rows = cases.map(item => ({
    slug: item.slug,
    category: categories[item.slug] || '消费场景',
    question: plain(item.meta?.question || item.meta?.description),
    types: typeList(authority.getRules(item.slug)) || '其他',
    updated: item.updated || '持续更新'
  }));

  const order = [...new Set(rows.map(row => row.category))];
  const body = order.map(category => {
    const lines = rows
      .filter(row => row.category === category)
      .map(row => `| ${row.question} | \`${row.slug}\` | ${row.types} | ${row.updated} |`);
    return `## ${category}\n\n| 现实问题（一句话） | slug | 依据类型 | 最近更新 |\n| --- | --- | --- | --- |\n${lines.join('\n')}`;
  }).join('\n\n');

  return `# Buchikui — CASE 目录

> 状态：编辑目录（**生成文件**，不要手改）
> 生成：\`node scripts/build-content-index.mjs\`；\`node scripts/check-frontend-contract.mjs\` 会拦截漂移。
> 数据来源：\`editorial/cases/*.js\`（由 \`scripts/prerender-cases.mjs\` 的 \`listDataFiles()\` 自动发现）与 \`legal-updates.js\`。

共 ${rows.length} 个 CASE。「现实问题」取自各 CASE 的 \`meta.question\`，「依据类型」按 \`scripts/facets.mjs\`
的六档归并，「最近更新」取自 CASE 的 \`updated\`。分类沿用 \`render-cases.js\` 的 \`CATEGORIES\`。

${body}
`;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const target = path.resolve(process.argv[2] || root);
  const file = path.join(target, CONTENT_INDEX);
  await writeFile(file, await buildContentIndex(), 'utf8');
  console.log(`Wrote ${file}`);
}
