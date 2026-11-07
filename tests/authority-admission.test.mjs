import {test} from 'node:test';
import assert from 'node:assert/strict';
import {joinRule} from '../scripts/build-authority.mjs';
import {authoritySourceProblems,validateCorpus} from '../scripts/lib/corpus.mjs';

const at='2026-10-23';
const law={id:'law',kind:'law',title:'法规样例',url:'https://authority.example/doc',type:'行政法规',issuer:'发布机关',status:'现行',effective:'2025-01-01',verified:'2026-10-01'};
const join=(records,rule={id:'sample',status:'现行',sourceIds:records.map(r=>r.id)})=>joinRule(rule,new Map(records.map(r=>[r.id,r])),undefined,at);

test('采集记录可保留待核验，但不能单独支撑公开规则',()=>{
  const pending={...law,status:'待核验',needsReview:true};
  assert.ok(!validateCorpus(new Map([['law',pending]])).some(p=>p.level==='error'));
  assert.throws(()=>join([pending]),/没有合格的公开依据/);
  assert.throws(()=>join([{...law,verified:''}]),/核验日期/);
  assert.throws(()=>join([{...law,verified:'2026-02-30'}]),/核验日期/);
  assert.throws(()=>join([{...law,verified:'2026-10-24'}]),/核验日期/);
});

test('背景来源不冒充支撑，也不能抬高整条规则的核验日',()=>{
  const pending={...law,id:'background',status:'待核验',needsReview:true,verified:'2026-10-23',issuer:'未核实机关',effective:'1990-01-01'};
  const result=join([pending,law,{...law,id:'older',verified:'2026-09-01'}]);
  assert.equal(result.verified,'2026-09-01');
  assert.equal(result.effective,'2025-01-01');
  assert.equal(result.authority,'发布机关');
  assert.equal(result.sources.length,2);
  assert.ok(result.sources.every(source=>!source.title.includes('background')));
});

test('现行与待生效状态须匹配真实施行日期，已废止来源不能混入',()=>{
  assert.throws(()=>join([{...law,effective:'2027-01-01'}]),/尚未施行/);
  assert.throws(()=>join([{...law,status:'即将生效',effective:'2026-09-30'}],{id:'sample',status:'即将生效',sourceIds:['law']}),/状态与施行日期矛盾/);
  const future=join([{...law,status:'即将生效',effective:'2027-01-01'}],{id:'sample',status:'即将生效',sourceIds:['law']});
  assert.equal(future.effective,'2027-01-01');
  assert.throws(()=>join([law,{...law,id:'old',status:'已取代'}]),/失效法源/);
});

test('政策未单列施行日时保留签发日期，不能伪装为实施日期',()=>{
  const policy={...law,type:'政策文件',effective:undefined,issued:'2025-01-02',note:'原文未单列施行日期；issued 为签发日期。'};
  assert.deepEqual(authoritySourceProblems(policy,at),[]);
  assert.ok(!validateCorpus(new Map([['law',policy]])).some(p=>p.level==='error'));
  const result=join([policy]);
  assert.equal(result.issued,'2025-01-02');
  assert.equal(result.effective,undefined);
  assert.throws(()=>join([{...policy,note:''}]),/签发信息/);
});

test('媒体披露、普通参考和办事入口不能独撑规则，完整官方通报可以',()=>{
  const report={id:'case',kind:'case',title:'通报',url:law.url,issuer:'执法机关',date:'2026-10-01',verified:'2026-10-02',holding:'本次查明的事实与处理。',weight:'监管通报'};
  assert.throws(()=>join([{...report,weight:'媒体披露'}]),/媒体披露/);
  assert.throws(()=>join([{...report,date:''}]),/日期/);
  assert.throws(()=>join([{...law,kind:'reference',publisher:'媒体'}]),/普通参考资料/);
  assert.throws(()=>join([{...law,kind:'portal'}]),/办事入口/);
  assert.equal(join([report]).date,'2026-10-01');
});

test('官方安全提示须显式标注性质、机关和发布日期，不作为法律',()=>{
  const advisory={id:'advisory',kind:'reference',title:'领事安全提醒',url:law.url,publisher:'驻外使馆',issued:'2026-10-01',verified:'2026-10-23',authorityRole:'official-advisory',note:'官方风险提示，不是判决或普遍法律义务。'};
  const rule={id:'sample',kind:'advisory',status:'官方提醒',sourceIds:['advisory']};
  const result=join([advisory],rule);
  assert.equal(result.type,'官方提示');
  assert.equal(result.authority,'驻外使馆');
  assert.equal(result.effective,undefined);
  assert.throws(()=>join([{...advisory,publisher:''}],rule),/官方提示/);
  assert.throws(()=>join([advisory]),/效力状态不匹配/);
});

test('编辑层不能注入事实字段，规则类型和状态须匹配',()=>{
  const policy={...law,type:'政策文件',effective:undefined,issued:'2025-01-02',note:'原文未单列施行日期；issued 为签发日期。'};
  const result=join([policy],{id:'sample',status:'现行',sourceIds:['law'],effective:'2099-01-01',date:'2099-01-01',authority:'虚构机关',verified:'2099-01-01'});
  assert.equal(result.effective,undefined);
  assert.equal(result.date,undefined);
  assert.equal(result.issued,'2025-01-02');
  assert.equal(result.authority,law.issuer);
  for(const status of ['已废止','拼写错误','近期','官方提醒']) assert.throws(()=>join([law],{id:'sample',status,sourceIds:['law']}),/状态|近期/);
  assert.throws(()=>join([law],{id:'sample',kind:'unknown',status:'现行',sourceIds:['law']}),/类型无效/);
  assert.throws(()=>join([law],{id:'sample',kind:'case',status:'近期',sourceIds:['law']}),/缺少合格案例来源/);
  assert.throws(()=>join([law],{id:'sample',kind:'case',status:'即将生效',sourceIds:['law']}),/案例参考不能/);
});

test('核验日期不得早于实际发布或裁判，但可先核验尚未施行的正式文本',()=>{
  assert.throws(()=>join([{...law,issued:'2026-10-15'}]),/核验日期早于/);
  const future={...law,status:'即将生效',issued:'2026-09-01',effective:'2027-01-01'};
  assert.equal(join([future],{id:'sample',status:'即将生效',sourceIds:['law']}).effective,'2027-01-01');
});
