import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadRuntime,richStatic} from '../scripts/prerender-cases.mjs';
const {scenarios:S,authority,book,cases,render}=await loadRuntime();
const plain=value=>JSON.parse(JSON.stringify(value));

test('公开问句统一开头，只询问消费决策经历，无标准答案',()=>{
  assert.deepEqual(plain(S.validate()),[]);
  for(const q of S.questions){
    assert.match(q.action,/^你是否遭遇过：/);
    assert.equal(q.mode,'self-report');
    assert.ok(['相信','选择','合作','购买'].includes(q.decisionType));
    assert.ok(S.ruleFor(q,authority),'相关案例仍能查证');
    for(const key of ['answer','wrongWhy','correctWhy','outcomeWrong','outcomeCorrect']) assert.equal(key in q,false);
  }
});

test('有过、没有过和暂不回答均进入下一题，不判分、不要求重答',()=>{
  for(const choice of ['yes','no','skip']){
    const initial=S.start(),q=S.current(initial),next=S.respond(initial,choice,q.id);
    assert.equal(next.index,1);assert.equal(next.responses[0].choice,choice);
    assert.equal('verdict' in next,false);
    assert.equal(S.current(next).id,S.questions[1].id);
    assert.equal(S.respond(next,choice,q.id),next,'旧按钮不能重复记录并连跳');
  }
});

test('问卷按所有分组连续填写，结束没有成绩或自动重开',()=>{
  let state=S.start();
  for(const q of S.questions){assert.equal(S.current(state).id,q.id);state=S.respond(state,'no',q.id);}
  assert.equal(S.current(state),undefined);assert.equal(state.responses.length,S.questions.length);
  assert.equal(S.respond(state,'yes',S.questions[0].id),state);
  assert.equal(S.current(S.restore(plain(state)).state),undefined);
});

test('刷新保留自述选择，返回上一题可修改；跳过不伪装成没有过',()=>{
  let state=S.respond(S.start(),'skip',S.questions[0].id);
  assert.equal(S.restore(plain(state)).state.responses[0].choice,'skip');
  state=S.previous(state);assert.equal(S.current(state).id,S.questions[0].id);
  state=S.respond(state,'yes',S.questions[0].id);assert.equal(state.responses[0].choice,'yes');
});

test('旧游戏判定、损坏进度都不转成问卷回答',()=>{
  for(const old of [{schema:1,verdict:'correct',passed:['hotel-cancel']},{...plain(S.start()),index:3,responses:[]}]){
    const restored=S.restore(old).state;assert.equal(restored.index,0);assert.equal(restored.responses.length,0);
  }
});

test('问句版本改变时从受影响题继续，不伪造新版本回答',()=>{
  const q=S.questions[0],original=q.version;
  const saved=S.respond(S.start(),'yes',q.id);
  try{q.version='f'.repeat(20);const restored=S.restore(plain(saved));assert.equal(restored.state.index,0);assert.equal(restored.state.responses.length,0);assert.match(restored.notice,/更新/);}finally{q.version=original;}
});

test('画像分享从完整问卷开始，旧题号不能截取半卷生成画像',()=>{
  for(const q of S.questions){const state=S.start(q.id);assert.equal(S.current(state).id,S.questions[0].id);assert.equal(state.responses.length,0);assert.equal(state.index,0);assert.equal(state.order.length,S.questions.length);}
});

test('案例章节与规则锚点仍完整，读案例入口可返回问卷',()=>{
  assert.equal(book.chapters.length,cases.length);
  for(const item of cases){
    assert.ok(book.chapter(item.slug));
    const html=render.caseArticleHtml(item,{rich:richStatic,authorityHtml:authority.staticBlock(item.slug),resume:true});
    assert.ok(html.includes('返回问卷'));
    const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
    for(const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(m[1]),`${item.slug}: ${m[1]}`);
  }
});
