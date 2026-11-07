import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {responseDatabase,recordResponse,surveyStats} from '../scripts/lib/survey-responses.mjs';
import {readPublicContent,buildContentDatabase} from '../scripts/lib/content-db.mjs';
const content=readPublicContent(),q=content.questions[0];
const base={participantId:'8defaabe-d6cc-4f39-a3ca-2423fefab600',questionId:q.id,version:q.version,choice:'yes',sequence:1};

test('记录实际回答与问句版本，重复投递不重复计数，迟到请求不覆盖新选择',()=>{
  const db=responseDatabase(':memory:');
  try{
    assert.equal(recordResponse(db,base,content).status,200);
    assert.equal(recordResponse(db,base,content).status,200);
    assert.equal(recordResponse(db,{...base,choice:'no',sequence:2},content).status,200);
    recordResponse(db,base,content);
    const rows=db.prepare('SELECT * FROM survey_responses').all();
    assert.equal(rows.length,1);assert.equal(rows[0].choice,'no');assert.equal(rows[0].client_sequence,2);
    assert.equal(rows[0].question_text,q.action);assert.equal(rows[0].question_version,q.version);
    assert.equal(recordResponse(db,{...base,choice:'yes',sequence:2},content).status,409);
  }finally{db.close();}
});

test('汇总只用当前版本完整答卷，跳过与未完成不伪装成人数或没有过',()=>{
  const db=responseDatabase(':memory:');
  const ids=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000004'];
  try{
    assert.equal(surveyStats(db,content).totalCompleted,0);assert.equal(surveyStats(db,content).maxYesCount,null);
    for(const [i,question] of content.questions.entries()){
      recordResponse(db,{...base,participantId:ids[0],questionId:question.id,version:question.version,choice:i<2?'yes':'no',sequence:i+1},content);
      recordResponse(db,{...base,participantId:ids[2],questionId:question.id,version:question.version,choice:'skip',sequence:i+1},content);
      recordResponse(db,{...base,participantId:ids[3],questionId:question.id,version:question.version,choice:'yes',sequence:i+1},content);
    }
    recordResponse(db,{...base,participantId:ids[1]},content);
    const stats=surveyStats(db,content);
    assert.equal(stats.totalCompleted,2);assert.equal(stats.maxYesCount,content.questions.length);
    assert.equal(stats.distribution.find(r=>r.yesCount===2).responses,1);
    assert.equal(stats.byQuestion[0].yes,2);assert.equal(stats.byQuestion[2].no,1);
    assert.ok(!JSON.stringify(stats).includes(ids[0]),'公开汇总不泄漏参与标识');
    db.prepare('UPDATE survey_responses SET question_version=? WHERE participant_id=? AND question_id=?').run('obsolete',ids[3],q.id);
    assert.equal(surveyStats(db,content).totalCompleted,1);assert.equal(surveyStats(db,content).maxYesCount,2);
  }finally{db.close();}
});

test('拒绝旧游戏答案、旧版问句、未知题、额外个人字段和无效参与ID',()=>{
  const db=responseDatabase(':memory:');
  try{
    for(const body of [{...base,choice:'would'},{...base,version:'old'},{...base,questionId:'hotel-cancel'},{...base,email:'private@example.test'},{...base,participantId:'name'},{...base,sequence:0}]) assert.ok(recordResponse(db,body,content).status>=400);
    assert.equal(db.prepare('SELECT count(*) AS n FROM survey_responses').get().n,0);
  }finally{db.close();}
});

test('跳过单独保存，内容数据库重建不清除调查回答',async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'buchikui-survey-'));
  const file=path.join(dir,'answers.sqlite');let db=responseDatabase(file);
  recordResponse(db,{...base,choice:'skip'},content);db.close();
  await buildContentDatabase(path.join(dir,'content.sqlite'));
  db=responseDatabase(file);
  try{assert.equal(db.prepare('SELECT choice FROM survey_responses').get().choice,'skip');}finally{db.close();}
});
