import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checkLinks, reportMarkdown, writeReport } from '../scripts/check-links.mjs';
import { syncLinkCheckIssue } from '../scripts/sync-link-check-issue.mjs';

const result = (id, fields = {}) => ({ id, url: `https://example.invalid/${id}`, status: 404, ok: false, offline: false, ...fields });
const report = (fields = {}) => ({ only: '', checked: 129, acceptable: 95, broken: Array.from({ length: 5 }, (_, i) => result(`broken-${i}`)), offline: Array.from({ length: 29 }, (_, i) => result(`unknown-${i}`, { status: 0, offline: true, error: 'timeout' })), ...fields });
const syncOptions = { repository: 'owner/buchikui', bodyFile: '/temporary/links.md', runUrl: 'https://github.com/owner/buchikui/actions/runs/123' };
function fakeGh(pages = [[]], failCommand) {
  const calls = [];
  return {
    calls,
    async gh(args) {
      calls.push(args);
      if (args[0] === failCommand) throw new Error('GitHub API unavailable');
      return args[0] === 'api' ? JSON.stringify(pages) : '';
    },
  };
}

test('HTTP 错误和网络未知分别计数，同一 URL 只检查一次', async () => {
  const records = [
    { id: '__template', url: 'https://example.invalid/ignore' },
    { id: 'good', url: 'https://example.invalid/good', aliasUrls: ['https://example.invalid/good'] },
    { id: 'broken', url: 'https://example.invalid/broken' },
    { id: 'offline', url: 'https://example.invalid/offline' },
  ];
  const seen = [];
  const checked = await checkLinks(new Map(records.map(record => [record.id, record])), {
    probeUrl: async url => {
      seen.push(url);
      return url.endsWith('good') ? { status: 200, ok: true, offline: false } : url.endsWith('broken') ? { status: 404, ok: false, offline: false } : { status: 0, ok: false, offline: true, error: 'timeout' };
    },
  });
  assert.equal(seen.length, 3);
  assert.equal(checked.checked, 3);
  assert.equal(checked.acceptable, 1);
  assert.equal(checked.broken[0].id, 'broken');
  assert.equal(checked.offline[0].id, 'offline');
});

test('5 个 HTTP 错误和 29 个未知实际写入步骤输出和报告，未知不能称为全部可达', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'buchikui-link-test-'));
  try {
    const files = Object.fromEntries(['issueFile', 'reportFile', 'githubOutput', 'summaryFile'].map(name => [name, path.join(directory, name)]));
    await writeReport(report(), files);
    const outputs = await readFile(files.githubOutput, 'utf8');
    assert.match(outputs, /broken_count=5\noffline_count=29\nfull_scan=true/);
    assert.equal(JSON.parse(await readFile(files.reportFile, 'utf8')).broken.length, 5);
    const markdown = await readFile(files.issueFile, 'utf8');
    assert.match(markdown, /确认 HTTP 错误 5，网络未知 29/);
    assert.match(markdown, /尚不能确认恢复/);
    assert.ok(!markdown.includes('全部可达'));
    assert.equal(await readFile(files.summaryFile, 'utf8'), markdown);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('有确认 HTTP 错误即使同时存在网络未知，仍创建有标签的告警', async () => {
  const fake = fakeGh();
  assert.equal(await syncLinkCheckIssue({ ...syncOptions, report: report(), gh: fake.gh }), 'created');
  assert.deepEqual(fake.calls[0].slice(0, 3), ['api', '--paginate', '--slurp']);
  assert.equal(fake.calls.filter(args => args[0] === 'label').length, 1);
  const create = fake.calls.find(args => args[0] === 'issue' && args[1] === 'create');
  assert.ok(create.includes('--body-file'));
  assert.ok(create.includes('corpus-link-check'));
});

test('重复巡检更新现有 issue，分页结果中的重复告警在更新成功后合并', async () => {
  const fake = fakeGh([[{ number: 9 }, { number: 2, pull_request: {} }], [{ number: 5 }]]);
  assert.equal(await syncLinkCheckIssue({ ...syncOptions, report: report(), gh: fake.gh }), 'updated');
  assert.deepEqual(fake.calls[1].slice(0, 3), ['issue', 'edit', '5']);
  assert.deepEqual(fake.calls[2].slice(0, 3), ['issue', 'close', '9']);
  assert.ok(!fake.calls.some(args => args[1] === 'create'));
});

test('仅在全量、非空且零 HTTP 错误零未知时关闭旧告警', async () => {
  const fake = fakeGh([[{ number: 5 }]]);
  assert.equal(await syncLinkCheckIssue({ ...syncOptions, report: report({ acceptable: 129, broken: [], offline: [] }), gh: fake.gh }), 'closed');
  assert.deepEqual(fake.calls[1].slice(0, 3), ['issue', 'close', '5']);
  assert.ok(fake.calls[1].at(-1).includes('129 个 URL'));
  assert.ok(!fake.calls[1].at(-1).includes('全部可达'));
});

test('零 HTTP 错误但仍有 29 个未知时保留旧告警，局部和空扫描也不能关闭', async () => {
  for (const input of [report({ broken: [], acceptable: 100 }), report({ only: 'some-id', broken: [], offline: [] }), report({ checked: 0, broken: [], offline: [] })]) {
    const fake = fakeGh([[{ number: 5 }]]);
    await syncLinkCheckIssue({ ...syncOptions, report: input, gh: fake.gh });
    assert.deepEqual(fake.calls, []);
  }
  assert.match(reportMarkdown(report({ broken: [], acceptable: 100 })), /网络未知 29/);
});

test('GitHub 认证或 API 错误必须冒泡，不能伪装成空 issue 列表的成功', async () => {
  const fake = fakeGh([], 'api');
  await assert.rejects(syncLinkCheckIssue({ ...syncOptions, report: report(), gh: fake.gh }), /GitHub API unavailable/);
  assert.equal(fake.calls.length, 1);
});

test('更新正文失败时不关闭其余告警，保留已有问题记录', async () => {
  const fake = fakeGh([[{ number: 5 }, { number: 9 }]], 'issue');
  await assert.rejects(syncLinkCheckIssue({ ...syncOptions, report: report(), gh: fake.gh }), /GitHub API unavailable/);
  assert.ok(!fake.calls.some(args => args[1] === 'close'));
});
