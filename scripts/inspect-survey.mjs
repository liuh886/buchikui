import {responseDatabase} from './lib/survey-responses.mjs';
const db=responseDatabase();
try{
  console.log('本机自述记录，仅描述这些问句的回答，不代表总体吃亏率。');
  console.table(db.prepare(`SELECT question_text AS question,question_version AS version,
    sum(choice='yes') AS yes,sum(choice='no') AS no,sum(choice='skip') AS skipped
    FROM survey_responses GROUP BY question_id,question_version ORDER BY question_id`).all());
}finally{db.close();}
