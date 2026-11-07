#!/usr/bin/env node
// 只同步全量巡检。gh 通过 GH_TOKEN 认证，所有参数直接传递，不经过 shell。
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LABEL = 'corpus-link-check';
const TITLE = '链接体检：语料层有来源打不开';
const runGh = args => execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

export async function syncLinkCheckIssue({ report, bodyFile, repository, runUrl, gh = runGh }) {
  if (report.only || !report.checked) return 'skipped';
  if (!report.broken.length && report.offline.length) return 'inconclusive';
  const pages = JSON.parse(await gh(['api', '--paginate', '--slurp', `repos/${repository}/issues?state=open&labels=${LABEL}&per_page=100`]));
  const issues = pages.flat().filter(issue => !issue.pull_request).sort((a, b) => a.number - b.number);
  if (report.broken.length) {
    if (issues.length) {
      await gh(['issue', 'edit', String(issues[0].number), '--repo', repository, '--title', TITLE, '--body-file', bodyFile]);
      // 保留一条持续更新的告警；只有更新成功后才关闭历史重复项。
      for (const issue of issues.slice(1)) await gh(['issue', 'close', String(issue.number), '--repo', repository, '--comment', `本次全量巡检已合并到 #${issues[0].number}。${runUrl || ''}`]);
      return 'updated';
    }
    await gh(['label', 'create', LABEL, '--repo', repository, '--color', 'B60205', '--description', '来源链接定期巡检', '--force']);
    await gh(['issue', 'create', '--repo', repository, '--title', TITLE, '--body-file', bodyFile, '--label', LABEL]);
    return 'created';
  }
  for (const issue of issues) {
    await gh(['issue', 'close', String(issue.number), '--repo', repository, '--comment', `本次全量巡检 ${report.checked} 个 URL，未发现 HTTP 错误或网络未知，关闭旧告警。${runUrl || ''}`]);
  }
  return issues.length ? 'closed' : 'clear';
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [reportFile, bodyFile] = process.argv.slice(2);
  if (!reportFile || !bodyFile || !process.env.GH_TOKEN || !process.env.GITHUB_REPOSITORY) {
    throw new Error('需要 report.json、report.md、GH_TOKEN 与 GITHUB_REPOSITORY。');
  }
  const report = JSON.parse(await readFile(reportFile, 'utf8'));
  const runUrl = `${process.env.GITHUB_SERVER_URL || 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
  console.log(`Link-check issue: ${await syncLinkCheckIssue({ report, bodyFile, repository: process.env.GITHUB_REPOSITORY, runUrl })}`);
}
