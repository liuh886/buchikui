import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { challengeSourceProblems, challengeSourceLabel, sourceTitle } from './corpus.mjs';
import { portraitAssetPathSync } from './portrait-content.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const digest = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

export const CHALLENGE_STATES = ['draft', 'fact-reviewed', 'playtested', 'approved', 'blocked', 'retired'];
export const LEVEL_ROLES = ['warmup', 'spot-trap', 'positive-surprise', 'hard', 'boss'];
export const ANSWER_TYPES = ['已核验违法', '有风险应谨慎', '不适配该目标', '可证实性价比优势'];
export const PACK_STATES = ['draft', 'preview', 'approved', 'retired'];

export async function loadChallengeSeed(root = ROOT) {
  const challengeDir = path.join(root, 'editorial', 'challenges');
  let files = [];
  try {
    files = (await readdir(challengeDir)).filter(name => name.endsWith('.json')).sort();
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const challenges = [];
  for (const name of files) {
    const raw = JSON.parse(await readFile(path.join(challengeDir, name), 'utf8'));
    if (raw?.schema !== 1 || !Array.isArray(raw.challenges)) {
      throw new Error(`关卡文件格式无效：editorial/challenges/${name}`);
    }
    challenges.push(...raw.challenges);
  }

  const packsPath = path.join(root, 'editorial', 'daily-packs', 'packs.json');
  let packsConfig = { schema: 1, defaultPackId: '', schedule: [], packs: [] };
  try {
    packsConfig = JSON.parse(await readFile(packsPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return { challenges, packsConfig };
}

export function validateChallengeRecord(c, { corpus, topics, ruleMap, companions }) {
  if (!c || !nonempty(c.id)) throw new Error('关卡缺少 id');
  if (!nonempty(c.version)) throw new Error(`${c.id}: 缺少 version`);
  if (!CHALLENGE_STATES.includes(c.state)) throw new Error(`${c.id}: state 无效 (${c.state})`);
  if (!LEVEL_ROLES.includes(c.levelRole)) throw new Error(`${c.id}: levelRole 无效 (${c.levelRole})`);
  if (!nonempty(c.roleLabel)) throw new Error(`${c.id}: 缺少 roleLabel`);
  if (!nonempty(c.caseSlug) || !topics.has(c.caseSlug)) throw new Error(`${c.id}: caseSlug 无效 (${c.caseSlug})`);
  if (c.ruleId) {
    const rule = ruleMap.get(`${c.caseSlug}/${c.ruleId}`);
    if (!rule) throw new Error(`${c.id}: 关联规则不存在 (${c.caseSlug}/${c.ruleId})`);
  }
  if (!companions.has(c.companionId)) throw new Error(`${c.id}: companionId 无效 (${c.companionId})`);
  if (!['yes', 'no'].includes(c.answer)) throw new Error(`${c.id}: answer 必须是 yes 或 no`);
  if (!ANSWER_TYPES.includes(c.answerType)) throw new Error(`${c.id}: answerType 无效 (${c.answerType})`);

  if (!nonempty(c.prompt)) throw new Error(`${c.id}: 缺少 prompt`);
  if (/^你是否遭遇过：/.test(c.prompt.trim())) throw new Error(`${c.id}: 游戏关卡不得使用旧问卷“你是否遭遇过：”句式`);
  if (!nonempty(c.goal)) throw new Error(`${c.id}: 缺少明确的消费者目标 goal`);
  if (!c.productSnapshot || !nonempty(c.productSnapshot.title) || !nonempty(c.productSnapshot.priceOrCondition) || !Array.isArray(c.productSnapshot.details) || !c.productSnapshot.details.length) {
    throw new Error(`${c.id}: productSnapshot 不完整`);
  }
  if (!Array.isArray(c.observableClues) || !c.observableClues.length || c.observableClues.some(item => !nonempty(item))) {
    throw new Error(`${c.id}: 必须至少包含一条购买前可观察线索 observableClues`);
  }
  if (!c.offer || !nonempty(c.offer.yesLabel) || !nonempty(c.offer.noLabel)) {
    throw new Error(`${c.id}: offer.yesLabel / offer.noLabel 不完整`);
  }
  if (!c.revealSteps || !nonempty(c.revealSteps.twist) || !nonempty(c.revealSteps.factDetail) || !nonempty(c.revealSteps.scope)) {
    throw new Error(`${c.id}: revealSteps（twist/factDetail/scope）不完整`);
  }
  if (!nonempty(c.nextTimeSignal)) throw new Error(`${c.id}: 缺少 nextTimeSignal`);
  if (!Array.isArray(c.sourceIds) || !c.sourceIds.length) throw new Error(`${c.id}: 缺少 sourceIds`);

  for (const sourceId of c.sourceIds) {
    if (!corpus.has(sourceId)) throw new Error(`${c.id}: 引用了不存在的 sourceId (${sourceId})`);
  }

  if (c.state === 'approved') {
    if (!nonempty(c.counterfactual)) throw new Error(`${c.id}: 已批准关卡必须提供反方检验 counterfactual`);
    if (!c.evidence || !nonempty(c.evidence.locator) || !DATE.test(String(c.evidence.verifiedAt || ''))) {
      throw new Error(`${c.id}: 已批准关卡缺少 evidence.locator 或 verifiedAt`);
    }
    if (!c.review || !nonempty(c.review.reviewer) || !DATE.test(String(c.review.reviewedAt || '')) || !nonempty(c.review.blindTestNote)) {
      throw new Error(`${c.id}: 已批准关卡缺少独立审核或盲测记录`);
    }
    for (const sourceId of c.sourceIds) {
      const record = corpus.get(sourceId);
      const problems = challengeSourceProblems(record);
      if (problems.length) {
        throw new Error(`${c.id}: 来源 ${sourceId} 未通过核验准入 (${problems.join('；')})`);
      }
      if (record.kind === 'case' && (!nonempty(record.facts) || !nonempty(record.boundary))) {
        throw new Error(`${c.id}: 案例来源 ${sourceId} 缺少 facts 或 boundary`);
      }
    }
    if (c.answer === 'yes' && c.answerType !== '可证实性价比优势') {
      throw new Error(`${c.id}: 正向 YES 关的 answerType 必须是“可证实性价比优势”`);
    }
  }
}

export function validateDailyPacks(packsConfig, challengeMap, companions) {
  if (!packsConfig || packsConfig.schema !== 1 || !Array.isArray(packsConfig.packs)) {
    throw new Error('daily-packs/packs.json 结构无效');
  }
  const seen = new Set();
  for (const pack of packsConfig.packs) {
    if (!pack || !nonempty(pack.id) || seen.has(pack.id)) throw new Error(`题包 id 无效或重复：${pack?.id}`);
    seen.add(pack.id);
    if (!PACK_STATES.includes(pack.state)) throw new Error(`${pack.id}: 题包 state 无效`);
    if (!DATE.test(String(pack.publishedDate || ''))) throw new Error(`${pack.id}: publishedDate 无效`);
    if (!nonempty(pack.title) || !nonempty(pack.subtitle) || !nonempty(pack.shareHook)) {
      throw new Error(`${pack.id}: title/subtitle/shareHook 不完整`);
    }
    if (!companions.has(pack.companionId)) throw new Error(`${pack.id}: companionId 无效`);
    if (!Array.isArray(pack.challengeIds) || pack.challengeIds.length !== 5 || new Set(pack.challengeIds).size !== 5) {
      throw new Error(`${pack.id}: 每日挑战必须严格包含 5 个不重复关卡`);
    }
    const items = pack.challengeIds.map(id => {
      const c = challengeMap.get(id);
      if (!c) throw new Error(`${pack.id}: 引用了不存在的关卡 ${id}`);
      return c;
    });
    if (pack.state === 'approved') {
      const notApproved = items.filter(c => c.state !== 'approved');
      if (notApproved.length) {
        throw new Error(`${pack.id}: 已批准题包不能包含未批准或阻塞关卡 (${notApproved.map(c => `${c.id}:${c.state}`).join(', ')})`);
      }
      const yesCount = items.filter(c => c.answer === 'yes').length;
      const noCount = items.filter(c => c.answer === 'no').length;
      if (yesCount < 1 || noCount < 1) {
        throw new Error(`${pack.id}: 已批准题包必须同时包含正向 YES 与反向 NO 关卡`);
      }
    }
  }
  if (packsConfig.packs.length) {
    const def = packsConfig.packs.find(p => p.id === packsConfig.defaultPackId);
    if (!def) throw new Error(`defaultPackId 指向不存在的题包：${packsConfig.defaultPackId}`);
    if (def.state !== 'approved') throw new Error(`默认题包 ${def.id} 必须为 approved 状态`);
  }
  for (const item of packsConfig.schedule || []) {
    if (!DATE.test(String(item?.date || '')) || !seen.has(item?.packId)) {
      throw new Error(`排期配置无效：${JSON.stringify(item)}`);
    }
  }
}

export function packRevision(pack, challenges) {
  return digest([
    pack.id,
    pack.publishedDate,
    pack.shareHook,
    challenges.map(c => [c.id, c.version, c.answer, c.prompt, c.goal, c.offer, c.revealSteps, c.nextTimeSignal, c.sourceIds])
  ]).slice(0, 20);
}

export function populateChallengeTables(db, seed, { corpus, topics, ruleMap, companions }) {
  const challengeMap = new Map();
  const insertChallenge = db.prepare('INSERT INTO challenges VALUES (?,?,?,?,?,?,?,?)');
  const insertSourceLink = db.prepare('INSERT INTO challenge_sources VALUES (?,?,?)');

  for (const c of seed.challenges || []) {
    if (challengeMap.has(c.id)) throw new Error(`关卡重复 id：${c.id}`);
    validateChallengeRecord(c, { corpus, topics, ruleMap, companions });
    challengeMap.set(c.id, c);
    insertChallenge.run(c.id, c.version, c.state, c.levelRole, c.caseSlug, c.ruleId || null, c.answer, JSON.stringify(c));
    c.sourceIds.forEach((sourceId, position) => {
      insertSourceLink.run(c.id, sourceId, position);
    });
  }

  const packsConfig = seed.packsConfig || { schema: 1, defaultPackId: '', schedule: [], packs: [] };
  validateDailyPacks(packsConfig, challengeMap, companions);

  const insertPack = db.prepare('INSERT INTO daily_packs VALUES (?,?,?, ?,?)');
  const insertPackChallenge = db.prepare('INSERT INTO daily_pack_challenges VALUES (?,?,?)');
  for (const pack of packsConfig.packs || []) {
    const items = pack.challengeIds.map(id => challengeMap.get(id));
    const rev = packRevision(pack, items);
    insertPack.run(pack.id, pack.publishedDate, pack.state, rev, JSON.stringify(pack));
    pack.challengeIds.forEach((cid, position) => {
      insertPackChallenge.run(pack.id, cid, position);
    });
  }

  return { packsConfig };
}

export function publicDailyContent(db, packsConfig, portraitConfig, resolveAsset = portraitAssetPathSync) {
  const sourceRows = new Map(
    db.prepare('SELECT id,payload FROM sources').all().map(row => [row.id, JSON.parse(row.payload)])
  );
  const topicRows = new Map(
    db.prepare('SELECT slug,title FROM topics').all().map(row => [row.slug, row.title])
  );
  const companions = {};
  for (const role of portraitConfig?.portraits || []) {
    companions[role.id] = {
      id: role.id,
      name: role.name,
      description: role.description,
      alt: role.alt,
      image: resolveAsset(role.image, false),
      thumbnail: resolveAsset(role.thumbnail, true)
    };
  }

  const packRows = db.prepare("SELECT id,revision,payload FROM daily_packs WHERE state IN ('approved','retired') ORDER BY published_date DESC, id").all();
  const packs = [];

  for (const row of packRows) {
    const pack = JSON.parse(row.payload);
    const levelRows = db.prepare(`
      SELECT c.payload
      FROM daily_pack_challenges dpc
      JOIN challenges c ON c.id = dpc.challenge_id
      WHERE dpc.pack_id = ?
      ORDER BY dpc.position
    `).all(pack.id);

    const levels = levelRows.map(levelRow => {
      const c = JSON.parse(levelRow.payload);
      const sources = [];
      let sourceInvalid = c.state === 'retired';
      for (const sid of c.sourceIds) {
        const record = sourceRows.get(sid);
        if (!record || challengeSourceProblems(record).length) {
          sourceInvalid = true;
          continue;
        }
        sources.push({
          id: record.id,
          title: sourceTitle(record),
          label: challengeSourceLabel(record),
          issuer: record.issuer || record.court || record.publisher || '',
          date: record.effective || record.issued || record.date || '',
          verified: record.verified || '',
          href: record.url,
          locator: record.locator || c.evidence?.locator || '',
          note: record.note || ''
        });
      }
      if (!sources.length) sourceInvalid = true;

      return {
        id: c.id,
        version: digest([c.id, c.version, c.prompt, c.goal, c.offer, c.answer, c.revealSteps, c.nextTimeSignal]).slice(0, 16),
        state: sourceInvalid ? 'retired' : c.state,
        levelRole: c.levelRole,
        roleLabel: c.roleLabel,
        caseSlug: c.caseSlug,
        caseTitle: topicRows.get(c.caseSlug) || c.caseSlug,
        ruleId: c.ruleId || '',
        companionId: c.companionId,
        productSnapshot: c.productSnapshot,
        goal: c.goal,
        observableClues: c.observableClues,
        prompt: c.prompt,
        offer: c.offer,
        answer: c.answer,
        answerType: c.answerType,
        revealSteps: c.revealSteps,
        nextTimeSignal: c.nextTimeSignal,
        evidence: {
          locator: c.evidence?.locator || '',
          verifiedAt: c.evidence?.verifiedAt || '',
          validUntil: c.evidence?.validUntil || '',
          sourceNote: c.evidence?.sourceNote || ''
        },
        sources
      };
    });

    const packInvalid = pack.state === 'retired' || levels.some(l => l.state !== 'approved');
    packs.push({
      id: pack.id,
      title: pack.title,
      subtitle: pack.subtitle,
      publishedDate: pack.publishedDate,
      state: packInvalid ? 'paused-source-invalid' : 'approved',
      revision: row.revision,
      companionId: pack.companionId,
      shareHook: pack.shareHook,
      levels
    });
  }

  const publicPackIds = new Set(packs.filter(p => p.state === 'approved').map(p => p.id));
  const schedule = (packsConfig?.schedule || []).filter(item => publicPackIds.has(item.packId));
  const payload = {
    schema: 4,
    mode: 'daily-challenge',
    defaultPackId: publicPackIds.has(packsConfig?.defaultPackId) ? packsConfig.defaultPackId : (packs.find(p => p.state === 'approved')?.id || ''),
    schedule,
    companions,
    packs
  };
  return {
    ...payload,
    revision: digest(payload).slice(0, 20)
  };
}
