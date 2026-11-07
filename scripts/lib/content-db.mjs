import {DatabaseSync} from 'node:sqlite';
import {readFile,mkdir,rename,rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {loadCorpus,authoritySourceProblems} from './corpus.mjs';
import {loadCases,loadRawCases} from '../prerender-cases.mjs';
import {loadEditorialRules,joinRule} from '../build-authority.mjs';
import {validatePortraitPublication,publicPortrait,questionnaireVersion} from './portrait-content.mjs';

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export const DATABASE=path.join(ROOT,'data','content.sqlite');
const json=value=>JSON.stringify(value);
const readJson=async file=>JSON.parse(await readFile(path.join(ROOT,file),'utf8'));
const publicFields=['id','caseSlug','ruleId','realCaseId','origin','mode','decisionType','stage','action'];

export async function loadContentSeed(){
  const [corpus,topics,rules,game,retired,raw,portrait]=await Promise.all([
    loadCorpus(),loadCases(),loadEditorialRules(),readJson('editorial/game-content.json'),readJson('editorial/retired-questions.json'),loadRawCases(),readJson('editorial/consumer-portraits.json')
  ]);
  const topicSources=raw.cases.flatMap(topic=>(topic.sources||[]).map(s=>({topic:topic.slug,sourceId:s.sourceId})));
  return {sources:[...corpus.values()],topics,topicSources,editorial:rules.editorial,questions:[...game.questions,...retired],journeys:game.journeys,portrait};
}

export function validateQuestion(q){
  if(q.reviewState==='retired') return;
  for(const key of [...publicFields,'reviewState','researchPurpose']){
    if(typeof q[key]!=='string'||!q[key].trim()) throw new Error(`${q.id}: 缺少 ${key}`);
  }
  if(q.mode!=='self-report'||!/^你是否遭遇过：[\s\S]+？$/.test(q.action)) throw new Error(`${q.id}: 必须是实际经历提问`);
  if(!['相信','选择','合作','购买'].includes(q.decisionType)) throw new Error(`${q.id}: 决策类型无效`);
  if([...q.action].length>60) throw new Error(`${q.id}: 问句超过60字`);
  for(const field of ['answer','correctWhy','wrongWhy','outcomeCorrect','outcomeWrong']) if(field in q) throw new Error(`${q.id}: 自述问卷不能设置标准答案`);
}

export async function populateDatabase(db,seed){
  db.exec(await readFile(path.join(ROOT,'database','schema.sql'),'utf8'));
  const corpus=new Map(seed.sources.map(s=>[s.id,s]));
  db.exec('BEGIN IMMEDIATE');
  try{
    const sourceInsert=db.prepare('INSERT INTO sources VALUES (?,?,?,?,?,?,?)');
    for(const source of seed.sources){
      if(source.__parseError) throw new Error(`来源解析失败 ${source.id}`);
      const record={...source};delete record.__file;
      sourceInsert.run(source.id,source.kind,source.title||source.id,source.url||'',source.verified||null,authoritySourceProblems(source).length?0:1,json(record));
    }
    const topicInsert=db.prepare('INSERT INTO topics VALUES (?,?,?)');
    for(const topic of seed.topics) topicInsert.run(topic.slug,topic.name,json(topic));
    const topicSourceInsert=db.prepare('INSERT OR IGNORE INTO topic_sources VALUES (?,?)');
    for(const link of seed.topicSources) topicSourceInsert.run(link.topic,link.sourceId);
    const ruleInsert=db.prepare('INSERT INTO authority_rules VALUES (?,?,?,?)');
    const linkInsert=db.prepare('INSERT INTO rule_sources VALUES (?,?,?)');
    for(const [slug,item] of Object.entries(seed.editorial)) for(const raw of item.rules||[]){
      const rule=joinRule(raw,corpus);
      ruleInsert.run(slug,rule.id,rule.status,json(rule));
      for(const id of raw.sourceIds||[]) linkInsert.run(slug,rule.id,id);
    }
    const caseInsert=db.prepare('INSERT INTO real_cases VALUES (?,?,?,?,?,?,?,?)');
    for(const source of seed.sources.filter(s=>s.kind==='case')){
      const topic=seed.topics.some(t=>t.slug===source.consumerTopic)?source.consumerTopic:(seed.topicSources.find(link=>link.sourceId===source.id)?.topic||null);
      const reviewed=!authoritySourceProblems(source).length&&source.facts&&source.boundary;
      caseInsert.run(source.id,topic,source.locator||source.note||'原文见来源记录',source.facts||'',source.holding||'',source.boundary||source.note||'原案事实和适用边界尚待补充',reviewed?'verified':'collected',json(source.selectionTags||[]));
    }
    const questionInsert=db.prepare('INSERT INTO questions VALUES (?,?,?,?,?,?,?,?)');
    for(const q of seed.questions){
      validateQuestion(q);
      if(q.reviewState==='published'){
        const source=corpus.get(q.realCaseId);
        if(!source||source.kind!=='case'||authoritySourceProblems(source).length||!source.facts||!source.boundary) throw new Error(`${q.id}: 未核验真实案例不能发布`);
        if(q.origin!=='case-inspired-survey') throw new Error(`${q.id}: 问卷类型无效`);
        const linked=db.prepare('SELECT 1 FROM rule_sources WHERE topic_slug=? AND rule_id=? AND source_id=?').get(q.caseSlug,q.ruleId,q.realCaseId);
        if(!linked) throw new Error(`${q.id}: 真实案例必须直接支持对应规则`);
      }
      questionInsert.run(q.id,q.caseSlug,q.ruleId,q.realCaseId||null,q.origin,q.reviewState,q.researchPurpose||q.misconception||'旧版判断题',json(q));
    }
    const journeyInsert=db.prepare('INSERT INTO journeys VALUES (?,?,?)');
    const assignment=db.prepare('INSERT INTO journey_questions VALUES (?,?,?)');
    for(const [position,journey] of seed.journeys.entries()){
      if(!journey.questionIds?.length) throw new Error(`${journey.id}: 空情境组`);
      journeyInsert.run(journey.id,position,json(journey));
      for(const [i,id] of journey.questionIds.entries()){
        if(!db.prepare('SELECT 1 FROM published_questions WHERE id=?').get(id)) throw new Error(`${id}: 未通过公开准入`);
        assignment.run(journey.id,id,i);
      }
    }
    const orphan=db.prepare("SELECT id FROM published_questions WHERE id NOT IN (SELECT question_id FROM journey_questions)").all();
    if(orphan.length) throw new Error(`已审核题没有编排：${orphan.map(r=>r.id).join(',')}`);
    validatePortraitPublication(seed.portrait,db);
    db.prepare('INSERT INTO portrait_publications VALUES (1,?)').run(json(seed.portrait));
    if(db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('内容关系校验失败');
    db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
}

export function publicContent(db){
  const journeys=db.prepare('SELECT id,payload FROM journeys ORDER BY position').all().map(row=>{
    const journey=JSON.parse(row.payload);
    const ids=db.prepare('SELECT jq.question_id FROM journey_questions jq JOIN published_questions p ON p.id=jq.question_id WHERE jq.journey_id=? ORDER BY jq.position').all(row.id).map(r=>r.question_id);
    return {...journey,questionIds:ids};
  }).filter(j=>j.questionIds.length);
  const rows=db.prepare('SELECT p.payload FROM published_questions p JOIN journey_questions jq ON jq.question_id=p.id JOIN journeys j ON j.id=jq.journey_id ORDER BY j.position,jq.position').all();
  const questions=rows.map(row=>{
    const q=JSON.parse(row.payload);
    const question=Object.fromEntries(publicFields.map(key=>[key,q[key]]));
    const rule=JSON.parse(db.prepare('SELECT payload FROM authority_rules WHERE topic_slug=? AND id=?').get(q.caseSlug,q.ruleId).payload);
    const cases=db.prepare(`SELECT s.payload FROM rule_sources rs
      JOIN sources s ON s.id=rs.source_id JOIN real_cases c ON c.id=s.id
      WHERE rs.topic_slug=? AND rs.rule_id=? AND s.eligible=1 AND c.review_state='verified'
        AND c.facts<>'' AND c.boundary<>'' ORDER BY s.id`).all(q.caseSlug,q.ruleId).map(row=>{
      const source=JSON.parse(row.payload);
      return {id:source.id,title:source.title,facts:source.facts,holding:source.holding,boundary:source.boundary,
        source:{href:source.url,publisher:source.issuer||source.court,type:source.weight,published:source.issued||source.date,verified:source.verified,locator:source.locator||''}};
    });
    const analysis={title:rule.title,explanation:rule.text,reminder:rule.action,cases};
    return {...question,analysis,version:createHash('sha256').update(json([q.id,q.action,q.decisionType])).digest('hex').slice(0,20)};
  });
  const portraitConfig=JSON.parse(db.prepare('SELECT payload FROM portrait_publications WHERE id=1').get().payload);
  const payload={schema:3,mode:'self-report',questionnaireVersion:questionnaireVersion(questions,journeys),questions,journeys,
    portrait:publicPortrait(portraitConfig,questions,journeys)};
  const basis=db.prepare('SELECT topic_slug,id,payload FROM authority_rules ORDER BY topic_slug,id').all();
  return {...payload,revision:createHash('sha256').update(json([payload,basis])).digest('hex').slice(0,20)};
}

export function databaseStats(db){
  return {sources:db.prepare('SELECT count(*) AS n FROM sources').get().n,topics:db.prepare('SELECT count(*) AS n FROM topics').get().n,realCases:db.prepare('SELECT count(*) AS n FROM real_cases').get().n,rules:db.prepare('SELECT count(*) AS n FROM authority_rules').get().n,questions:db.prepare('SELECT review_state,count(*) AS count FROM questions GROUP BY review_state').all(),casesByReview:db.prepare('SELECT review_state,count(*) AS count FROM real_cases GROUP BY review_state').all()};
}

export async function buildContentDatabase(target=DATABASE,seed){
  await mkdir(path.dirname(target),{recursive:true});
  const temp=`${target}.${process.pid}.tmp`;
  const db=new DatabaseSync(temp);
  try{
    await populateDatabase(db,seed||await loadContentSeed());
    const result={content:publicContent(db),stats:databaseStats(db)};
    db.close();
    await rename(temp,target);
    return result;
  }catch(error){
    if(db.isOpen) db.close();
    await rm(temp,{force:true});
    throw error;
  }
}

export function readPublicContent(file=DATABASE){
  const db=new DatabaseSync(file,{readOnly:true});
  try{return publicContent(db);}finally{db.close();}
}

export function readDatabaseTopics(file=DATABASE){
  const db=new DatabaseSync(file,{readOnly:true});
  try{return db.prepare('SELECT payload FROM topics ORDER BY slug').all().map(row=>JSON.parse(row.payload));}finally{db.close();}
}
