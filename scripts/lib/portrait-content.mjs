import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const digest=value=>createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const assetId=/^[a-z][a-z0-9-]{0,39}$/;

export function portraitAssetPathSync(id,thumbnail=false,root=ROOT){
  if(!assetId.test(id)) throw new Error(`角色资源键无效：${id}`);
  const name=`${id}${thumbnail?'-thumb':''}`;
  const bytes=readFileSync(path.join(root,'editorial','portrait-assets',`${name}.webp`));
  return `portraits/${name}.${digest(bytes).slice(0,12)}.webp`;
}

export function questionnaireVersion(questions,journeys){
  const versions=new Map(questions.map(q=>[q.id,q.version]));
  return digest(journeys.flatMap(group=>group.questionIds.map(id=>[id,versions.get(id),group.id]))).slice(0,20);
}

export function lessonReviewFingerprint(source,rule,lesson={}){
  return digest([
    [source.id,source.facts,source.holding,source.boundary,source.url,source.issuer||source.court,
      source.issued||source.date,source.verified,source.weight],
    [rule.id,rule.status,rule.text,rule.action],
    [lesson.situation||'',lesson.outcome||'',lesson.boundary||'',lesson.notice||'']
  ]);
}

export function validatePortraitPublication(config,db){
  if(config?.schema!==1||!nonempty(config.rulesVersion)) throw new Error('画像发布配置无效');
  if(!Number.isSafeInteger(config.minAnswered)||config.minAnswered<1||config.minAnsweredPerGroup!==1) throw new Error('画像覆盖门槛无效');
  if(!Array.isArray(config.portraits)||config.portraits.length!==6||!Array.isArray(config.groups)||!Array.isArray(config.lessons)) throw new Error('画像角色、题组或短读不完整');
  const roles=new Set();
  for(const role of config.portraits){
    if(!assetId.test(role.id)||roles.has(role.id)||!['name','description','alt'].every(key=>nonempty(role[key]))||role.image!==role.id||role.thumbnail!==role.id) throw new Error(`角色信息无效：${role.id}`);
    if([...role.name].length>16||[...role.description].length>80) throw new Error(`角色文案过长：${role.id}`);
    roles.add(role.id);
  }
  const groupRows=db.prepare('SELECT id FROM journeys ORDER BY position').all();
  const groups=new Set();
  const mapped=new Set();
  for(const group of config.groups){
    if(groups.has(group.id)||!groupRows.some(row=>row.id===group.id)||!roles.has(group.portraitId)||mapped.has(group.portraitId)) throw new Error(`画像题组映射无效：${group.id}`);
    groups.add(group.id);mapped.add(group.portraitId);
  }
  if(groups.size!==groupRows.length) throw new Error('画像必须覆盖全部题组');
  for(const field of ['tiePortraitId','noReportedPortraitId','insufficientPortraitId']){
    if(!roles.has(config[field])||mapped.has(config[field])) throw new Error(`画像后备角色无效：${field}`);
    mapped.add(config[field]);
  }
  if(mapped.size!==roles.size) throw new Error('画像存在未使用的角色');
  const published=db.prepare('SELECT id FROM published_questions').all();
  if(config.minAnswered>published.length) throw new Error('画像覆盖门槛超过公开题数');
  const lessonIds=new Set(),coveredQuestions=new Set(),introGroups=new Set();
  for(const lesson of config.lessons){
    if(!assetId.test(lesson.id)||lessonIds.has(lesson.id)||!['questionId','caseId','topicSlug','ruleId','situation','outcome','boundary','notice'].every(key=>nonempty(lesson[key]))) throw new Error(`案例短读字段无效：${lesson.id}`);
    if(!Number.isSafeInteger(lesson.priority)||lesson.priority<0||(lesson.introPriority!==null&&(!Number.isSafeInteger(lesson.introPriority)||lesson.introPriority<0))) throw new Error(`案例短读排序无效：${lesson.id}`);
    for(const key of ['situation','outcome','boundary','notice']) if([...lesson[key]].length>180) throw new Error(`案例短读过长：${lesson.id}/${key}`);
    const row=db.prepare(`SELECT q.payload,jq.journey_id FROM published_questions p JOIN questions q ON q.id=p.id
      JOIN journey_questions jq ON jq.question_id=q.id WHERE q.id=?`).get(lesson.questionId);
    if(!row) throw new Error(`案例短读未关联公开题：${lesson.id}`);
    const question=JSON.parse(row.payload);
    if(question.realCaseId!==lesson.caseId||question.caseSlug!==lesson.topicSlug||question.ruleId!==lesson.ruleId) throw new Error(`案例短读与问句关联不符：${lesson.id}`);
    const sourceRow=db.prepare(`SELECT s.payload FROM sources s JOIN real_cases c ON c.id=s.id
      JOIN rule_sources rs ON rs.source_id=s.id WHERE s.id=? AND s.eligible=1 AND c.review_state='verified'
        AND rs.topic_slug=? AND rs.rule_id=?`).get(lesson.caseId,lesson.topicSlug,lesson.ruleId);
    if(!sourceRow) throw new Error(`案例短读来源未通过准入：${lesson.id}`);
    const source=JSON.parse(sourceRow.payload);
    const rule=JSON.parse(db.prepare('SELECT payload FROM authority_rules WHERE topic_slug=? AND id=?').get(lesson.topicSlug,lesson.ruleId).payload);
    if(lesson.reviewedAgainst!==lessonReviewFingerprint(source,rule,lesson)) throw new Error(`案例短读需重新审核：${lesson.id}`);
    lessonIds.add(lesson.id);coveredQuestions.add(lesson.questionId);
    if(lesson.introPriority!==null) introGroups.add(row.journey_id);
  }
  if(published.some(q=>!coveredQuestions.has(q.id))) throw new Error('每道公开题必须有审核后的案例短读');
  if(introGroups.size<2) throw new Error('入门案例短读至少覆盖两个主题');
  if(config.rulesVersion==='portrait-2'){
    if(!Array.isArray(config.mechanisms)||config.mechanisms.length!==3) throw new Error('画像经历机制必须完整配置（3个机制）');
    if(config.minAnsweredPerMechanism!==1) throw new Error('画像经历机制覆盖门槛无效');
  }
  if(config.mechanisms){
    if(!Array.isArray(config.mechanisms)||config.mechanisms.length!==3) throw new Error('画像经历机制不完整');
    const mechIds=new Set(),mechPortraits=new Set(),mechQuestions=new Set();
    const fallbackRoles=new Set([config.tiePortraitId,config.noReportedPortraitId,config.insufficientPortraitId]);
    for(const m of config.mechanisms){
      if(!assetId.test(m.id)||!nonempty(m.name)||!roles.has(m.portraitId)||fallbackRoles.has(m.portraitId)||mechIds.has(m.id)||mechPortraits.has(m.portraitId)||!Array.isArray(m.questionIds)||!m.questionIds.length) throw new Error(`画像经历机制无效：${m?.id}`);
      mechIds.add(m.id);mechPortraits.add(m.portraitId);
      for(const qid of m.questionIds){
        if(!published.some(p=>p.id===qid)||mechQuestions.has(qid)) throw new Error(`画像经历机制题目无效或重复：${qid}`);
        mechQuestions.add(qid);
      }
    }
    if(mechQuestions.size!==published.length) throw new Error('画像经历机制必须完全覆盖所有公开题目且无遗漏');
  }
}

