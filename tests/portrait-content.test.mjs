import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {loadContentSeed,populateDatabase} from '../scripts/lib/content-db.mjs';
import {portraitAssetPathSync,questionnaireVersion,lessonReviewFingerprint,publicPortrait} from '../scripts/lib/portrait-content.mjs';

const seed=await loadContentSeed();
const clone=value=>structuredClone(value);
async function withDb(callback,source=seed){
  const db=new DatabaseSync(':memory:');
  try{await populateDatabase(db,source);return await callback(db);}finally{db.close();}
}

test('画像配置与审核短读进入可重建内容库，六角色八题均有发布依据',async()=>withDb(db=>{
  assert.equal(db.prepare('SELECT max(version) AS version FROM schema_migrations').get().version,3);
  const config=JSON.parse(db.prepare('SELECT payload FROM portrait_publications WHERE id=1').get().payload);
  assert.equal(config.portraits.length,6);
  assert.equal(config.lessons.length,8);
  assert.ok(config.lessons.every(l=>/^[0-9a-f]{64}$/.test(l.reviewedAgainst)));
  assert.equal(new Set(config.lessons.map(l=>l.questionId)).size,db.prepare('SELECT count(*) AS n FROM published_questions').get().n);
}));

test('来源事实或解释变化使短读失去审核效力，导入事务回滚',async()=>{
  for(const mutate of [
    s=>{s.sources.find(source=>source.id===s.portrait.lessons[0].caseId).facts+=' 新事实。';},
    s=>{const l=s.portrait.lessons[0];s.editorial[l.topicSlug].rules.find(r=>r.id===l.ruleId).action+=' 新提醒。';},
    s=>{s.sources.find(source=>source.id===s.portrait.lessons[0].caseId).verified='2026-10-24';},
    s=>{s.portrait.lessons[0].notice+=' 编辑修改文本未重审。';}
  ]){
    const changed=clone(seed);mutate(changed);
    const db=new DatabaseSync(':memory:');
    try{
      await assert.rejects(()=>populateDatabase(db,changed),/短读需重新审核/);
      assert.equal(db.prepare('SELECT count(*) AS n FROM sources').get().n,0);
    }finally{db.close();}
  }
});

test('审核指纹绑定事实、边界与规则，修改无关编辑备注不改变指纹，短读自身修改改变指纹',()=>{
  const source=seed.sources.find(s=>s.id===seed.portrait.lessons[0].caseId);
  const rule={id:'rule',status:'现行',text:'解释',action:'提醒'};
  const lesson=seed.portrait.lessons[0];
  const initial=lessonReviewFingerprint(source,rule,lesson);
  assert.equal(lessonReviewFingerprint({...source,note:'内部备注'},rule,lesson),initial);
  assert.notEqual(lessonReviewFingerprint({...source,boundary:source.boundary+' 边界改变。'},rule,lesson),initial);
  assert.notEqual(lessonReviewFingerprint(source,{...rule,status:'已失效'},lesson),initial);
  assert.notEqual(lessonReviewFingerprint(source,rule,{...lesson,notice:lesson.notice+' 改写提醒'}),initial);
  assert.notEqual(lessonReviewFingerprint(source,rule,{...lesson,situation:lesson.situation+' 改写事实'}),initial);
  assert.notEqual(lessonReviewFingerprint(source,rule,{...lesson,outcome:lesson.outcome+' 改写结果'}),initial);
  assert.notEqual(lessonReviewFingerprint(source,rule,{...lesson,boundary:lesson.boundary+' 改写边界'}),initial);
});

test('阻止错配案例、缺角色、重复映射、过高覆盖及单主题入门内容发布',async()=>{
  for(const mutate of [
    s=>{s.portrait.lessons[0].caseId=s.portrait.lessons[1].caseId;},
    s=>{s.portrait.portraits.pop();},
    s=>{s.portrait.groups[1].portraitId=s.portrait.groups[0].portraitId;},
    s=>{s.portrait.minAnswered=9;},
    s=>{s.portrait.lessons=s.portrait.lessons.slice(1);},
    s=>{for(const l of s.portrait.lessons) if(l.topicSlug!=='travel-booking') l.introPriority=null;},
    s=>{s.portrait.portraits[0].image='../source';},
    s=>{delete s.portrait.mechanisms;},
    s=>{s.portrait.mechanisms=s.portrait.mechanisms.slice(0,2);},
    s=>{s.portrait.mechanisms[0].questionIds=['missing-qid'];},
    s=>{s.portrait.minAnsweredPerMechanism=0;},
    s=>{s.portrait.mechanisms[0].portraitId=s.portrait.insufficientPortraitId;},
    s=>{s.portrait.mechanisms[0].portraitId=s.portrait.tiePortraitId;},
    s=>{s.portrait.mechanisms[0].portraitId=s.portrait.noReportedPortraitId;}
  ]){
    const changed=clone(seed);mutate(changed);
    await assert.rejects(()=>withDb(()=>{},changed));
  }
});

