#!/usr/bin/env node
// HTTP 错误、网络未知分别报告；未知结果不当作坏链，也不当作已恢复。
import { appendFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCorpus } from './lib/corpus.mjs';

const TIMEOUT_MS = 15000;
const CONCURRENCY = 6;
const ALLOW_STATUS = new Set([200, 201, 202, 203, 204, 206, 301, 302, 303, 307, 308, 403, 405, 429]);

export async function probe(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Buchikui link check (+https://github.com/liuh886/buchikui)', accept: 'text/html,*/*' },
    });
    await response.body?.cancel();
    return { url, status: response.status, ok: ALLOW_STATUS.has(response.status), offline: false };
  } catch (error) {
    const reason = error.name === 'AbortError' ? 'timeout' : String(error.cause?.code || error.message).slice(0, 60);
    return { url, status: 0, ok: false, offline: true, error: reason };
  } finally {
    clearTimeout(timer);
  }
}

export async function checkLinks(corpus, { only = '', probeUrl = probe } = {}) {
  const targets = [];
  for (const record of corpus.values()) {
    if (record.id.startsWith('__') || (only && !record.id.includes(only))) continue;
    for (const url of [record.url, ...(record.aliasUrls || [])]) if (url) targets.push({ id: record.id, url });
  }
  const unique = [...new Map(targets.map(target => [target.url, target])).values()];
  const results = [];
  for (let i = 0; i < unique.length; i += CONCURRENCY) {
    results.push(...await Promise.all(unique.slice(i, i + CONCURRENCY).map(async target => ({ ...target, ...await probeUrl(target.url) }))));
  }
  const broken = results.filter(result => !result.ok && !result.offline);
  const offline = results.filter(result => result.offline);
  return {
    only,
    checked: results.length,
    acceptable: results.length - broken.length - offline.length,
    broken,
    offline,
  };
}

const cell = value => String(value).replace(/\|/g, '\\|').replace(/[\r\n]+/g, ' ');

export function reportMarkdown(report) {
  const lines = [
    '# 来源链接体检',
    '',
    `检查范围：${report.only ? `局部（ID 包含 ${cell(report.only)}）` : '全量'}。`,
    `共检查 ${report.checked} 个 URL：HTTP 状态可接受 ${report.acceptable}，确认 HTTP 错误 ${report.broken.length}，网络未知 ${report.offline.length}。`,
    '',
    'HTTP 状态可接受仅表示本次请求未发现确定错误；403 / 405 / 429 可能来自访问限制，不代表正文已经核验。',
  ];
  if (report.broken.length) {
    lines.push('', '## 确认 HTTP 错误', '', '| 语料记录 | 状态 | 链接 |', '| --- | --- | --- |');
    for (const result of report.broken) lines.push(`| \`${cell(result.id)}\` | ${result.status} | ${cell(result.url)} |`);
    lines.push('', '请核对原始来源，更新记录或标明替代关系；不要把文档链接改成机构首页。');
  }
  if (report.offline.length) {
    lines.push('', '## 网络未知，尚不能确认恢复', '', '超时、TLS 或网络限制不直接判为坏链；本次不会据此自动关闭旧告警。', '', '| 语料记录 | 原因 | 链接 |', '| --- | --- | --- |');
    for (const result of report.offline) lines.push(`| \`${cell(result.id)}\` | ${cell(result.error)} | ${cell(result.url)} |`);
  }
  if (!report.checked) lines.push('', '未匹配到 URL，本次不关闭旧告警。');
  else if (!report.broken.length && !report.offline.length) lines.push('', '本次检查未发现 HTTP 错误或网络未知。');
  if (report.only) lines.push('', '局部检查仅供定向核验，不覆盖全量告警状态。');
  return `${lines.join('\n')}\n`;
}

export async function writeReport(report, { issueFile, reportFile, githubOutput, summaryFile } = {}) {
  const markdown = reportMarkdown(report);
  if (issueFile) await writeFile(issueFile, markdown, 'utf8');
  if (reportFile) await writeFile(reportFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (githubOutput) await appendFile(githubOutput, `checked_count=${report.checked}\nbroken_count=${report.broken.length}\noffline_count=${report.offline.length}\nfull_scan=${!report.only}\n`, 'utf8');
  if (summaryFile) await appendFile(summaryFile, markdown, 'utf8');
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  const argument = name => argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const report = await checkLinks(await loadCorpus(), { only: argument('only') || '' });
  await writeReport(report, {
    issueFile: argument('issue-file'),
    reportFile: argument('report-file'),
    githubOutput: process.env.GITHUB_OUTPUT,
    summaryFile: process.env.GITHUB_STEP_SUMMARY,
  });
  console.log(reportMarkdown(report));
  // 网络状态通过报告与 issue 显示；脚本/API 本身出错仍使工作流失败。
}
