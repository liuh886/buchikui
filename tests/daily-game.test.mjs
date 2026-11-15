import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { loadContentSeed, populateDatabase } from '../scripts/lib/content-db.mjs';
import { publicDailyContent } from '../scripts/lib/challenge-content.mjs';

const seed = await loadContentSeed();
const clone = value => structuredClone(value);

async function withDb(callback, source = seed) {
  const db = new DatabaseSync(':memory:');
  try {
    await populateDatabase(db, source);
    return await callback(db);
  } finally {
    db.close();
  }
}

async function loadGameRuntime() {
  const dailyJs = await readFile(new URL('../daily-data.js', import.meta.url), 'utf8');
  const gameStateJs = await readFile(new URL('../game-state.js', import.meta.url), 'utf8');
  const context = vm.createContext({ window: {}, URL, Intl });
  context.globalThis = context.window;
  vm.runInContext(dailyJs, context);
  vm.runInContext(gameStateJs, context);
  return {
    daily: context.window.BUCHIKUI_DAILY,
    G: context.window.BuchikuiGame
  };
}

test('每日 5 关内容入库与公开序列化：包含 3 否 2 是且不泄漏内部审核字段', async () => withDb(db => {
  assert.equal(db.prepare('SELECT max(version) AS v FROM schema_migrations').get().v, 4);
  const packRow = db.prepare("SELECT id, state FROM daily_packs WHERE id='episode-001'").get();
  assert.equal(packRow.state, 'approved');

  const daily = publicDailyContent(db, seed.packsConfig, seed.portrait);
  assert.equal(daily.schema, 4);
  assert.equal(daily.mode, 'daily-challenge');
  assert.equal(daily.defaultPackId, 'episode-001');
  assert.equal(daily.packs.length, 1);

  const pack = daily.packs[0];
  assert.equal(pack.levels.length, 5);
  assert.equal(pack.levels.filter(l => l.answer === 'no').length, 3);
  assert.equal(pack.levels.filter(l => l.answer === 'yes').length, 2);
  assert.ok(pack.levels.every(l => l.observableClues.length >= 1 && l.sources.length >= 1));
  assert.ok(pack.levels.every(l => !/^你是否遭遇过：/.test(l.prompt)));

  const serialized = JSON.stringify(daily);
  assert.ok(!serialized.includes('blindTestNote'));
  assert.ok(!serialized.includes('counterfactual'));
}));

test('daily-data.js 与数据库公开序列化严格同步且通过状态机校验', async () => {
  const { daily, G } = await loadGameRuntime();
  assert.deepEqual(Array.from(G.validate(daily)), []);
  await withDb(db => {
    const built = publicDailyContent(db, seed.packsConfig, seed.portrait);
    assert.deepEqual(JSON.parse(JSON.stringify(daily)), built);
  });
});

test('发布闸门拦截未核验/阻塞/缺反方/全同向答案关卡并回滚事务', async () => {
  const mutations = [
    s => { s.challenges[0].state = 'draft'; },
    s => { s.challenges[0].state = 'blocked'; },
    s => { s.challenges[0].prompt = '你是否遭遇过：到店支付却先扣款？'; },
    s => { s.challenges[0].counterfactual = ''; },
    s => { s.challenges[1].answerType = '已核验违法'; },
    s => { s.challenges[0].sourceIds = ['case-consumer-prepaid-retail-deduction']; },
    s => {
      for (const ch of s.challenges) {
        ch.answer = 'no';
        ch.answerType = '已核验违法';
      }
    }
  ];

  for (const mutate of mutations) {
    const changed = clone(seed);
    mutate(changed);
    const db = new DatabaseSync(':memory:');
    try {
      await assert.rejects(() => populateDatabase(db, changed));
      assert.equal(db.prepare('SELECT count(*) AS n FROM sources').get().n, 0);
    } finally {
      db.close();
    }
  }
});

