// 构建期派生 CASE 的筛选维度（处境、依据类型、相关主题），
// 由 scripts/bundle-cases.mjs 写入 cases-data.js，首页据此筛选，不加载 legal-updates.js。

export const STAGE_ORDER = ['pre', 'during', 'dispute'];
export const STAGE_LABELS = {
  pre: '下单 / 付款前',
  during: '履约中',
  dispute: '已产生纠纷'
};

export const TYPE_ORDER = ['law', 'regulation', 'interpretation', 'rule', 'case', 'other'];
export const TYPE_LABELS = {
  law: '法律',
  regulation: '行政法规',
  interpretation: '司法解释',
  rule: '部门规章 / 监管文件',
  case: '典型案例 / 裁判',
  other: '其他'
};

const TYPE_MATCHERS = [
  ['law', /法律/],
  ['regulation', /行政法规/],
  ['interpretation', /司法解释/],
  ['rule', /部门规章|监管|规范|政策文件|规则|证监会|八部门|办法|价格/],
  ['case', /指导性案例|典型案例|生效裁判|裁判|案件|通报/]
];

export function typeBuckets(type) {
  const text = String(type || '').trim();
  const keys = TYPE_MATCHERS.filter(([, match]) => match.test(text)).map(([key]) => key);
  return keys.length ? keys : ['other'];
}

function sourcesOf(authority, slug) {
  const set = new Set();
  for (const rule of (authority && authority.getRules(slug)) || []) {
    for (const source of rule.sources || []) if (source && source.href) set.add(source.href);
  }
  return set;
}

export function buildFacets(cases, authority, categories, stageMap) {
  const list = Array.isArray(cases) ? cases : [];
  const facets = {};

  for (const item of list) {
    const types = [];
    for (const rule of (authority && authority.getRules(item.slug)) || []) {
      for (const key of typeBuckets(rule.type)) if (!types.includes(key)) types.push(key);
    }
    const stage = stageMap && Array.isArray(stageMap[item.slug]) ? stageMap[item.slug] : [];
    facets[item.slug] = {
      category: (categories && categories[item.slug]) || '消费场景',
      stage,
      types,
      related: []
    };
  }

  const nameOf = slug => (list.find(item => item.slug === slug) || {}).name || slug;
  const sourceSets = {};
  for (const item of list) sourceSets[item.slug] = sourcesOf(authority, item.slug);

  for (const item of list) {
    const own = sourceSets[item.slug];
    const category = facets[item.slug].category;
    const ranked = list
      .filter(other => other.slug !== item.slug)
      .map(other => {
        let shared = 0;
        for (const href of sourceSets[other.slug]) if (own.has(href)) shared += 1;
        const sameCategory = facets[other.slug].category === category ? 1 : 0;
        return { slug: other.slug, shared, sameCategory, score: shared * 2 + sameCategory };
      })
      .filter(entry => entry.shared > 0 || entry.sameCategory > 0)
      .sort((a, b) => b.score - a.score || String(a.slug).localeCompare(String(b.slug)))
      .slice(0, 3);
    facets[item.slug].related = ranked.map(entry => ({ slug: entry.slug, name: nameOf(entry.slug) }));
  }

  return facets;
}
