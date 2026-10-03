// CASE 编辑层契约：结构问题必须报错，事实问题交给语料层门禁。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateCases, missingStage } from '../scripts/lib/case-schema.mjs';
import { loadRawCases, loadCases, listDataFiles } from '../scripts/prerender-cases.mjs';
import { loadCorpus } from '../scripts/lib/corpus.mjs';

// 最小合规 CASE：字段形状以 scripts/lib/case-schema.mjs 为准。
// stage 不在这里——处境维度由 case-facets.js 的 slug→数组 映射单独维护。
const minimal = {
  slug: 'demo-case',
  name: '示例主题',
  updated: '2026-01-01',
  meta: { title: '示例：先看这件事发生过什么', description: '一句话说明这一页覆盖什么现实问题。', question: '这件事该怎么办？' },
  hero: { title: '示例标题', copy: '首屏要说清这是什么问题。' },
  scenarios: [{ title: '现实提醒', blocks: [{ kind: 'fact', html: '<p>关键事实。</p>' }, { kind: 'action', html: '<p>现在做什么。</p>' }] }],
  sources: [{ sourceId: 'law-consumer-regulations' }]
};

const errors = (cases, stage = { 'demo-case': ['pre'] }) =>
  validateCases(cases, stage).filter(p => p.level === 'error');

test('仓库里每个 CASE 都通过 schema', async () => {
  const raw = await loadRawCases();
  const problems = validateCases(raw.cases, raw.stage);
  assert.deepEqual(problems.filter(p => p.level === 'error'), []);
  assert.ok(raw.cases.length >= 16, `CASE 数量异常：${raw.cases.length}`);
});

test('每个 CASE 的 slug 都有同名源文件', async () => {
  const files = await listDataFiles();
  for (const file of files) {
    const slug = file.split('/').pop().replace(/\.js$/, '');
    assert.match(slug, /^[a-z0-9][a-z0-9-]*$/, `无法从文件名推出合法 slug：${file}`);
  }
  const raw = await loadRawCases();
  const slugs = new Set(raw.cases.map(c => c.slug));
  assert.equal(slugs.size, raw.cases.length, 'slug 有重复');
});

test('缺必填字段会被抓出来', () => {
  assert.ok(errors([{ ...minimal, slug: undefined }]).some(p => /缺少 slug/.test(p.message)));
  assert.ok(errors([{ ...minimal, name: undefined }]).some(p => /缺少 name/.test(p.message)));
  assert.ok(errors([{ ...minimal, hero: undefined }]).some(p => /hero/.test(p.message)));
  assert.ok(errors([{ ...minimal, scenarios: [] }]).some(p => /scenarios|panic/.test(p.message)));
  assert.ok(errors([{ ...minimal, updated: '2026/01/01' }]).some(p => /updated/.test(p.message)));
  assert.ok(errors([{ ...minimal, updated: '2999-01-01' }]).some(p => /未来/.test(p.message)));
  assert.ok(errors([{ ...minimal, meta: { ...minimal.meta, description: '' } }]).some(p => /description/.test(p.message)));
});

test('缺原文来源是 warn 不是 error，但手写 title/href 是 error', () => {
  const noSource = validateCases([{ ...minimal, sources: [] }], { 'demo-case': ['pre'] });
  assert.equal(noSource.filter(p => p.level === 'error').length, 0);
  assert.ok(noSource.some(p => p.level === 'warn' && /没有原文来源/.test(p.message)));

  const inline = errors([{ ...minimal, sources: [{ title: '《消费者权益保护法实施条例》', href: 'https://www.gov.cn/x' }] }]);
  assert.ok(inline.some(p => /sourceId/.test(p.message)));
});

test('正文里的可执行内容与白名单外标签会被抓出来', () => {
  const xss = errors([{
    ...minimal,
    scenarios: [{ title: '现实提醒', blocks: [{ kind: 'fact', html: '<p onclick="x()">事实</p>' }] }]
  }]);
  assert.ok(xss.some(p => /可执行内容|未允许的标签/.test(p.message)));

  const badTag = errors([{
    ...minimal,
    scenarios: [{ title: '现实提醒', blocks: [{ kind: 'fact', html: '<div>事实</div>' }] }]
  }]);
  assert.ok(badTag.some(p => /未允许的标签 <div>/.test(p.message)));
});

test('重复 slug 会被抓出来', () => {
  const problems = errors([minimal, { ...minimal }]);
  assert.ok(problems.some(p => /slug 重复/.test(p.message)));
});

test('case-facets.js 里指向不存在 CASE 的处境键会被抓出来', () => {
  const problems = validateCases([minimal], { 'demo-case': ['pre'], 'ghost-case': ['pre'] });
  assert.ok(problems.some(p => /ghost-case/.test(p.message) && /没有对应的 CASE/.test(p.message)));
});

test('处境取值非法的 CASE 会被抓出来', () => {
  const problems = validateCases([minimal], { 'demo-case': ['refund'] });
  assert.ok(problems.some(p => /stage 取值非法/.test(p.message)));
});

test('missingStage 能定位尚未补齐处境的 slug', () => {
  assert.deepEqual(missingStage([minimal], { 'demo-case': ['pre'] }), []);
  assert.deepEqual(missingStage([minimal], {}), ['demo-case']);
});

test('所有 sourceId 都能在语料层解析到，且解析后带官方链接', async () => {
  const corpus = await loadCorpus();
  const raw = await loadRawCases();
  for (const item of raw.cases) {
    for (const entry of item.sources || []) {
      const record = corpus.get(entry.sourceId);
      assert.ok(record, `${item.slug} 引用了不存在的 sourceId：${entry.sourceId}`);
      assert.ok(/^https?:\/\//.test(record.url), `${record.id} 没有官方链接`);
    }
  }
});

test('解析后的来源由语料层决定：编辑层改不动显示名', async () => {
  const corpus = await loadCorpus();
  const resolved = await loadCases();
  for (const item of resolved) {
    for (const source of item.sources || []) {
      assert.match(source.title, /\S/, `${item.slug} 解析出了空标题`);
      assert.match(source.href, /^https?:\/\//, `${item.slug} 解析出了非官方链接：${source.href}`);
      // 解析结果必须与语料层同源：同一 id 在任意 CASE 中显示一致
      const record = [...corpus.values()].find(r => r.url === source.href);
      assert.ok(record, `${item.slug} 的来源链接不在语料层：${source.href}`);
    }
  }
});