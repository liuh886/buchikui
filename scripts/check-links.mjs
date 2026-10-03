#!/usr/bin/env node
// 链接体检：把 corpus/ 里所有 url 跑一遍，坏链写进报告。
// 默认只报告；带 --open-issues 时输出可直接贴进 issue 的 Markdown。
// 网络请求有超时与并发上限，跑不动就跳过而不是把构建搞红。
import { writeFile } from 'node:fs/promises';
import { loadCorpus } from './lib/corpus.mjs';

const TIMEOUT_MS = 15000;
const CONCURRENCY = 6;
const argv = process.argv.slice(2);
const only = (argv.find(a => a.startsWith('--only=')) || '').replace('--only=', '');

const ALLOW_STATUS = new Set([200, 201, 202, 203, 204, 206, 301, 302, 303, 307, 308, 403, 405, 429]);

/**
 * 结果分三类，不能混：
 *   ok        —— 拿到了可接受的 HTTP 状态
 *   httpError —— 拿到了 HTTP 错误状态（404 / 500 …），这是真的坏链，要开 issue
 *   offline   —— 连不上、TLS 握手失败、超时。境外 runner 常见，**不代表链接坏了**，
 *                所以只统计不报issue，否则每天都是误报。
 */
async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const attempt = () => fetch(url, {
    redirect: 'follow',
    signal: controller.signal,
    headers: { 'user-agent': 'Buchikui link check (+https://github.com/liuh886/buchikui)', accept: 'text/html,*/*' }
  });
  try {
    let response = await attempt();
    // 部分站点对 HEAD 返回 405，回退 GET
    if (response.status === 405 || response.status === 501) response = await attempt();
    return { url, status: response.status, ok: ALLOW_STATUS.has(response.status), offline: false };
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timeout' : String(error.cause?.code || error.message).slice(0, 60);
    return { url, status: 0, ok: false, offline: true, error: reason };
  } finally {
    clearTimeout(timer);
  }
}

const corpus = await loadCorpus();
const all = [];
for (const record of corpus.values()) {
  if (record.id.startsWith('__')) continue;
  for (const url of [record.url, ...(record.aliasUrls || [])]) if (url) all.push({ id: record.id, url });
}
const targets = only ? all.filter(t => t.id.includes(only)) : all;
// 同一 url 只探一次
const unique = [...new Map(targets.map(t => [t.url, t])).values()];

const results = [];
for (let i = 0; i < unique.length; i += CONCURRENCY) {
  results.push(...await Promise.all(unique.slice(i, i + CONCURRENCY).map(t => probe(t.url))));
}

const broken = results.filter(r => !r.ok && !r.offline);
const offline = results.filter(r => r.offline);
console.log(`链接体检：${results.length} 个 url —— 可达 ${results.length - broken.length - offline.length}，HTTP 报错 ${broken.length}，连不上 ${offline.length}`);
if (broken.length) for (const b of broken) console.log(`  HTTP ${b.status}  ${b.url}`);
if (offline.length) console.log(`  （连不上 ${offline.length} 个，多为境外网络或 TLS 限制，不视为坏链：${offline.slice(0, 3).map(o => o.error).join('、')}…）`);

const issueArg = argv.find(a => a.startsWith('--issue-file='));
if (issueArg) {
  const file = issueArg.split('=').slice(1).join('=');
  if (broken.length) {
    const lines = [
      '链接体检发现打不开的来源。',
      '',
      `体检范围：${results.length} 个 url，异常 ${broken.length} 个。`,
      '',
      '| 语料记录 | 状态 | 链接 |',
      '| --- | --- | --- |'
    ];
    for (const b of broken) {
      const owner = unique.find(t => t.url === b.url);
      lines.push(`| \`${owner ? owner.id : '?'}\` | ${b.status || b.error} | ${b.url} |`);
    }
    lines.push(
      '',
      '处理方式，三选一：',
      '',
      '1. 找到新的官方链接，改记录里的 `url`（旧链接放进 `aliasUrls`）；',
      '2. 该版本已被取代：把 `status` 改成 `已取代` 并补 `supersededBy`；',
      '3. 这条来源不再需要：删除记录，并清理引用它的规则。',
      '',
      '**不要**把链接改成机构首页。契约脚本会拒绝裸域名。'
    );
    await writeFile(file, `${lines.join('\n')}\n`, 'utf8');
  } else {
    await writeFile(file, '', 'utf8');
  }
}

if (argv.includes('--open-issues') && broken.length) {
  console.log('\n（用 --issue-file=<路径> 输出可直接贴进 issue 的 Markdown）');
}

// 体检失败不阻断构建：网络问题不该让 CI 变红
process.exitCode = 0;