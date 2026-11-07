(function(root){
  'use strict';
  const choices=new Set(['yes','no','skip']);
  function validate(content){
    try{return validateContent(content);}catch(error){return ['画像载荷结构无效'];}
  }
  function validateContent(content){
    const p=content?.portrait,errors=[];
    if(content?.schema!==3||!content.questionnaireVersion||!p||p.schema!==1) return ['画像内容版本不完整'];
    if(!Array.isArray(content.questions)||!Array.isArray(content.journeys)||!Array.isArray(p.portraits)||!Array.isArray(p.groups)||!Array.isArray(p.lessons))return ['画像集合结构无效'];
    const questions=content.questions,groups=content.journeys;
    if(!questions.length||!groups.length||questions.some(q=>!q||typeof q.id!=='string')||groups.some(g=>!g||!Array.isArray(g.questionIds)||!g.questionIds.length))return ['画像问卷结构无效'];
    const ids=new Set((p.portraits||[]).map(r=>r.id));
    if(ids.size!==6||(p.portraits||[]).length!==6) errors.push('角色必须完整且不重复');
    if(!p.rulesVersion||!Number.isInteger(p.minAnswered)||p.minAnswered<1||p.minAnswered>questions.length||p.minAnsweredPerGroup!==1) errors.push('角色覆盖规则无效');
    if(![p.tiePortraitId,p.noReportedPortraitId,p.insufficientPortraitId].every(id=>ids.has(id))) errors.push('缺少回退角色');
    if(!Array.isArray(p.groups)||p.groups.length!==groups.length||new Set(p.groups.map(g=>g.id)).size!==groups.length||p.groups.some(g=>!groups.some(j=>j.id===g.id)||!ids.has(g.portraitId))) errors.push('角色主题无效');
    if(p.rulesVersion==='portrait-2'||p.mechanisms){
      if(!Array.isArray(p.mechanisms)||p.mechanisms.length!==3) errors.push('画像经历机制不完整');
      if(p.minAnsweredPerMechanism!==undefined&&p.minAnsweredPerMechanism!==1) errors.push('画像经历机制覆盖门槛无效');
      const mechIds=new Set(),mechRoles=new Set(),mechQids=new Set();
      const fallbackRoles=new Set([p.tiePortraitId,p.noReportedPortraitId,p.insufficientPortraitId]);
      for(const m of (Array.isArray(p.mechanisms)?p.mechanisms:[])){
        if(!m||typeof m.id!=='string'||!m.id.trim()||typeof m.name!=='string'||!m.name.trim()||!ids.has(m.portraitId)||fallbackRoles.has(m.portraitId)) errors.push('画像经历机制定义无效');
        if(mechIds.has(m.id)||mechRoles.has(m.portraitId)) errors.push('画像经历机制重复');
        mechIds.add(m.id);mechRoles.add(m.portraitId);
        if(!Array.isArray(m.questionIds)||!m.questionIds.length) errors.push('画像经历机制题目为空');
        for(const qid of (Array.isArray(m.questionIds)?m.questionIds:[])){
          if(!questions.some(q=>q.id===qid)||mechQids.has(qid)) errors.push(`画像经历机制题目无效或重复：${qid}`);
          mechQids.add(qid);
        }
      }
      if(mechQids.size!==questions.length) errors.push('画像经历机制题目未完全覆盖公开题目');
    }
    for(const r of p.portraits||[]){
      if(!['name','description','alt'].every(k=>typeof r[k]==='string'&&r[k].trim())) errors.push('角色文字不完整');
      if(!/^portraits\/[a-z-]+\.[a-f0-9]{12}\.webp$/.test(r.image||'')||!/^portraits\/[a-z-]+\.[a-f0-9]{12}\.webp$/.test(r.thumbnail||'')) errors.push('角色资源路径无效');
    }
    if(!Array.isArray(p.lessons)||!p.lessons.length) errors.push('缺少案例回报');
    for(const lesson of p.lessons||[]){
      const q=questions.find(q=>q.id===lesson.questionId);
      if(!q||q.ruleId!==lesson.ruleId||q.caseSlug!==lesson.topicSlug||!q.analysis?.cases?.some(c=>c.id===lesson.caseId)||!groups.some(g=>g.id===lesson.groupId&&g.questionIds.includes(q.id))) errors.push('案例回报关联无效');
      if(p.mechanisms&&lesson.mechanismId&&!p.mechanisms.some(m=>m.id===lesson.mechanismId&&m.questionIds.includes(lesson.questionId))) errors.push('案例回报机制关联无效');
      if(!['id','situation','outcome','boundary','notice'].every(k=>typeof lesson[k]==='string'&&lesson[k].trim())) errors.push('案例回报不完整');
      try{if(!['https:','http:'].includes(new URL(lesson.source?.href).protocol)) throw new Error();}catch(error){errors.push('案例出处无效');}
    }
    return errors;
  }
  function calculate(content,state){
    if(validate(content).length) return {status:'unavailable',reasonQuestionIds:[]};
    const p=content.portrait,questions=content.questions,order=content.journeys.flatMap(g=>g.questionIds);
    const responses=state?.responses||[];
    if(state?.index!==order.length||JSON.stringify(state.order)!==JSON.stringify(order)||responses.length!==order.length) return {status:'in-progress',reasonQuestionIds:[]};
    const map=new Map();
    for(const r of responses){
      const q=questions.find(q=>q.id===r.questionId);
      if(!q||map.has(q.id)||q.version!==r.version||!choices.has(r.choice)) return {status:'unavailable',reasonQuestionIds:[]};
      map.set(q.id,r.choice);
    }
    const answeredCount=responses.filter(r=>r.choice!=='skip').length,skippedCount=responses.length-answeredCount;
    const result={status:'classified',rulesVersion:p.rulesVersion,questionnaireVersion:content.questionnaireVersion,answeredCount,skippedCount,reasonQuestionIds:[]};
    const dimensions=Array.isArray(p.mechanisms)&&p.mechanisms.length?p.mechanisms.map(m=>({
      id:m.id,name:m.name,portraitId:m.portraitId,questionIds:m.questionIds,total:m.questionIds.length,
      answered:m.questionIds.filter(id=>map.get(id)!=='skip').length,
      yes:m.questionIds.filter(id=>map.get(id)==='yes')
    })):content.journeys.map(g=>({
      id:g.id,name:g.id,portraitId:p.groups.find(item=>item.id===g.id)?.portraitId,questionIds:g.questionIds,total:g.questionIds.length,
      answered:g.questionIds.filter(id=>map.get(id)!=='skip').length,
      yes:g.questionIds.filter(id=>map.get(id)==='yes')
    }));
    const minPerDim=p.minAnsweredPerMechanism??p.minAnsweredPerGroup??1;
    if(answeredCount<p.minAnswered||dimensions.some(d=>d.answered<minPerDim)) return {...result,status:'insufficient',portraitId:p.insufficientPortraitId};
    if(!dimensions.some(d=>d.yes.length)) return {...result,status:'no-reported',portraitId:p.noReportedPortraitId};
    let best=[];
    for(const d of dimensions){
      const comparison=best.length?d.yes.length*best[0].total-best[0].yes.length*d.total:1;
      if(comparison>0) best=[d];else if(comparison===0) best.push(d);
    }
    const isTie=best.length>1;
    return {
      ...result,
      isTie,
      portraitId:isTie?p.tiePortraitId:best[0].portraitId,
      dominantDimension:isTie?null:best[0],
      winningMechanisms:best.map(d=>({id:d.id,name:d.name,portraitId:d.portraitId,yes:d.yes})),
      reasonQuestionIds:best.flatMap(d=>d.yes)
    };
  }
  function lessons(content,state){
    if(validate(content).length) return [];
    const yes=new Set((state?.responses||[]).filter(r=>r.choice==='yes'&&content.questions.some(q=>q.id===r.questionId&&q.version===r.version)).map(r=>r.questionId));
    const calc=calculate(content,state);
    const reasonIds=calc.reasonQuestionIds||[];
    const allLessons=content.portrait.lessons||[];
    const lessonByQ=new Map(allLessons.map(l=>[l.questionId,l]));
    const order=new Map(content.questions.map((q,i)=>[q.id,i]));
    const compare=field=>(a,b)=>(a[field]??1000)-(b[field]??1000)||(order.get(a.questionId)-order.get(b.questionId))||a.id.localeCompare(b.id);
    const selected=[],cases=new Set(),rules=new Set();
    function canAdd(lesson){
      if(!lesson) return false;
      const ruleKey=`${lesson.topicSlug}/${lesson.ruleId}`;
      return selected.length<2&&!cases.has(lesson.caseId)&&!rules.has(ruleKey);
    }
    function add(lesson,matched){
      if(!canAdd(lesson)) return false;
      selected.push({...lesson,matched:!!matched});
      cases.add(lesson.caseId);
      rules.add(`${lesson.topicSlug}/${lesson.ruleId}`);
      return true;
    }
    if(calc.isTie&&Array.isArray(calc.winningMechanisms)&&calc.winningMechanisms.length>=2){
      const win1Lessons=calc.winningMechanisms[0].yes.map(id=>lessonByQ.get(id)).filter(Boolean).sort(compare('priority'));
      for(const l of win1Lessons){ if(add(l,true)) break; }
      const win2Lessons=calc.winningMechanisms[1].yes.map(id=>lessonByQ.get(id)).filter(Boolean);
      const win2DiffGroup=win2Lessons.filter(l=>l.groupId!==selected[0]?.groupId).sort(compare('priority'));
      if(win2DiffGroup.length){
        for(const l of win2DiffGroup){ if(add(l,true)) break; }
      }
      if(selected.length<2){
        for(const l of win2Lessons.sort(compare('priority'))){ if(add(l,true)) break; }
      }
    }else{
      const reasonLessons=reasonIds.map(id=>lessonByQ.get(id)).filter(Boolean).sort(compare('priority'));
      for(const l of reasonLessons){ if(add(l,true)) break; }
    }
    const otherYes=allLessons.filter(l=>yes.has(l.questionId)&&canAdd(l));
    const diffGroupYes=otherYes.filter(l=>l.groupId!==selected[0]?.groupId).sort(compare('priority'));
    if(diffGroupYes.length) add(diffGroupYes[0],true);
    else if(otherYes.length) add(otherYes.sort(compare('priority'))[0],true);
    while(selected.length<2){
      const intros=allLessons.filter(l=>Number.isFinite(l.introPriority)&&canAdd(l));
      if(!intros.length) break;
      const diffGroupIntro=intros.filter(l=>l.groupId!==selected[0]?.groupId).sort(compare('introPriority'));
      if(diffGroupIntro.length) add(diffGroupIntro[0],false);
      else add(intros.sort(compare('introPriority'))[0],false);
    }
    return selected;
  }
  root.BuchikuiPortrait={validate,calculate,lessons};
})(typeof window!=='undefined'?window:globalThis);