test('阻止将普通经历机制映射到兜底角色，导入失败且事务回滚保留前一数据库',async()=>{
  const changed=clone(seed);
  changed.portrait.mechanisms[0].portraitId=changed.portrait.insufficientPortraitId;
  const db=new DatabaseSync(':memory:');
  try{
    await assert.rejects(()=>populateDatabase(db,changed),/画像经历机制无效/);
    assert.equal(db.prepare('SELECT count(*) AS n FROM sources').get().n,0);
  }finally{db.close();}
});

test('公开投影使用已有原案出处，不泄露审核指纹或编辑字段',()=>{
  const questions=seed.questions.filter(q=>q.reviewState==='published').map(q=>{
    const source=seed.sources.find(s=>s.id===q.realCaseId);
    return {...q,version:'version',analysis:{cases:[{id:source.id,title:source.title,source:{href:source.url,publisher:source.issuer,type:source.weight,published:source.issued,verified:source.verified,locator:source.locator}}]}};
  });
  const config=clone(seed.portrait);config.internalNote='editor-only';
  const publicData=publicPortrait(config,questions,seed.journeys,(id,thumb)=>`portraits/${id}${thumb?'-thumb':''}.abcdef.webp`);
  assert.equal(publicData.lessons.length,8);
  assert.equal(publicData.lessons[0].groupId,'travel');
  assert.equal(publicData.lessons[0].mechanismId,'promise-gap');
  assert.equal(publicData.minAnsweredPerMechanism,1);
  assert.equal(publicData.mechanisms?.length,3);
  assert.equal(publicData.lessons[0].source.href,seed.sources.find(s=>s.id===config.lessons[0].caseId).url);
  assert.ok(publicData.portraits.every(p=>p.image.startsWith('portraits/')));
  assert.ok(!JSON.stringify(publicData).includes('reviewedAgainst'));
  assert.ok(!JSON.stringify(publicData).includes('internalNote'));
  questions.shift();
  assert.equal(publicPortrait(config,questions,seed.journeys,id=>id).lessons.length,7);
});

test('问卷版本绑定语义版本、固定题序与分组，不因案例说明或插画变化失效',()=>{
  const qs=seed.questions.filter(q=>q.reviewState==='published').map(q=>({...q,version:`v-${q.id}`}));
  const original=questionnaireVersion(qs,seed.journeys);
  assert.equal(questionnaireVersion(qs.map(q=>({...q,analysis:{text:'new explanation'}})),seed.journeys),original);
  const changed=clone(qs);changed[0].version='new-semantic-version';
  assert.notEqual(questionnaireVersion(changed,seed.journeys),original);
  const order=clone(seed.journeys);order[0].questionIds.reverse();
  assert.notEqual(questionnaireVersion(qs,order),original);
  const grouping=clone(seed.journeys);grouping[0].id='another-theme';
  assert.notEqual(questionnaireVersion(qs,grouping),original);
});

test('角色资源路径按真实字节哈希生成，拒绝路径穿越和缺失资源',async()=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'buchikui-portrait-assets-'));
  try{
    const directory=path.join(root,'editorial','portrait-assets');await mkdir(directory,{recursive:true});
    const bytes=Buffer.from('isolated-test-asset');
    await writeFile(path.join(directory,'otter.webp'),bytes);
    const hash=createHash('sha256').update(bytes).digest('hex').slice(0,12);
    assert.equal(portraitAssetPathSync('otter',false,root),`portraits/otter.${hash}.webp`);
    assert.throws(()=>portraitAssetPathSync('../otter',false,root),/资源键无效/);
    assert.throws(()=>portraitAssetPathSync('cloud',false,root),/ENOENT/);
  }finally{await rm(root,{recursive:true,force:true});}
});
