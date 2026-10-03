import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const CORPUS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'corpus');

export const LAW_TYPES = ['法律', '行政法规', '司法解释', '部门规章', '规范性文件', '政策文件', '地方规章', '监管规范性文件'];
export const CASE_WEIGHTS = ['指导性案例', '典型案例', '生效裁判', '监管处罚案例', '监管通报', '媒体披露'];
export const LAW_STATUS = ['现行', '即将生效', '已取代', '已废止', '待核验'];
export const SOCIAL_HOSTS = /weibo|weixin|xiaohongshu|zhihu|douban|reddit|tieba|telegram/i;

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const today = () => new Date().toISOString().slice(0, 10);

async function readDir(dir) {
  try {
    return (await readdir(dir)).filter(name => name.endsWith('.json'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

/** 语料层唯一入口：返回 id -> record 映射。 */
export async function loadCorpus() {
  const corpus = new Map();
  for (const kind of ['law', 'cases', 'reference']) {
    const dir = path.join(CORPUS_ROOT, kind === 'cases' ? 'cases' : kind);
    for (const name of await readDir(dir)) {
      const file = path.join(dir, name);
      let record;
      try {
        record = JSON.parse(await readFile(file, 'utf8'));
      } catch (error) {
        corpus.set(`__parse_error__${name}`, { id: name, kind, __parseError: error.message });
        continue;
      }
      const id = record.id || name;
      corpus.set(id, { ...record, id, __file: `corpus/${kind}/${name}` });
    }
  }
  try {
    const raw = JSON.parse(await readFile(path.join(CORPUS_ROOT, 'portals.json'), 'utf8'));
    for (const record of raw.portals || []) {
      corpus.set(record.id, { ...record, kind: 'portal', __file: 'corpus/portals.json' });
    }
  } catch (error) {
    if (error.code !== 'ENOENT') corpus.set('__parse_error__portals', { id: 'portals', __parseError: error.message });
  }
  return corpus;
}

function makeReporter(problems, record, pending) {
  const level = pending ? 'warn' : 'error';
  return message => problems.push({ level, id: record.id, message });
}

function checkUrl(problems, record, report) {
  let url;
  try {
    url = new URL(record.url);
  } catch {
    report(`url 不是合法 URL: ${record.url}`);
    return;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') report(`url 协议必须是 http(s): ${record.url}`);
  if (record.kind !== 'portal' && !url.pathname.replace(/\/+$/, '')) report(`url 指向裸域名，不是原文: ${record.url}`);
  if (SOCIAL_HOSTS.test(url.hostname) && record.kind !== 'reference') report(`法源不得指向社交平台: ${record.url}`);
}

function checkCommon(problems, record, report) {
  if (record.__parseError) { report(`JSON 解析失败: ${record.__parseError}`); return; }
  if (!record.id) report('缺少 id');
  // 只对「一部一文件」的记录校验 id==文件名；portals.json 是打包文件，不适用
  if (record.__file && record.__file.split('/').length === 3 && path.basename(record.__file, '.json') !== record.id) {
    report(`id 必须等于文件名: 文件 ${record.__file} / id ${record.id}`);
  }
  if (!record.title || !String(record.title).trim()) report('缺少 title');
  if (!DATE.test(String(record.verified || ''))) {
    // 待核验记录允许没有 verified：它表示「确实还没核对过」
    if (record.status === '待核验' || record.needsReview) report(`待核验：还没有 verified（当前 ${record.verified ?? '空'}）`);
    else report(`verified 必须是 YYYY-MM-DD: ${record.verified ?? '(空)'}`);
  } else if (record.verified > today()) report('verified 不能是未来日期');
  if (record.status === '待核验' && record.verified) report('待核验记录不应带 verified 日期');
  checkUrl(problems, record, report);
}

function checkLaw(problems, record, corpus, report) {
  if (!LAW_TYPES.includes(record.type)) report(`type 不在枚举内: ${record.type ?? '(空)'}`);
  if (!record.issuer) report('缺少 issuer（发布机关全称）');
  if (!LAW_STATUS.includes(record.status)) report(`status 不在枚举内: ${record.status ?? '(空)'}`);
  if (record.status === '现行' && !DATE.test(String(record.effective || ''))) report('status=现行 必须给 effective（施行日期）');
  if ((record.status === '已取代' || record.status === '已废止') && !record.supersededBy && !record.note) {
    report(`${record.status} 必须给 supersededBy，或在 note 里说明`);
  }
  for (const key of ['supersededBy', 'supersedes']) {
    for (const target of [].concat(record[key] || [])) {
      if (!corpus.has(target)) report(`${key} 指向不存在的记录: ${target}`);
    }
  }
  for (const article of record.articles || []) {
    if (!article.no || !article.topic) report('articles 每项需要 no 与 topic');
  }
}

function checkCase(problems, record, report) {
  if (!CASE_WEIGHTS.includes(record.weight)) report(`weight 不在枚举内: ${record.weight ?? '(空)'}`);
  if (!record.court && !record.issuer) report('缺少 court 或 issuer');
  if (!DATE.test(String(record.date || ''))) report(`date 必须是 YYYY-MM-DD: ${record.date ?? '(空)'}`);
  if (!record.holding || String(record.holding).trim().length < 4) report('缺少 holding（一句裁判要点）');
}

/**
 * 全量校验。
 *
 * 棘轮：`needsReview: true` 或 `status: 待核验` 的记录视为「已采集、未核验」，
 * 缺字段只警告；一旦人工补齐并删掉标记，同一处立刻变成错误。
 * 这样「核验」只能前进，不能后退。
 */
export function validateCorpus(corpus) {
  const problems = [];
  for (const record of corpus.values()) {
    // 棘轮：没有 verified 就等于还没核对过，无论 status 写的是什么
    const pending = record.needsReview === true || record.status === '待核验' || !record.verified;
    const report = makeReporter(problems, record, pending);
    checkCommon(problems, record, report);
    if (record.kind === 'law') checkLaw(problems, record, corpus, report);
    if (record.kind === 'case') checkCase(problems, record, report);
    if (record.kind === 'portal' && !record.operator) problems.push({ level: 'warn', id: record.id, message: 'portal 建议给 operator' });
    if (record.kind === 'reference' && !record.publisher) problems.push({ level: 'warn', id: record.id, message: 'reference 建议给 publisher' });
  }

  // 同一法源不得有多条「现行」记录
  const current = new Map();
  for (const record of corpus.values()) {
    if (record.kind !== 'law' || record.status !== '现行') continue;
    const key = `${record.issuer}|${record.title}`;
    if (current.has(key)) {
      problems.push({ level: 'error', id: record.id, message: `同一法源有多条现行记录: 与 ${current.get(key)} 重复` });
    } else {
      current.set(key, record.id);
    }
  }
  return problems;
}

/** 编辑层引用的 sourceId 是否存在、是否指向失效版本。 */
export function validateReferences(corpus, references) {
  const problems = [];
  for (const { from, sourceId } of references) {
    const record = corpus.get(sourceId);
    if (!record) {
      problems.push({ level: 'error', id: from, message: `引用了不存在的 sourceId: ${sourceId}` });
      continue;
    }
    if (record.kind === 'law' && (record.status === '已取代' || record.status === '已废止')) {
      problems.push({
        level: 'error',
        id: from,
        message: `引用了失效法源（${record.status}）: ${sourceId} → ${record.supersededBy || '见 note'}`
      });
    }
  }
  return problems;
}

/** url -> id（含 aliasUrls 里的等价官方链接），供迁移与引用检查使用。 */
export function urlIndex(corpus) {
  const index = new Map();
  for (const record of corpus.values()) {
    for (const url of [record.url, ...(record.aliasUrls || [])]) {
      if (url && !index.has(url)) index.set(url, record.id);
    }
  }
  return index;
}

// ── 显示口径 ────────────────────────────────────────────────────────────
// build-authority（权威层来源行）与 prerender 的 CASE 来源解析必须用同一套，
// 否则同一个法源在两处显示成两个名字。

/** 来源权重前缀：法源用法源类型，案例用 weight，入口与参考信息不假装有权重。 */
export function sourceLabel(record) {
  if (record.kind === 'law') return record.type || '';
  if (record.kind === 'case') return record.weight || '';
  return '';
}

/**
 * 读者可见的来源标题。
 * - 法源加书名号（这是法规的书写惯例）。
 * - 裁判、媒体报道、平台协议、办事入口不加书名号：给一个案件名或一则报道名套《》是错的。
 * - 权重未知时**不加前缀**，不编造「规则」这类标签。
 */
export function sourceTitle(record) {
  const title = String(record.title || '').trim();
  if (record.kind !== 'law') return title;
  const wrapped = /^[《（(]/.test(title) ? title : `《${title}》`;
  const label = sourceLabel(record);
  return label ? `【${label}】${wrapped}` : wrapped;
}

/** 引用计数：复利用的健康度。 */
export function referenceCounts(corpus, references) {
  const counts = new Map();
  for (const { sourceId } of references) counts.set(sourceId, (counts.get(sourceId) || 0) + 1);
  return [...corpus.values()]
    .filter(record => !record.id.startsWith('__'))
    .map(record => ({
      id: record.id,
      title: record.title,
      kind: record.kind,
      status: record.status || '',
      refs: counts.get(record.id) || 0
    }))
    .sort((a, b) => a.refs - b.refs || a.id.localeCompare(b.id));
}