test('状态机：首答锁分、防双击重复作答、0/5 与 5/5 评分与回看只读', async () => {
  const { daily, G } = await loadGameRuntime();
  const resolved = G.resolveActivePack(daily);
  assert.equal(resolved.status, 'ready');
  const pack = resolved.pack;

  // 5/5 满分局 + 双击防重入 + 两段揭晓
  let runAllCorrect = G.startRun(pack, 'daily');
  for (let i = 0; i < 5; i++) {
    const lvl = pack.levels[i];
    const wrongChoice = lvl.answer === 'yes' ? 'no' : 'yes';
    runAllCorrect = G.choose(runAllCorrect, pack, lvl.answer, lvl.id);
    assert.equal(runAllCorrect.status, 'revealing');
    assert.equal(runAllCorrect.revealStep, 1);

    // 同一关锁分后再次点击反方向按钮不得篡改答案或加分
    const afterDoubleClick = G.choose(runAllCorrect, pack, wrongChoice, lvl.id);
    assert.equal(afterDoubleClick.records[i].choice, lvl.answer);
    assert.equal(afterDoubleClick.records.length, i + 1);

    runAllCorrect = G.expandReveal(runAllCorrect);
    assert.equal(runAllCorrect.status, 'resolved');
    assert.equal(runAllCorrect.revealStep, 2);

    runAllCorrect = G.nextStep(runAllCorrect);
  }
  assert.equal(runAllCorrect.status, 'completed');
  assert.equal(G.scoreOf(runAllCorrect), 5);
  assert.deepEqual(Array.from(G.unspoileredGrid(runAllCorrect)), ['hit', 'hit', 'hit', 'hit', 'hit']);

  // 回看已答关卡只读
  const reviewRun = G.goToLevel(runAllCorrect, 1);
  assert.equal(reviewRun.viewIndex, 1);
  assert.equal(reviewRun.status, 'resolved');
  assert.equal(G.scoreOf(reviewRun), 5);

  // 0/5 局同样走完全部 5 关且有完整分数与无剧透网格
  let runAllWrong = G.startRun(pack, 'challenge');
  for (let i = 0; i < 5; i++) {
    const lvl = pack.levels[i];
    const wrongChoice = lvl.answer === 'yes' ? 'no' : 'yes';
    runAllWrong = G.choose(runAllWrong, pack, wrongChoice, lvl.id);
    runAllWrong = G.nextStep(runAllWrong);
  }
  assert.equal(runAllWrong.status, 'completed');
  assert.equal(G.scoreOf(runAllWrong), 0);
  assert.deepEqual(Array.from(G.unspoileredGrid(runAllWrong)), ['miss', 'miss', 'miss', 'miss', 'miss']);
});

test('刷新恢复、版本变更保留未改关卡首答、缺包与停播兜底、分享文案不剧透', async () => {
  const { daily, G } = await loadGameRuntime();
  const pack = G.resolveActivePack(daily, 'episode-001', true).pack;

  // 答完前 2 关，模拟页面刷新恢复
  let run = G.startRun(pack, 'daily');
  run = G.nextStep(G.choose(run, pack, pack.levels[0].answer, pack.levels[0].id));
  run = G.nextStep(G.choose(run, pack, pack.levels[1].answer === 'yes' ? 'no' : 'yes', pack.levels[1].id));

  const restored = G.restoreRun(structuredClone(run), pack, 'daily');
  assert.equal(restored.notice, '');
  assert.equal(restored.run.activeIndex, 2);
  assert.equal(restored.run.status, 'ready');
  assert.equal(restored.run.records.length, 2);

  // 模拟第 2 关（index=1）版本升级：保留第 1 关，退回到第 2 关重做
  const bumpedPack = structuredClone(pack);
  bumpedPack.levels[1].version = '1.0.1';
  const migrated = G.restoreRun(structuredClone(run), bumpedPack, 'daily');
  assert.equal(migrated.run.activeIndex, 1);
  assert.equal(migrated.run.records.length, 1);
  assert.match(migrated.notice, /更新/);

  // 分享文案不包含标准答案或任何一关揭晓/选项剧透
  for (let i = 2; i < 5; i++) {
    run = G.nextStep(G.choose(run, pack, pack.levels[i].answer, pack.levels[i].id));
  }
  const shareUrl = 'https://liuh886.github.io/buchikui/?pack=episode-001&challenge=1';
  const shareText = G.buildShareText(pack, run, shareUrl);
  assert.ok(shareText.includes('4/5'));
  assert.ok(shareText.includes(shareUrl));
  for (const lvl of pack.levels) {
    assert.ok(!shareText.includes(lvl.revealSteps.twist));
    assert.ok(!shareText.includes(lvl.offer.yesLabel));
    assert.ok(!shareText.includes(lvl.offer.noLabel));
  }

  // 缺包与来源异常兜底
  assert.equal(G.resolveActivePack(daily, 'episode-999').status, 'missing-pack');
  const pausedDaily = structuredClone(daily);
  pausedDaily.packs[0].state = 'draft';
  assert.equal(G.resolveActivePack(pausedDaily).status, 'paused-source-invalid');
});
