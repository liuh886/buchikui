/**
 * CASE 编辑层 schema。
 *
 * 存在的理由：语料层有 JSON + 校验器，但 CASE 层一度是 15 个裸 JS 文件、
 * `window.BUCHIKUI_CASES.push()` 全局累积，字段写错只能在渲染时发现。
 * 这里给 CASE 一份和 corpus 同等级的契约。
 *
 * 原则：结构问题一律 error（编辑层没有「待核验」这种状态）；
 * 事实问题（引用是否登记、是否指向失效法源）交给 check-corpus 与主契约。
 */

const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const STAGES = new Set(['pre', 'during', 'dispute']);

const err = (list, slug, message) => list.push({ level: 'error', id: slug, message });
const warn = (list, slug, message) => list.push({ level: 'warn', id: slug, message });

function checkMeta(list, item) {
  const meta = item.meta || {};
  for (const key of ['title', 'description', 'question']) {
    if (!meta[key] || !String(meta[key]).trim()) err(list, item.slug, `meta.${key} 必填（description 用于 SEO，question 用于生成 docs/content-index.md）`);
  }
  if (meta.title && meta.title.length > 40) warn(list, item.slug, `meta.title ${meta.title.length} 字，过长会在搜索结果里被截断`);
}

function checkHero(list, item) {
  if (!item.hero || !item.hero.title) err(list, item.slug, 'hero.title 必填：CASE 首屏要能看出这是什么问题');
  if (!item.hero || !item.hero.copy) err(list, item.slug, 'hero.copy 必填');
}

function checkScenarios(list, item) {
  const hasScenarios = Array.isArray(item.scenarios) && item.scenarios.length > 0;
  const hasPanicItems = Array.isArray(item.panic?.items) && item.panic.items.length > 0;
  if (!hasScenarios && !hasPanicItems) err(list, item.slug, '必须至少有 scenarios 或 panic.items 之一（现实交易提醒不能为空）');
  if (hasScenarios && hasPanicItems) {
    warn(list, item.slug, '同时存在 scenarios 与 panic.items；有 scenarios 时 panic.items 不参与渲染，应删掉避免误解');
  }
  const reminders = hasScenarios
    ? item.scenarios
    : (item.panic?.items || []).map(entry => ({ ...entry, blocks: [{ kind: 'action', html: entry.text || '' }] }));

  for (const [index, entry] of reminders.entries()) {
    const at = `第 ${index + 1} 条现实提醒`;
    if (!entry.title) err(list, item.slug, `${at}缺少 title`);
    const blocks = entry.blocks || [];
    if (!blocks.length && !entry.text) err(list, item.slug, `${at}（${entry.title || '未命名'}）没有正文`);
    const facts = blocks.filter(b => b.kind !== 'action');
    const actions = blocks.filter(b => b.kind === 'action');
    if (blocks.length > 1 && !facts.length) err(list, item.slug, `${at}缺少「关键事实」段`);
    if (blocks.length > 1 && !actions.length) err(list, item.slug, `${at}缺少「现在做什么」段`);
    for (const block of blocks) {
      if (!block.html || !String(block.html).trim()) err(list, item.slug, `${at}的 block.html 为空`);
      const open = (String(block.html).match(/<([a-zA-Z][a-zA-Z0-9]*)/g) || []).map(t => t.slice(1).toLowerCase());
      const allowed = new Set(['p', 'b', 'br', 'strong', 'em', 'code', 'small', 'span', 'a', 'ul', 'ol', 'li']);
      for (const tag of open) {
        if (!allowed.has(tag)) err(list, item.slug, `${at}使用了未允许的标签 <${tag}>；白名单见 app.js 的 sanitizeRichHtml`);
      }
      if (/<script|<iframe|on\w+\s*=/i.test(String(block.html))) err(list, item.slug, `${at}的正文含可执行内容`);
    }
  }
}

function checkSources(list, item) {
  const sources = item.sources || [];
  if (!sources.length) warn(list, item.slug, '没有原文来源：一手来源是本项目的核心承诺');
  const seen = new Set();
  for (const [index, source] of sources.entries()) {
    const at = `第 ${index + 1} 条原文`;
    if (!source.sourceId) {
      err(list, item.slug, `${at}必须写 sourceId（指向 corpus/），不得内联 title 与 href`);
      continue;
    }
    if (source.href || source.title) err(list, item.slug, `${at}不得内联 href/title：法源名称与链接只在 corpus/ 维护`);
    if (seen.has(source.sourceId)) warn(list, item.slug, `${at}与前面重复：${source.sourceId}`);
    seen.add(source.sourceId);
  }
}

function checkStage(list, item, stage) {
  if (!Array.isArray(stage[item.slug])) {
    err(list, item.slug, `case-facets.js 缺少该 slug 的处境（stage）映射，筛选会静默失效`);
    return;
  }
  const value = stage[item.slug];
  if (!value.length) err(list, item.slug, 'stage 必须是非空数组');
  for (const entry of value) {
    if (!STAGES.has(entry)) err(list, item.slug, `stage 取值非法: ${entry}（允许 pre / during / dispute）`);
  }
}

/**
 * 校验全部 CASE。返回 [{level, id, message}]。
 * 传入 stage 映射可一并校验处境维度（case-facets.js 目前还是手写的）。
 */
export function validateCases(cases, stage = {}) {
  const problems = [];
  const slugs = new Set();
  const ids = new Set();

  for (const item of cases) {
    const slug = item && item.slug;
    if (!slug) { err(problems, '(未知)', '缺少 slug'); continue; }
    if (!SLUG.test(slug)) err(problems, slug, `slug 只能是小写字母、数字与连字符: ${slug}`);
    if (slugs.has(slug)) err(problems, slug, 'slug 重复');
    slugs.add(slug);

    if (!item.name) err(problems, slug, '缺少 name（主题名，导航与列表用）');
    if (item.id) {
      if (ids.has(item.id)) err(problems, slug, `内部 id 重复: ${item.id}`);
      ids.add(item.id);
    } else {
      warn(problems, slug, '缺少内部 id（仅用于历史追溯，可留空）');
    }
    if (!DATE.test(String(item.updated || ''))) err(problems, slug, `updated 必须是 YYYY-MM-DD: ${item.updated ?? '(空)'}`);
    else if (item.updated > new Date().toISOString().slice(0, 10)) err(problems, slug, 'updated 不能是未来日期');

    checkMeta(problems, item);
    checkHero(problems, item);
    checkScenarios(problems, item);
    checkSources(problems, item);
    checkStage(problems, item, stage);

    if (!item.takeaway) warn(problems, slug, '缺少 takeaway（一句可迁移经验）');
    if (!item.legal) warn(problems, slug, '缺少 legal 免责声明');
    if (item.category) warn(problems, slug, 'category 应只在 render-cases.js 的 CATEGORIES 里维护，不要写在数据里');
  }

  // 处境映射里不能有指向不存在 CASE 的键
  for (const key of Object.keys(stage)) {
    if (!slugs.has(key)) err(problems, key, `case-facets.js 里的 ${key} 没有对应的 CASE`);
  }

  return problems;
}

/** 哪些 slug 还没有处境映射（供分步补齐时使用） */
export function missingStage(cases, stage = {}) {
  return cases.filter(item => !Array.isArray(stage[item.slug]) || !stage[item.slug].length).map(item => item.slug);
}