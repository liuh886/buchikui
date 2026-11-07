(function(root){
  'use strict';
  const questions=root.BUCHIKUI_CONTENT?.questions||[];
  const journeys=root.BUCHIKUI_CONTENT?.journeys||[];
  let content=root.BUCHIKUI_CONTENT||{};
  const find=id=>questions.find(q=>q.id===id);
  const current=state=>find(state?.order?.[state.index]);
  const groupFor=q=>journeys.find(j=>j.questionIds.includes(q?.id));
  const fingerprint=q=>q?.version||'';
  function ruleFor(q,authority){return q&&(authority?.getRules(q.caseSlug)||[]).find(rule=>rule.id===q.ruleId)||null;}
  function start(){
    const ids=journeys.flatMap(j=>j.questionIds);
    return {schema:3,questionnaireVersion:content.questionnaireVersion,portraitRulesSeen:content.portrait?.rulesVersion,order:ids,index:0,responses:[],versions:ids.map(id=>fingerprint(find(id)))};
  }
  function restore(saved){
    const fresh=start();
    if(![2,3].includes(saved?.schema)||!Array.isArray(saved.responses)||!Array.isArray(saved.versions)||!Array.isArray(saved.order)||!Number.isInteger(saved.index)||saved.index<0||saved.index>saved.order.length) return {state:fresh,notice:''};
    if(saved.responses.length!==saved.index||saved.responses.some((r,i)=>!r||r.questionId!==saved.order[i]||!['yes','no','skip'].includes(r.choice)||r.version!==saved.versions[i])) return {state:start(),notice:''};
    if(saved.order[0]!==fresh.order[0]) return {state:fresh,notice:'从完整问卷开始生成角色，先前记录仍保留在本机。'};
    const changed=fresh.order.findIndex((id,i)=>i<=saved.index&&(id!==saved.order[i]||fresh.versions[i]!==saved.versions[i]));
    if(changed>=0) return {state:{...fresh,index:changed,responses:saved.responses.slice(0,changed)},notice:'问卷内容已更新，从变更的问题继续。'};
    const index=Math.min(saved.index,fresh.order.length);
    const updated=saved.schema===3&&saved.questionnaireVersion!==fresh.questionnaireVersion;
    return {state:{...fresh,index,responses:saved.responses.slice(0,index).map(r=>({...r}))},notice:updated?'问卷题组已更新，角色按当前题组生成。':saved.portraitRulesSeen&&saved.portraitRulesSeen!==fresh.portraitRulesSeen?'画像规则已更新，回答没有改变。':''};
  }
  function respond(state,choice,questionId){
    const q=current(state);
    if(!q||q.id!==questionId||!['yes','no','skip'].includes(choice)) return state;
    if(state.versions[state.index]!==fingerprint(q)) return restore(state).state;
    return {...state,index:state.index+1,responses:[...state.responses,{questionId:q.id,version:fingerprint(q),choice}]};
  }
  function previous(state){
    if(!state||state.index<1) return state;
    return {...state,index:state.index-1,responses:state.responses.slice(0,-1)};
  }
  function validate(){
    const errors=[],seen=new Set();
    if(root.BuchikuiPortrait) errors.push(...root.BuchikuiPortrait.validate({...content,questions,journeys}));
    if(errors.length)return errors;
    for(const q of questions){
      if(seen.has(q.id)) errors.push(`重复题号 ${q.id}`);seen.add(q.id);
      if(q.mode!=='self-report'||!/^你是否遭遇过：[\s\S]+？$/.test(q.action||'')) errors.push(`${q.id}: 必须统一提问实际经历`);
      if(!['相信','选择','合作','购买'].includes(q.decisionType)) errors.push(`${q.id}: 决策类型无效`);
      if([...(q.action||'')].length>60) errors.push(`${q.id}: 问句超过60字`);
      if(!q.version||!q.realCaseId||!q.caseSlug||!q.ruleId||!q.stage) errors.push(`${q.id}: 内容信息不完整`);
      const analysis=q.analysis;
      if(!analysis||!['title','explanation','reminder'].every(key=>typeof analysis[key]==='string'&&analysis[key].trim())||!Array.isArray(analysis.cases)||!analysis.cases.length){
        errors.push(`${q.id}: 缺少案例解析`);
      }else for(const item of analysis.cases){
        if(!['id','title','facts','holding','boundary'].every(key=>typeof item?.[key]==='string'&&item[key].trim())||!['href','publisher','type','published','verified'].every(key=>typeof item.source?.[key]==='string'&&item.source[key].trim())) errors.push(`${q.id}: 案例解析信息不完整`);
        try{if(!['http:','https:'].includes(new URL(item.source?.href).protocol)) throw new Error();}catch(error){errors.push(`${q.id}: 案例出处无效`);}
      }
      for(const field of ['answer','correctWhy','wrongWhy','outcomeCorrect','outcomeWrong']) if(field in q) errors.push(`${q.id}: 问卷不得设置标准答案或判分解释`);
    }
    const assigned=journeys.flatMap(j=>j.questionIds||[]);
    if(new Set(assigned).size!==questions.length||assigned.length!==questions.length||assigned.some(id=>!find(id))) errors.push('问卷编排必须完整且不重复');
    if(!questions.length||!journeys.length||new Set(journeys.map(j=>j.id)).size!==journeys.length) errors.push('问卷分组无效');
    for(const group of journeys){
      for(const field of ['id','title','caseSlug','chapterTitle']) if(typeof group[field]!=='string'||!group[field].trim()) errors.push('问卷分组信息不完整');
      if(!Array.isArray(group.questionIds)||!group.questionIds.length) errors.push('问卷分组不能为空');
    }
    return errors;
  }
  function installContent(data){
    if(data?.schema!==3||data.mode!=='self-report'||!Array.isArray(data.questions)||!Array.isArray(data.journeys)||!root.BuchikuiPortrait||root.BuchikuiPortrait.validate(data).length) return false;
    const oldQuestions=[...questions],oldJourneys=[...journeys],oldContent=content;
    try{
      const copy=JSON.parse(JSON.stringify(data));
      content=copy;
      questions.splice(0,questions.length,...copy.questions);journeys.splice(0,journeys.length,...copy.journeys);
      if(validate().length) throw new Error('Invalid survey');
      root.BUCHIKUI_CONTENT={...content,questions,journeys};return true;
    }catch(error){content=oldContent;questions.splice(0,questions.length,...oldQuestions);journeys.splice(0,journeys.length,...oldJourneys);return false;}
  }
  root.BuchikuiSurvey={questions,journeys,find,current,groupFor,fingerprint,ruleFor,start,restore,respond,previous,validate,installContent,getContent:()=>({...content,questions,journeys})};
})(typeof window!=='undefined'?window:globalThis);
