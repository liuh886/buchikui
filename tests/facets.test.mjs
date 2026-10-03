// 筛选维度：处境、法源类型、相关主题。
// 关键约束是 typeBuckets 必须靠语料层枚举精确映射，而不是正则猜措辞——
// 否则「部门规章」和「政策文件」会因为写法不同落进不同桶，筛选悄悄失真。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { typeBuckets, unmappedTypes, buildFacets, TYPE_ORDER } from '../scripts/facets.mjs';
import { LAW_TYPES, CASE_WEIGHTS } from '../scripts/lib/corpus.mjs';

test('语料层枚举全部有映射，不存在静默落入「其他」的类型', () => {
  assert.deepEqual(unmappedTypes(), [], '新增法源类型时必须同步 scripts/facets.mjs 的 TYPE_OF_LAW');
});

test('法源类型按枚举精确落到对应桶', () => {
  assert.deepEqual(typeBuckets('法律'), ['law']);
  assert.deepEqual(typeBuckets('行政法规'), ['regulation']);
  assert.deepEqual(typeBuckets('司法解释'), ['interpretation']);
  for (const type of ['部门规章', '规范性文件', '政策文件', '地方规章', '监管规范性文件']) {
    assert.deepEqual(typeBuckets(type), ['rule'], `${type} 应归入监管文件桶`);
  }
});

test('裁判权重归入案例桶', () => {
  for (const weight of CASE_WEIGHTS) assert.deepEqual(typeBuckets(weight), ['case'], `${weight} 应归入案例桶`);
});

test('复合 type 串按分隔符拆开后逐项映射', () => {
  assert.deepEqual(typeBuckets('法律 · 行政法规'), ['law', 'regulation']);
  assert.deepEqual(typeBuckets('法律、行政法规、部门规章'), ['law', 'regulation', 'rule']);
  assert.deepEqual(typeBuckets('典型案例 · 生效裁判'), ['case']);
  assert.deepEqual(typeBuckets('监管处罚案例 / 行政法规'), ['case', 'regulation']);
});

test('措辞相近但不在枚举里的值不会被误判', () => {
  // 旧实现用 /法律/ 之类正则，「法律新闻」会被算成法律。
  assert.deepEqual(typeBuckets('法律新闻'), ['other']);
  assert.deepEqual(typeBuckets('某个办法'), ['other']);
  // 部分可识别时不要额外塞一个「其他」，那会让筛选多出一个空维度
  assert.deepEqual(typeBuckets('法律 · 某个办法'), ['law']);
  assert.deepEqual(typeBuckets(''), ['other']);
  assert.deepEqual(typeBuckets(undefined), ['other']);
});

test('每个 CASE 都产出合法维度，且桶都在 TYPE_ORDER 内', () => {
  const cases = [
    { slug: 'a', name: '甲' },
    { slug: 'b', name: '乙' }
  ];
  const authority = {
    getRules: slug => (slug === 'a'
      ? [{ id: 'r1', type: '法律', sources: [{ href: 'https://x/1' }] }]
      : [{ id: 'r2', type: '部门规章', sources: [{ href: 'https://x/1' }] }])
  };
  const facets = buildFacets(cases, authority, { a: '消费场景', b: '消费场景' }, { a: ['pre'], b: ['dispute'] });

  assert.deepEqual(facets.a.types, ['law']);
  assert.deepEqual(facets.b.types, ['rule']);
  for (const slug of ['a', 'b']) {
    for (const key of facets[slug].types) assert.ok(TYPE_ORDER.includes(key), `${slug} 出现未知桶 ${key}`);
  }
});

test('缺处境映射时 stage 为空数组而不是 undefined', () => {
  const facets = buildFacets([{ slug: 'a', name: '甲' }], { getRules: () => [] }, {}, {});
  assert.deepEqual(facets.a.stage, []);
  assert.deepEqual(facets.a.types, []);
  assert.deepEqual(facets.a.related, []);
});

test('相关主题按共享依据排序，上限 3 条', () => {
  const cases = Array.from({ length: 6 }, (_, i) => ({ slug: `s${i}`, name: `主题${i}` }));
  const authority = {
    getRules: slug => {
      // s0 与 s1..s5 都共享同一个依据，s4 还额外共享第二个
      const n = Number(slug.slice(1));
      const hrefs = ['https://x/common'];
      if (n === 0 || n === 4) hrefs.push('https://x/extra');
      return [{ id: 'r', type: '法律', sources: hrefs.map(href => ({ href })) }];
    }
  };
  const facets = buildFacets(cases, authority, {}, {});
  const related = facets.s0.related.map(r => r.slug);
  assert.equal(related[0], 's4', '共享依据最多的应排第一');
  assert.equal(related.length, 3, 'related 上限为 3');
  assert.ok(!related.includes('s0'), '不应把自己算作相关主题');
});
