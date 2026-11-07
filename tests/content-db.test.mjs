import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {loadContentSeed,populateDatabase,publicContent,buildContentDatabase,databaseStats,readPublicContent} from '../scripts/lib/content-db.mjs';
import {loadRuntime} from '../scripts/prerender-cases.mjs';
import {lessonReviewFingerprint} from '../scripts/lib/portrait-content.mjs';
import {joinRule} from '../scripts/build-authority.mjs';

const seed=await loadContentSeed();
const clone=value=>structuredClone(value);
async function withDb(callback,source=seed){
  const db=new DatabaseSync(':memory:');
  try{await populateDatabase(db,source);return await callback(db);}finally{db.close();}
}

test('所有现有来源、章节与旧题入库，未核验旧案例保留采集状态',async()=>withDb(db=>{
  const stats=databaseStats(db);
  assert.equal(stats.sources,seed.sources.length);
  assert.equal(stats.topics,seed.topics.length);
  assert.equal(stats.realCases,seed.sources.filter(s=>s.kind==='case').length);
  assert.equal(db.prepare("SELECT count(*) AS n FROM questions WHERE review_state='retired'").get().n,seed.questions.filter(q=>q.reviewState==='retired').length);
  assert.ok(db.prepare("SELECT count(*) AS n FROM real_cases WHERE review_state='collected'").get().n>0);
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
}));

test('公开载荷只含已审核且有核验案例的题，内部资料和旧题不泄漏',async()=>withDb(db=>{
  const content=publicContent(db);
  assert.equal(content.questions.length,seed.questions.filter(q=>q.reviewState==='published').length);
  assert.ok(content.questions.every(q=>q.realCaseId&&q.mode==='self-report'));
  assert.ok(content.questions.every(q=>!('answer' in q)));
  assert.ok(!JSON.stringify(content).includes('rental-operator'));
  assert.ok(!JSON.stringify(content).includes('misconception'));
  assert.ok(!JSON.stringify(content).includes('needsReview'));
  assert.deepEqual(content.journeys.flatMap(j=>j.questionIds),content.questions.map(q=>q.id));
}));

test('撤下的订房问句保留历史但不再公开，新旅游问句直接关联核验的行程案例',async()=>withDb(db=>{
  const content=publicContent(db);
  assert.ok(!content.questions.some(q=>q.id==='survey-hotel-cancel'));
  assert.equal(db.prepare('SELECT review_state FROM questions WHERE id=?').get('survey-hotel-cancel').review_state,'retired');
  const q=content.questions.find(q=>q.id==='survey-tour-museum');
  assert.ok(q);
  const source=JSON.parse(db.prepare('SELECT payload FROM sources WHERE id=?').get(q.realCaseId).payload);
  assert.equal(source.weight,'监管处罚案例');
  assert.match(source.facts,/无购物/);
  assert.match(source.boundary,/未说明游客是否购买/);
  assert.ok(db.prepare('SELECT 1 FROM rule_sources WHERE rule_id=? AND source_id=?').get(q.ruleId,q.realCaseId));
}));

test('来源撤回、案例待审核、题目变草稿时立即退出公开查询',async()=>{
  for(const sql of ["UPDATE sources SET eligible=0 WHERE id=?","UPDATE real_cases SET review_state='collected' WHERE id=?","UPDATE questions SET review_state='draft' WHERE real_case_id=?"]){
    await withDb(db=>{
      const question=publicContent(db).questions[0];
      db.prepare(sql).run(question.realCaseId);
      assert.ok(!publicContent(db).questions.some(q=>q.id===question.id));
    });
  }
});

