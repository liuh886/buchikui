import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadSandbox} from '../scripts/prerender-cases.mjs';
const runtime=await loadSandbox(['content-data.js','survey-portrait.js','survey-state.js']);
const P=runtime.BuchikuiPortrait,S=runtime.BuchikuiSurvey,content=S.getContent();
const plain=value=>JSON.parse(JSON.stringify(value));
const complete=choices=>S.questions.reduce((state,q,i)=>S.respond(state,choices[i]||'no',q.id),S.start());

test('六角色可解释分配：全YES、全NO、全跳过及三个机制画像与并列',()=>{
  for(const [answers,expected] of [
    [Array(8).fill('yes'),'fox'],[Array(8).fill('no'),'bird'],[Array(8).fill('skip'),'cloud'],
    [['yes','no','no','no','no','no','no','no'],'otter'],
    [['no','yes','no','no','no','no','no','no'],'capybara'],
    [['no','no','yes','no','no','no','no','no'],'raccoon'],
    [['yes','no','no','no','no','no','yes','no'],'otter'],
    [['no','yes','no','no','yes','no','no','no'],'capybara'],
    [['no','no','yes','yes','no','yes','no','no'],'raccoon'],
    [['yes','no','yes','no','no','no','no','no'],'fox']
  ]) assert.equal(P.calculate(content,complete(answers)).portraitId,expected);
});

