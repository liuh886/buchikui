import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {ROOT,readPublicContent} from './content-db.mjs';

export const RESPONSE_DATABASE=process.env.SURVEY_RESPONSE_DB||path.join(ROOT,'data','survey.sqlite');
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function responseDatabase(file=RESPONSE_DATABASE){
  mkdirSync(path.dirname(file),{recursive:true});
  const db=new DatabaseSync(file,{timeout:3000});
  db.exec(`CREATE TABLE IF NOT EXISTS survey_responses (
    participant_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    question_version TEXT NOT NULL,
    question_text TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    choice TEXT NOT NULL CHECK(choice IN ('yes','no','skip')),
    client_sequence INTEGER NOT NULL CHECK(client_sequence>0),
    received_at TEXT NOT NULL,
    PRIMARY KEY(participant_id,question_id,question_version)
  ) STRICT;`);
  return db;
}

export function recordResponse(db,body,content){
  const keys=['participantId','questionId','version','choice','sequence'];
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).length!==keys.length||keys.some(k=>!(k in body))) return {status:400,error:'invalid_fields'};
  if(typeof body.participantId!=='string'||!uuid.test(body.participantId)||typeof body.questionId!=='string'||body.questionId.length>100||!['yes','no','skip'].includes(body.choice)||!Number.isSafeInteger(body.sequence)||body.sequence<1) return {status:400,error:'invalid_response'};
  const q=content.questions.find(q=>q.id===body.questionId);
  if(content.mode!=='self-report'||!q||q.version!==body.version) return {status:409,error:'question_updated'};
  const previous=db.prepare('SELECT choice,client_sequence FROM survey_responses WHERE participant_id=? AND question_id=? AND question_version=?').get(body.participantId,q.id,q.version);
  if(previous?.client_sequence===body.sequence&&previous.choice!==body.choice) return {status:409,error:'sequence_conflict'};
  db.prepare(`INSERT INTO survey_responses VALUES (?,?,?,?,?,?,?,?)
    ON CONFLICT(participant_id,question_id,question_version) DO UPDATE SET
      choice=excluded.choice,client_sequence=excluded.client_sequence,received_at=excluded.received_at
    WHERE excluded.client_sequence>survey_responses.client_sequence`).run(body.participantId,q.id,q.version,q.action,q.decisionType,body.choice,body.sequence,new Date().toISOString());
  return {status:200,saved:true};
}

export function surveyStats(db,content){
  const questions=content.questions;
  const versions=new Map(questions.map(q=>[q.id,q.version]));
  const rows=db.prepare('SELECT participant_id,question_id,question_version,choice FROM survey_responses').all();
  const participants=new Map();
  for(const row of rows){
    if(versions.get(row.question_id)!==row.question_version) continue;
    if(!participants.has(row.participant_id)) participants.set(row.participant_id,new Map());
    participants.get(row.participant_id).set(row.question_id,row.choice);
  }
  const complete=[...participants.values()].filter(answers=>answers.size===questions.length&&[...answers.values()].some(choice=>choice!=='skip'));
  const byQuestion=questions.map(q=>({id:q.id,yes:0,no:0,skipped:0}));
  const distribution=Array.from({length:questions.length+1},(_,yesCount)=>({yesCount,responses:0}));
  for(const answers of complete){
    let yesCount=0;
    for(const row of byQuestion){const choice=answers.get(row.id);if(choice==='yes'){row.yes++;yesCount++;}else if(choice==='no')row.no++;else row.skipped++;}
    distribution[yesCount].responses++;
  }
  return {scope:'this-device',totalCompleted:complete.length,byQuestion,distribution,maxYesCount:complete.length?Math.max(...distribution.filter(row=>row.responses).map(row=>row.yesCount)):null};
}

export function handleSurveyStats(req,res){
  res.setHeader('cache-control','no-store');res.setHeader('content-type','application/json; charset=utf-8');
  if(req.method!=='GET'){res.writeHead(405,{'allow':'GET'});res.end(JSON.stringify({error:'method_not_allowed'}));return;}
  let db;
  try{db=responseDatabase();res.end(JSON.stringify(surveyStats(db,readPublicContent())));}catch(error){res.statusCode=503;res.end(JSON.stringify({error:'stats_unavailable'}));}finally{db?.close();}
}

export async function handleSurveyResponse(req,res,pathname){
  res.setHeader('cache-control','no-store');res.setHeader('content-type','application/json; charset=utf-8');res.setHeader('x-content-type-options','nosniff');
  const end=(status,error)=>{res.statusCode=status;res.end(JSON.stringify({error}));};
  if(req.method!=='POST'){res.setHeader('allow','POST');end(405,'method_not_allowed');return;}
  if(req.headers.origin&&req.headers.origin!==`http://${req.headers.host}`){end(403,'origin_not_allowed');return;}
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||'')){end(415,'json_required');return;}
  let size=0;const chunks=[];
  try{
    for await(const chunk of req){size+=chunk.length;if(size>2048){end(413,'too_large');return;}chunks.push(chunk);}
    let body;
    try{body=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch(error){end(400,'invalid_json');return;}
    const db=responseDatabase();
    try{const result=recordResponse(db,body,readPublicContent());res.statusCode=result.status;res.end(JSON.stringify(result));}finally{db.close();}
  }catch(error){if(!res.writableEnded) end(503,'save_unavailable');}
}
