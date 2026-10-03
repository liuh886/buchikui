// 构建期派生 CASE 的筛选维度（处境、依据类型、相关主题），
// 由 scripts/bundle-cases.mjs 写入 cases-data.js，首页据此筛选，不加载 legal-updates.js。
import { LAW_TYPES, CASE_WEIGHTS } from './lib/corpus.mjs';

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

// 语料层的 type / weight 是受校验的枚举，所以按枚举精确映射，
// 不要用正则去猜「这条依据大概算什么类型」——那会让筛选维度随措辞漂移。
const TYPE_OF_LAW = {
  '法律': 'law',
  '行政法规': 'regulation',
  '司法解释': 'interpretation',
  '部门规章': 'rule',
  '规范性文件': 'rule',
  '政策文件': 'rule',
  '地方规章': 'rule',
  '监管规范性文件': 'rule'
};
const TYPE_OF_CASE = Object.fromEntries(CASE_WEIGHTS.map(weight => [weight, 'case']));

/**
 * 一条依据可能同时挂在多类来源上，rule.type 因此是复合串（如「法律 · 行政法规」）。
 * 拆开后逐项精确映射到枚举；全部不认识才落到「其他」。
 * 不用正则猜措辞，是为了让「部门规章」和「政策文件」稳定进同一个桶。
 */
export function typeBuckets(type) {
  const tokens = String(type || '').split(/[·、,，\/]/).map(t => t.trim()).filter(Boolean);
  const keys = [];
  for (const token of tokens) {
    const key = TYPE_OF_LAW[token] || TYPE_OF_CASE[token];
    if (key && !keys.includes(key)) keys.push(key);
  }
  return keys.length ? keys : ['other'];
}

/** 语料层枚举与这里的映射必须一一对应：漏掉的类型会被静默归到「其他」。 */
export function unmappedTypes() {
  return [...LAW_TYPES.filter(t => !TYPE_OF_LAW[t]), ...CASE_WEIGHTS.filter(w => !TYPE_OF_CASE[w])];
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