test('每题解析只导出直接关联的已核验案例、解释与出处，不暴露内部采集记录',async()=>withDb(db=>{
  for(const q of publicContent(db).questions){
    assert.ok(q.analysis.cases.length);
    assert.ok(q.analysis.explanation&&q.analysis.reminder);
    for(const item of q.analysis.cases){
      const source=seed.sources.find(s=>s.id===item.id);
      assert.equal(item.facts,source.facts);
      assert.equal(item.holding,source.holding);
      assert.equal(item.boundary,source.boundary);
      assert.equal(item.source.href,source.url);
      assert.ok(db.prepare('SELECT 1 FROM rule_sources WHERE topic_slug=? AND rule_id=? AND source_id=?').get(q.caseSlug,q.ruleId,item.id));
      assert.equal('needsReview' in item,false);
      assert.equal('__file' in item,false);
    }
  }
}));

test('补充案例解析更新内容修订号，但不让已有问卷回答失效',async()=>{
  const before=await withDb(db=>publicContent(db));
  const changed=clone(seed);
  changed.sources.find(s=>s.id===before.questions[0].realCaseId).facts+=' 核验后的补充经过。';
  await assert.rejects(()=>withDb(db=>publicContent(db),changed),/短读需重新审核/);
  const corpus=new Map(changed.sources.map(s=>[s.id,s]));
  for(const lesson of changed.portrait.lessons){
    const rule=joinRule(changed.editorial[lesson.topicSlug].rules.find(r=>r.id===lesson.ruleId),corpus);
    lesson.reviewedAgainst=lessonReviewFingerprint(corpus.get(lesson.caseId),rule,lesson);
  }
  const after=await withDb(db=>publicContent(db),changed);
  assert.notEqual(after.revision,before.revision);
  assert.deepEqual(after.questions.map(q=>q.version),before.questions.map(q=>q.version));
  assert.notEqual(after.questions[0].analysis.cases[0].facts,before.questions[0].analysis.cases[0].facts);
});

test('共享同一发布页面的不同案例，仍按来源ID准确关联和统计',async()=>{
  const {collectReferences}=await import('../scripts/check-corpus.mjs');
  const refs=await collectReferences();
  for(const id of ['case-consumer-hotel-cancel','case-consumer-photo-unfinished','case-consumer-battery-replacement','case-consumer-secondhand-business']){
    assert.ok(refs.some(ref=>ref.sourceId===id),`${id} 未被准确引用`);
  }
});

test('禁止发布无真实依据、无边界、无匹配规则或过长的题面',async()=>{
  for(const mutate of [
    s=>{s.questions[0].realCaseId=null;},
    s=>{s.questions[0].action='这项条款合法吗？';},
    s=>{s.questions[0].ruleId='not-a-rule';},
    s=>{s.questions[0].action='你是否遭遇过：购买过'+ '字'.repeat(81)+'？';},
    s=>{s.questions[0].answer='would';},
    s=>{s.questions[0].realCaseId='case-consumer-renewal-notice';}
  ]){
    const changed=clone(seed);mutate(changed);
    await assert.rejects(()=>withDb(()=>{},changed));
  }
});

test('重复构建不会重复入库，失败的导入保留前一版本数据库',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'buchikui-db-'));
  const file=path.join(dir,'content.sqlite');
  const first=await buildContentDatabase(file,seed);
  const second=await buildContentDatabase(file,seed);
  assert.deepEqual(second,first);
  const bad=clone(seed);bad.questions[0].ruleId='missing';
  await assert.rejects(()=>buildContentDatabase(file,bad));
  assert.deepEqual(readPublicContent(file),first.content);
});

test('静态快照与数据库公开查询一致；前端拒绝损坏载荷并保留可用题',async()=>{
  const file=await readFile(new URL('../content-data.js',import.meta.url),'utf8');
  const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(file,sandbox);
  await withDb(db=>assert.equal(JSON.stringify(sandbox.window.BUCHIKUI_CONTENT),JSON.stringify(publicContent(db))));
  const {scenarios:S,authority}=await loadRuntime();
  const before=JSON.stringify(S.questions);
  assert.equal(S.installContent({schema:2,mode:'self-report',questions:[{id:'broken'}],journeys:[{id:'invalid'}]}),false);
  assert.equal(JSON.stringify(S.questions),before);
});
