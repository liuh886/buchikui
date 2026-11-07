import {DatabaseSync} from 'node:sqlite';
import {DATABASE,databaseStats,publicContent} from './lib/content-db.mjs';
const db=new DatabaseSync(DATABASE,{readOnly:true});
try{
  console.log(JSON.stringify({...databaseStats(db),revision:publicContent(db).revision},null,2));
  if(process.argv.includes('--cases')) console.table(db.prepare('SELECT id,topic_slug,review_state,locator FROM real_cases ORDER BY id').all());
  if(process.argv.includes('--questions')) console.table(db.prepare('SELECT id,review_state,real_case_id,editorial_note FROM questions ORDER BY id').all());
}finally{db.close();}