test('PM评估复现用例验证：主画像与首则案例推荐严格对齐',()=>{
  // 第1到8题依次为 NO/YES/YES/NO/NO/YES/YES/YES
  const choices=['no','yes','yes','no','no','yes','yes','yes'];
  const state=complete(choices);
  const result=P.calculate(content,state);
  const lessons=plain(P.lessons(content,state));
  assert.equal(lessons.length,2);
  // 第一则案例必须来自主画像证据（Q3/Q6/Q7/Q8）
  assert.ok(result.reasonQuestionIds.includes(lessons[0].questionId));
  assert.equal(lessons[0].matched,true);
  assert.notEqual(lessons[0].caseId,lessons[1].caseId);
  assert.notEqual(lessons[0].topicSlug+'/'+lessons[0].ruleId,lessons[1].topicSlug+'/'+lessons[1].ruleId);
});
test('画像覆盖与有效完整答卷分开，缺答不能被当NO',()=>{
  const six=complete(['no','skip','no','skip','no','no','no','no']);
  assert.equal(P.calculate(content,six).portraitId,'bird');assert.equal(P.calculate(content,six).skippedCount,2);
  assert.equal(P.calculate(content,complete(['no','skip','no','skip','no','skip','no','no'])).portraitId,'cloud');
});
test('R1独立复核回归：有效覆盖严格依据经历机制而非旧题组',()=>{
  // 机制B全skip（Q2, Q5），机制A答3题（Q1=yes, Q7=yes, Q8=no），机制C答3题（Q3=no, Q4=no, Q6=no）
  // 总答数 6 >= 6，旧题组每组均有回答，但机制B答数为0 -> 必须判为 cloud
  const caseBEmpty = complete(['yes','skip','no','no','skip','no','yes','no']);
  assert.equal(P.calculate(content,caseBEmpty).portraitId,'cloud');
  assert.equal(P.calculate(content,caseBEmpty).status,'insufficient');

  // 旧第一题组全skip（Q1, Q2），机制A答2题（Q7=no, Q8=no），机制B答1题（Q5=no），机制C答3题（Q3=yes, Q4=no, Q6=no）
  // 总答数 6 >= 6，三个机制均有回答且>=1，机制C胜出 -> 必须正确判为 raccoon 而非误判为 cloud
  const caseOldGroupEmpty = complete(['skip','skip','yes','no','no','no','no','no']);
  assert.equal(P.calculate(content,caseOldGroupEmpty).portraitId,'raccoon');
  assert.equal(P.calculate(content,caseOldGroupEmpty).status,'classified');
});
test('R2独立复核回归：并列结果两则推荐分别严格回应并列的两个胜出经历机制',()=>{
  // 复现用例：NO, YES, YES, NO, NO, YES, YES, YES
  // 机制A (Q1, Q7, Q8): 2/3 YES (Q7, Q8)
  // 机制B (Q2, Q5): 1/2 YES (Q2)
  // 机制C (Q3, Q4, Q6): 2/3 YES (Q3, Q6)
  // 胜出机制：机制A与机制C并列，机制B落选
  const choices=['no','yes','yes','no','no','yes','yes','yes'];
  const state=complete(choices);
  const result=P.calculate(content,state);
  assert.equal(result.isTie,true);
  assert.equal(result.portraitId,'fox');
  assert.equal(result.winningMechanisms.length,2);
  const winningMechIds=result.winningMechanisms.map(m=>m.id);
  assert.deepEqual(plain(winningMechIds).sort(),['promise-gap','settlement-obstacle'].sort());

  const lessons=plain(P.lessons(content,state));
  assert.equal(lessons.length,2);
  assert.equal(lessons[0].matched,true);
  assert.equal(lessons[1].matched,true);

  // 必须分别来自机制A与机制C，绝不能来自落选的机制B（Q2/Q5）
  const lesson1Mech=content.portrait.mechanisms.find(m=>m.questionIds.includes(lessons[0].questionId))?.id;
  const lesson2Mech=content.portrait.mechanisms.find(m=>m.questionIds.includes(lessons[1].questionId))?.id;
  assert.ok(['promise-gap','settlement-obstacle'].includes(lesson1Mech));
  assert.ok(['promise-gap','settlement-obstacle'].includes(lesson2Mech));
  assert.notEqual(lesson1Mech,lesson2Mech);
  assert.notEqual(lessons[0].questionId,'survey-arrival-payment'); // Q2 not included
  assert.notEqual(lessons[1].questionId,'survey-arrival-payment'); // Q2 not included
});
test('未完成、重复、失效版本不产生最终画像，回退修改不拼接旧历史',()=>{
  assert.equal(P.calculate(content,S.start()).status,'in-progress');
  let state=complete(['yes']);
  const invalid=plain(state);invalid.responses[1]=invalid.responses[0];assert.equal(P.calculate(content,invalid).status,'unavailable');
  const old=plain(state);old.responses[0].version='obsolete';assert.equal(P.calculate(content,old).status,'unavailable');
  state=S.previous(state);assert.equal(P.calculate(content,state).status,'in-progress');
});
test('八题所有三选组合确定且不产生能力分，理由只来自当前YES',()=>{
  for(let n=0;n<3**8;n++){
    let value=n;const choices=Array.from({length:8},()=>{const v=['yes','no','skip'][value%3];value=Math.floor(value/3);return v;});
    const state=complete(choices),result=P.calculate(content,state);
    assert.equal(content.portrait.portraits.some(p=>p.id===result.portraitId),true);
    assert.deepEqual(plain(P.calculate(content,state)),plain(result));
    assert.ok(result.reasonQuestionIds.every(id=>state.responses.some(r=>r.questionId===id&&r.choice==='yes')));
    assert.equal('score' in result,false);
  }
});
test('两则回报优先匹配、按主题/原案/规则去重，未报告和不足信息也有内容',()=>{
  for(const answers of [Array(8).fill('no'),Array(8).fill('skip'),['skip','skip','skip','skip','skip','yes','skip','skip'],Array(8).fill('yes')]){
    const lessons=plain(P.lessons(content,complete(answers)));
    assert.equal(lessons.length,2);assert.equal(new Set(lessons.map(l=>l.groupId)).size,2);
    assert.equal(new Set(lessons.map(l=>l.caseId)).size,2);assert.equal(new Set(lessons.map(l=>l.topicSlug+'/'+l.ruleId)).size,2);
    assert.ok(lessons.every(l=>l.source.href&&l.boundary&&l.notice));
  }
  assert.equal(P.lessons(content,complete(['no','no','no','no','no','no','yes','no']))[0].questionId,S.questions[6].id);
});
test('旧整卷schema2无损升级，旧半卷重开但不冒充完整画像',()=>{
  const state=plain(complete(['yes']));state.schema=2;delete state.questionnaireVersion;
  const restored=S.restore(state);assert.equal(restored.state.schema,3);assert.deepEqual(plain(restored.state.responses),state.responses);
  const partial={...state,order:state.order.slice(3),versions:state.versions.slice(3),responses:state.responses.slice(3),index:5};
  const reset=S.restore(partial);assert.equal(reset.state.index,0);assert.match(reset.notice,/完整问卷/);
  const malformed={...state,index:1,responses:[null]};assert.equal(S.restore(malformed).state.index,0);
});
test('远端载荷损坏时问题和角色作为整体保留，规则更新保留回答',()=>{
  const saved=plain(complete(['yes'])),before=JSON.stringify(S.getContent());
  const broken=plain(content);broken.portrait.groups[0].portraitId='missing';broken.questions[0].action='invalid';
  assert.equal(S.installContent(broken),false);assert.equal(JSON.stringify(S.getContent()),before);
  for(const mutate of [
    d=>{d.portrait.portraits={};},d=>{d.portrait.groups=[null];},d=>{d.journeys=[null];},d=>{d.questions=[null];},d=>{d.portrait.lessons=[null];},
    d=>{d.portrait.mechanisms=null;},d=>{d.portrait.mechanisms=d.portrait.mechanisms.slice(0,2);},
    d=>{d.portrait.mechanisms[0].questionIds=['non-existent'];},d=>{d.portrait.mechanisms[0].portraitId='invalid';},
    d=>{d.portrait.mechanisms[0].questionIds=d.portrait.mechanisms[0].questionIds.slice(0,-1);},
    d=>{d.portrait.minAnsweredPerMechanism=0;}
  ]){
    const malformed=plain(content);mutate(malformed);assert.equal(S.installContent(malformed),false);assert.equal(JSON.stringify(S.getContent()),before);
  }
  const next=plain(content);next.portrait.rulesVersion='portrait-test-new';assert.equal(S.installContent(next),true);
  const restored=S.restore(saved);assert.deepEqual(plain(restored.state.responses),saved.responses);assert.match(restored.notice,/画像规则已更新/);
  assert.equal(S.installContent(plain(content)),true);
});
