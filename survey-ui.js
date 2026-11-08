(function(){
  'use strict';
  const S=window.BuchikuiSurvey,R=window.BuchikuiRender;
  const KEY='buchikui-survey-v1';
  const local=['localhost','127.0.0.1','[::1]'].includes(location.hostname);
  function read(){
    for(const name of ['localStorage','sessionStorage']){
      try{const data=JSON.parse(window[name].getItem(KEY));if(data?.schema===1&&data.participantId) return data;}catch(error){}
    }
    return null;
  }
  function write(data){
    let stored=false;
    for(const name of ['localStorage','sessionStorage']) try{window[name].setItem(KEY,JSON.stringify(data));stored=true;}catch(error){}
    return stored;
  }
  async function mount({app,base}){
    const esc=R.esc;
    app.innerHTML='<section class="game-shell"><div class="scenario-card game-message" role="status"><p>正在打开问卷……</p></div></section>';
    if(local){
      try{
        const response=await fetch(`${base}api/content`,{cache:'no-store',signal:AbortSignal.timeout(2500)});
        if(response.ok&&response.headers.get('content-type')?.includes('application/json')) S.installContent(await response.json());
      }catch(error){/* 静态快照支持离线填写。 */}
    }
    if(document.body.dataset.page!=='home') return;
    if(S.validate().length){
      app.innerHTML=`<section class="game-shell"><div class="scenario-card game-message"><h1>问卷暂时未能打开。</h1><a class="game-link" href="${esc(base)}?view=library">先读消费案例</a></div></section>`;return;
    }
    const stored=read();
    const data=stored||{schema:1,participantId:crypto.randomUUID(),sequence:0,records:{},pending:{}};
    data.records ||= {};data.pending ||= {};
    const params=new URLSearchParams(location.search),requested=S.find(params.get('question'));
    let entry=history.state?.surveyEntry||'';
    let notice='',state;
    if(requested&&(!entry||entry!==data.entry)){
      state=S.start();notice='从完整问卷开始生成角色，也可以先看这题的案例。';entry=crypto.randomUUID();
      history.replaceState({...history.state,surveyEntry:entry},'',location.href);
    }else{const restored=S.restore(data.state);state=restored.state;notice=restored.notice;}
    if(params.has('question')&&!requested){state=S.start();notice='问卷内容已调整，从当前问题开始。';}
    let busy=false,syncing=false,drag=null;
    const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const save=()=>{
      data.state=state;data.entry=entry;data.scrollY=window.scrollY;
      const ok=write(data);
      if(!ok) notice='当前浏览器未允许保存，离开页面后回答可能丢失。';
      return ok;
    };
    const basis=q=>`${base}c/${q.caseSlug}/#rule-${q.ruleId}`;
    const shareUrl=()=>new URL(base,location.origin).href;
    const issueUrl=q=>{
      const url=new URL('https://github.com/liuh886/buchikui/issues/new');
      url.searchParams.set('title',`问卷文字反馈：${q.id}`);
      url.searchParams.set('body',`问卷题号：${q.id}\n问句：${q.action}\n版本：${q.version}\n\n请说明措辞、理解或来源问题。请勿填写自己的回答、订单号或其他个人信息。`);
      return url.href;
    };
    app.innerHTML='<section class="game-shell survey-shell" aria-label="消费经历调研"><div id="surveyViewport"></div><p class="sr-only" id="surveyStatus" role="status" aria-live="polite" aria-atomic="true"></p></section><dialog class="survey-analysis" id="surveyAnalysis" aria-labelledby="analysisTitle"></dialog>';
    const viewport=document.getElementById('surveyViewport'),announcer=document.getElementById('surveyStatus');
    const analysisDialog=document.getElementById('surveyAnalysis');
    function openAnalysis(questionId){
      const q=questionId?S.find(questionId):S.current(state),analysis=q?.analysis;
      if(!analysis?.cases?.length||busy) return;
      resetDrag();
      const cases=analysis.cases.map(item=>`<article class="analysis-case"><h3>${esc(item.title)}</h3><p class="analysis-meta">${esc(item.source.type)} · ${esc(item.source.publisher)}</p><h4>发生了什么</h4><p>${esc(item.facts)}</p><h4>处理结果</h4><p>${esc(item.holding)}</p><h4>适用边界</h4><p>${esc(item.boundary)}</p><p class="analysis-source"><a href="${esc(item.source.href)}" target="_blank" rel="noopener">查看原始出处</a><span>${esc(item.source.locator)} · 发布 ${esc(item.source.published)} · 核验 ${esc(item.source.verified)}</span></p></article>`).join('');
      analysisDialog.innerHTML=`<div class="analysis-toolbar"><span>${esc(q.stage)} · 案例解析</span><button type="button" class="text-button" data-close-analysis aria-label="关闭案例解析">关闭</button></div><div class="analysis-body"><h2 id="analysisTitle" tabindex="-1" autofocus>${esc(analysis.title)}</h2>${cases}<section class="analysis-reading"><h3>看懂这件事</h3><p>${esc(analysis.explanation)}</p><h3>遇到类似情况</h3><p>${esc(analysis.reminder)}</p></section><a class="analysis-chapter" href="${esc(basis(q))}">继续阅读这一章</a><button class="text-button analysis-return" type="button" data-close-analysis>返回当前问题</button></div>`;
      analysisDialog.showModal();
      analysisDialog.scrollTop=0;
    }
    analysisDialog.addEventListener('click',event=>{
      if(event.target.closest('[data-close-analysis],.analysis-chapter')) analysisDialog.close();
      if(event.target===analysisDialog){const rect=analysisDialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) analysisDialog.close();}
    });
    analysisDialog.addEventListener('keydown',event=>{
      if(event.key!=='Tab') return;
      const controls=[...analysisDialog.querySelectorAll('a[href],button:not([disabled])')];
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&event.target===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&event.target===last){event.preventDefault();first?.focus();}
    });
    function personalSummary(){
      const yes=state.responses.filter(r=>r.choice==='yes').length,no=state.responses.filter(r=>r.choice==='no').length,skipped=state.responses.filter(r=>r.choice==='skip').length;
      const groups=S.journeys.map(group=>{
        const responses=state.responses.filter(r=>group.questionIds.includes(r.questionId));
        if(!responses.length) return '';
        const count=responses.filter(r=>r.choice==='yes').length;
        return `<div class="survey-stat-row"><span>${esc(group.title)}</span><meter min="0" max="${responses.length}" value="${count}" aria-label="${esc(group.title)}：${count}项有过，${responses.length}项已记录"></meter><small>${count}项有过</small></div>`;
      }).join('');
      return `<p class="survey-summary-number">有过 <strong>${yes}</strong> 项</p><p class="survey-summary-counts">没有过 ${no} 项 · 暂不回答 ${skipped} 项</p><div class="survey-stat-list">${groups}</div>`;
    }
    async function showAggregate(){
      const host=document.getElementById('surveyAggregate');if(!host) return;
      if(!local){host.innerHTML='<p>当前展示这份答卷的统计。其他答卷尚未接入集中收集。</p>';return;}
      try{
        const response=await fetch(`${base}api/survey-stats`,{cache:'no-store',signal:AbortSignal.timeout(2500)});if(!response.ok) throw new Error('Stats unavailable');
        const stats=await response.json();
        if(S.current(state)||!document.getElementById('surveyAggregate')) return;
        if(stats.scope!=='this-device'||!Number.isInteger(stats.totalCompleted)||!Array.isArray(stats.distribution)||!Array.isArray(stats.byQuestion)) throw new Error('Invalid stats');
        if(!stats.totalCompleted){host.innerHTML='<p>本机还没有覆盖整份问卷、且至少回答一题的答卷。这里只展示实际收集的记录。</p>';return;}
        const common=stats.byQuestion.filter(row=>row.yes>0&&S.find(row.id)).sort((a,b)=>b.yes-a.yes).slice(0,3).map(row=>`<li>${esc(S.find(row.id).stage)}<span>${row.yes}份答卷有过</span></li>`).join('');
        const rows=stats.distribution.map(row=>`<div class="survey-stat-row"><span>${row.yesCount}项</span><meter min="0" max="${stats.totalCompleted}" value="${row.responses}" aria-label="记录${row.yesCount}项遭遇的答卷：${row.responses}份"></meter><small>${row.responses}份</small></div>`).join('');
        host.innerHTML=`<p>本机已记录 <strong>${stats.totalCompleted}</strong> 份完整答卷，最多的一份记录了 <strong>${stats.maxYesCount}</strong> 项相似遭遇。</p>${common?`<h3>这些遭遇更常被提到</h3><ul class="survey-common">${common}</ul>`:''}<h3>每份答卷记录了多少项</h3><div class="survey-stat-list">${rows}</div><p class="survey-sample-note">仅汇总本机完整答卷的当前版本；暂不回答单独记录。这是答卷分布，不代表总体发生率。</p>`;
      }catch(error){if(document.getElementById('surveyAggregate')) host.innerHTML='<p>当前展示这份答卷的统计。本机汇总暂未能读取。</p>';}
    }
    function render(focus=false){
      const q=S.current(state);
      const back=state.index>0?'<button class="text-button" type="button" data-previous>上一题</button>':'';
      if(!q){
        const references=S.journeys.map(j=>`<li><a href="${esc(base)}c/${esc(j.caseSlug)}/">${esc(j.chapterTitle)}</a></li>`).join('');
        const content=S.getContent(),result=window.BuchikuiPortrait.calculate(content,state);
        const portrait=content.portrait?.portraits.find(p=>p.id===result.portraitId);
        const lessons=window.BuchikuiPortrait.lessons(content,state);
        const reasonDesc={
          otter:'本次记录中，说好的与实际给的出现了落差。',
          capybara:'本次记录中，原本约定好的安排被单方面调整。',
          raccoon:'本次记录中，预付的权益与未做项目在结算退订时遇到了阻碍。',
          fox:result.winningMechanisms?.length>=2?`在「${result.winningMechanisms.map(m=>m.name).join('」与「')}」等经历维度上，都有相似的波折线索。`:'几组不同的消费经历，在这次答卷里都留下了波折线索。',
          bird:'这次列出的常见消费波折，你暂时都没有报告过。',
          cloud:'有效回答还不够，先不替你归类。你依然可以带走下方的真实案例。'
        };
        const reason=reasonDesc[portrait?.id]||(result.status==='insufficient'?reasonDesc.cloud:result.status==='no-reported'?reasonDesc.bird:'这份消费经历已经记下。');
        const primaryLesson=lessons[0];
        const reasonList=result.isTie&&result.winningMechanisms?.length>=2
          ? result.winningMechanisms.map(m=>`<li><strong>【${esc(m.name)}】</strong>${m.yes.map(id=>esc(S.find(id).action.slice('你是否遭遇过：'.length))).join('；')}</li>`).join('')
          : result.reasonQuestionIds?.map(id=>`<li>${esc(S.find(id).action.slice('你是否遭遇过：'.length))}</li>`).join('');
        const lessonHtml=lessons.map((lesson,i)=>`<article class="portrait-lesson"><p class="portrait-eyebrow">${lesson.matched?'从你勾选的经历出发':'一则可以先认识的真实案例'} · ${String(i+1).padStart(2,'0')}</p><h3>${esc(lesson.situation)}</h3><p><strong>原案怎么处理</strong>${esc(lesson.outcome)}</p><p class="lesson-boundary">${esc(lesson.boundary)}</p><div class="lesson-notice"><span>下次留意</span><p>${esc(lesson.notice)}</p></div><div class="lesson-links"><button class="text-button" type="button" data-lesson-analysis="${esc(lesson.questionId)}">读完整案例</button><a href="${esc(lesson.source.href)}" target="_blank" rel="noopener">原始出处 ↗</a></div><p class="lesson-source">${esc(lesson.source.publisher)} · ${esc(lesson.source.type)} · 核验 ${esc(lesson.source.verified)}</p></article>`).join('');
        viewport.innerHTML=`${notice?`<p class="game-notice" role="status">${esc(notice)}</p>`:''}<article class="portrait-result" data-portrait="${esc(portrait?.id||'unavailable')}"><header class="portrait-hero"><p class="portrait-eyebrow">不吃亏 · 你的消费经历角色</p>${portrait?`<div class="portrait-art"><img src="${esc(base+portrait.image)}" alt="${esc(portrait.alt)}" width="512" height="512"><span class="portrait-art-fallback" hidden>一张属于你的角色卡</span></div><h1 tabindex="-1">${esc(portrait.name)}</h1><p class="portrait-description">${esc(portrait.description)}</p>`:'<h1 tabindex="-1">这份经历，已经记下。</h1><p>角色暂未能生成，你的回答仍保留。</p>'}<p class="portrait-reason">${esc(reason)}</p>${result.skippedCount?`<p class="portrait-coverage">另有 ${result.skippedCount} 题暂未回答。</p>`:''}${primaryLesson?`<div class="portrait-key-takeaway" role="region" aria-label="核心教训"><div class="takeaway-badge">${primaryLesson.matched?'★ 记住这条提醒':'★ 提前了解一条经验'}</div><p class="takeaway-notice">${esc(primaryLesson.notice)}</p><div class="takeaway-action"><button class="text-button" type="button" data-lesson-analysis="${esc(primaryLesson.questionId)}">查看对应案例解析 ↗</button></div></div>`:''}<div class="portrait-hero-actions">${portrait?'<button class="portrait-action portrait-action-secondary" type="button" data-portrait-card>留一张角色卡</button>':''}</div><p class="portrait-caption">本次问卷的趣味表达，不代表消费能力或人格评价。</p></header>${reasonList?`<details class="portrait-why"><summary>为什么是这个角色？</summary><p>按这份问卷的经历特征生成，只描述本次记录。你勾选过：</p><ul>${reasonList}</ul>${result.isTie?`<p class="portrait-tie-clue">本次答卷在多个经历维度上的波折程度并列，因此呈现并列角色；下方先选两则对应案例与提醒${result.winningMechanisms?.length>2?'，第三个维度的案例可继续在下方案例库查阅':''}。</p>`:result.reasonQuestionIds?.length===1?'<p class="portrait-single-clue">仅有一项勾选，线索有限；角色反映本次单点经历，可继续体验其他场景。</p>':'<p>角色依据本次答卷的经历机制特征生成。可返回修改回答。</p>'}</details>`:''}<section class="portrait-lessons" aria-labelledby="lessonHeading"><p class="portrait-eyebrow">不花钱，也买教训</p><h2 id="lessonHeading">这次，可以带走什么？</h2>${lessonHtml||`<p>可以到<a href="${esc(base)}?view=library">案例库</a>认识真实的消费案例。</p>`}</section><details class="portrait-record"><summary>看看这份经历记录</summary>${personalSummary()}<p class="survey-note">记录的是题项，不是吃亏次数、最终损失或责任。</p></details><details class="portrait-record"><summary>看看答卷汇总</summary><div id="surveyAggregate" aria-live="polite"><p>正在读取本机汇总……</p></div></details><details class="survey-references"><summary>继续查阅消费案例</summary><ul>${references}</ul></details></article><div class="game-links">${back}<button class="text-button" type="button" data-share-survey>分享问卷链接</button><a href="${esc(base)}?view=library">去案例库</a></div><div id="surveyShare"></div>`;
        const art=viewport.querySelector('.portrait-art img');
        if(art)art.addEventListener('error',()=>{art.hidden=true;art.nextElementSibling.hidden=false;},{once:true});
        void showAggregate();
        if(focus) viewport.querySelector('h1').focus({preventScroll:true});return;
      }
      const prior=data.records[`${q.id}:${q.version}`];
      const question=esc(q.action.slice('你是否遭遇过：'.length));
      viewport.innerHTML=`
        ${notice?`<p class="game-notice" role="status">${esc(notice)}${requested?` <button type="button" class="text-button" data-lesson-analysis="${esc(requested.id)}">看对应案例</button>`:''}</p>`:''}
        <p class="survey-promise">测测你的消费经历角色，不花钱，也买教训。</p>
        <div class="card-space"><article class="scenario-card survey-card" id="surveyCard" tabindex="0" role="group" aria-labelledby="surveyQuestion" data-question="${esc(q.id)}">
          <p class="scenario-stage">${esc(q.stage)}<span class="survey-step">${state.index+1} / ${state.order.length}</span></p>
          <h1 class="survey-question" id="surveyQuestion"><span class="survey-prefix">你是否遭遇过：</span><span>${question}</span></h1>
          ${prior?`<p class="survey-prior">此前记录：${prior.choice==='yes'?'有过':prior.choice==='no'?'没有过':'暂不回答'}，可重新选择。</p>`:''}
          ${q.analysis?.cases?.length?'<button class="survey-analysis-link" type="button" data-open-analysis aria-haspopup="dialog" aria-controls="surveyAnalysis">案例解析</button>':''}
          <span class="drag-choice" aria-hidden="true"></span>
        </article></div>
        <div class="game-decisions has-choices"><button class="decision-button choice-button" type="button" data-response="no" aria-label="NO，没有过"><span>NO<small>没有过</small></span></button><button class="decision-button choice-button" type="button" data-response="yes" aria-label="YES，有过"><span>YES<small>有过</small></span></button></div>
        <p class="gesture-hint">左滑没有过 · 右滑有过</p>
        <div class="game-links">${back}<button class="text-button" type="button" data-response="skip">暂不回答</button><a href="${esc(issueUrl(q))}" target="_blank" rel="noopener">这题表述有问题</a></div>
        <p class="survey-storage">回答仅保存在当前设备，不收集姓名和联系方式。</p>`;
      if(focus) document.getElementById('surveyCard').focus({preventScroll:true});
    }
    async function flush(){
      if(!local||syncing) return;syncing=true;let sent=false;
      try{
        for(const [key,record] of Object.entries(data.pending)){
          const response=await fetch(`${base}api/survey-responses`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(record),keepalive:true,signal:AbortSignal.timeout(3000)});
          if(response.status===409){
            const result=await response.json();
            if(result.error==='question_updated'&&S.find(record.questionId)?.version!==record.version){if(data.pending[key]?.sequence===record.sequence)delete data.pending[key];sent=true;save();continue;}
            if(result.error==='sequence_conflict'&&data.pending[key]?.sequence===record.sequence){const revised={...record,sequence:++data.sequence};data.pending[key]=revised;data.records[key]=revised;save();sent=true;continue;}
          }
          if(!response.ok) break;
          sent=true;if(data.pending[key]?.sequence===record.sequence){delete data.pending[key];save();}
        }
      }catch(error){/* 回答先保存在浏览器，下次打开或恢复网络时再写本机库。 */}
      finally{syncing=false;if(sent&&Object.keys(data.pending).length) setTimeout(flush,0);else if(sent&&!S.current(state)) void showAggregate();}
    }
    function respond(choice){
      if(busy) return;
      const q=S.current(state);if(!q) return;
      const next=S.respond(state,choice,q.id);if(next===state) return;
      busy=true;
      const record={participantId:data.participantId,questionId:q.id,version:q.version,choice,sequence:++data.sequence};
      const key=`${q.id}:${q.version}`;data.records[key]=record;data.pending[key]=record;
      state=next;notice='';save();void flush();
      const card=document.getElementById('surveyCard');
      if(card&&!reduced()) card.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-6px)'}],{duration:140});
      setTimeout(()=>{render(true);busy=false;window.scrollTo({top:0,behavior:'instant'});save();announcer.textContent=S.current(state)?.action||'问卷已填写完，感谢分享。';},reduced()?0:140);
    }
    viewport.addEventListener('click',async event=>{
      if(event.target.closest('[data-open-analysis]')){openAnalysis();return;}
      const lesson=event.target.closest('[data-lesson-analysis]');if(lesson){openAnalysis(lesson.dataset.lessonAnalysis);return;}
      const cardButton=event.target.closest('[data-portrait-card]');if(cardButton){const content=S.getContent();const result=window.BuchikuiPortrait.calculate(content,state);const portrait=content.portrait?.portraits.find(p=>p.id===result.portraitId);if(portrait)void window.BuchikuiPortraitShare.open(portrait,base,cardButton);return;}
      const response=event.target.closest('[data-response]');if(response){respond(response.dataset.response);return;}
      if(event.target.closest('[data-previous]')&&!busy){state=S.previous(state);render(true);save();return;}
      if(event.target.closest('[data-share-survey]')){
        const url=shareUrl();
        if(navigator.share) try{await navigator.share({title:'不吃亏｜消费经历调研',text:'一份关于消费选择与波折经历的问卷。',url});return;}catch(error){if(error.name==='AbortError') return;}
        let copied=false;try{await navigator.clipboard.writeText(url);copied=true;}catch(error){}
        document.getElementById('surveyShare').innerHTML=`<label class="share-fallback">${copied?'问卷链接已复制':'可复制问卷链接'}<input type="url" readonly aria-label="问卷链接" value="${esc(url)}"></label>`;
      }
    });
    viewport.addEventListener('keydown',event=>{
      if(event.target.id!=='surveyCard'||event.altKey||event.ctrlKey||event.metaKey) return;
      if(['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();respond(event.key==='ArrowLeft'?'no':'yes');}
      if(event.key==='Escape') resetDrag();
    });
    function resetDrag(){if(drag?.card){drag.card.style.removeProperty('transform');drag.card.classList.remove('is-dragging');drag.card.querySelector('.drag-choice').classList.remove('is-visible');}drag=null;}
    viewport.addEventListener('pointerdown',event=>{
      const card=event.target.closest('#surveyCard');
      if(!card||busy||!event.isPrimary||event.button!==0||event.target.closest('a,button,input,summary,details')||window.getSelection()?.toString()) return;
      if(event.pointerType==='mouse'&&event.target.closest('p,h1,span')) return;
      drag={card,id:event.pointerId,x:event.clientX,y:event.clientY,dx:0,dy:0,horizontal:false};
    });
    viewport.addEventListener('pointermove',event=>{
      if(!drag||event.pointerId!==drag.id) return;
      drag.dx=event.clientX-drag.x;drag.dy=event.clientY-drag.y;
      if(!drag.horizontal){if(Math.abs(drag.dy)>10&&Math.abs(drag.dy)>Math.abs(drag.dx)){resetDrag();return;}if(Math.abs(drag.dx)<10) return;drag.horizontal=true;drag.card.setPointerCapture(event.pointerId);}
      if(event.cancelable) event.preventDefault();
      const dx=Math.max(-120,Math.min(120,drag.dx));drag.card.classList.add('is-dragging');drag.card.style.transform=`translateX(${dx}px)`;
      const preview=drag.card.querySelector('.drag-choice');preview.textContent=dx<0?'没有过':'有过';preview.dataset.direction=dx<0?'no':'yes';preview.classList.toggle('is-visible',Math.abs(dx)>18);
    });
    viewport.addEventListener('pointerup',event=>{if(!drag||event.pointerId!==drag.id) return;const commit=drag.horizontal&&Math.abs(drag.dx)>=72&&Math.abs(drag.dx)>Math.abs(drag.dy)*1.35;const choice=drag.dx<0?'no':'yes';resetDrag();if(commit) respond(choice);});
    viewport.addEventListener('pointercancel',resetDrag);viewport.addEventListener('lostpointercapture',resetDrag);
    window.addEventListener('pagehide',save);window.addEventListener('online',flush);
    render();save();void flush();
    if(stored&&!requested&&stored.scrollY>0&&!notice) requestAnimationFrame(()=>window.scrollTo({top:stored.scrollY,behavior:'instant'}));
    window.addEventListener('pageshow',event=>{if(event.persisted) location.reload();});
  }
  window.BuchikuiSurveyApp={mount,hasSaved:()=>!!read()?.state};
})();