export function publicPortrait(config,questions,journeys,resolveAsset=portraitAssetPathSync){
  const questionMap=new Map(questions.map(q=>[q.id,q]));
  const groupMap=new Map(journeys.flatMap(group=>group.questionIds.map(id=>[id,group.id])));
  const mechMap=new Map(config.mechanisms?.flatMap(m=>m.questionIds.map(id=>[id,m.id]))||[]);
  const lessons=config.lessons.flatMap(lesson=>{
    const question=questionMap.get(lesson.questionId);
    const realCase=question?.analysis.cases.find(item=>item.id===lesson.caseId);
    if(!realCase) return [];
    return [{...Object.fromEntries(['id','questionId','caseId','topicSlug','ruleId','priority','introPriority','situation','outcome','boundary','notice'].map(key=>[key,lesson[key]])),
      groupId:groupMap.get(question.id),mechanismId:mechMap.get(question.id),source:{title:realCase.title,...realCase.source}}];
  });
  const publicData={
    schema:1,rulesVersion:config.rulesVersion,minAnswered:config.minAnswered,minAnsweredPerGroup:config.minAnsweredPerGroup,
    minAnsweredPerMechanism:config.minAnsweredPerMechanism??1,
    groups:config.groups.map(group=>({id:group.id,portraitId:group.portraitId})),
    tiePortraitId:config.tiePortraitId,noReportedPortraitId:config.noReportedPortraitId,insufficientPortraitId:config.insufficientPortraitId,
    portraits:config.portraits.map(role=>({id:role.id,name:role.name,description:role.description,alt:role.alt,
      image:resolveAsset(role.image,false),thumbnail:resolveAsset(role.thumbnail,true)})),lessons
  };
  if(config.mechanisms){
    publicData.mechanisms=config.mechanisms.map(m=>({id:m.id,name:m.name,portraitId:m.portraitId,questionIds:[...m.questionIds]}));
  }
  return publicData;
}
