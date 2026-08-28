(function(){
  const cases=window.BUCHIKUI_CASES||[];
  if(!cases.length) return;

  const byId=id=>document.getElementById(id);
  const escapeAttr=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const escapeHtml=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const allowedRichTags=new Set(['A','B','BR','CODE','EM','LI','OL','P','SMALL','SPAN','STRONG','UL']);
  const params=new URLSearchParams(location.search);
  const requested=params.get('case');
  const requestedCase=cases.find(item=>item.slug===requested);
  let pinnedMode=Boolean(requestedCase);
  let active=requestedCase||cases[Math.floor(Math.random()*cases.length)];
  let caseTransitionController=null;

  if(requested&&!requestedCase){
    const cleanUrl=new URL(location.href);
    cleanUrl.searchParams.delete('case');
    history.replaceState(null,'',cleanUrl.pathname+cleanUrl.search+cleanUrl.hash);
  }

  function safeHref(value){
    const href=String(value||'').trim();
    if(!href) return '#';
    if(href.startsWith('#')||href.startsWith('./')||href.startsWith('../')||(/^\/(?!\/)/).test(href)) return href;
    try{
      const parsed=new URL(href,location.origin);
      if(parsed.protocol==='https:'||parsed.protocol==='http:') return parsed.href;
    }catch(error){}
    return '#';
  }

  function sanitizeCanonicalHtml(value){
    const template=document.createElement('template');
    template.innerHTML=String(value||'');
    template.content.querySelectorAll('*').forEach(node=>{
      if(!allowedRichTags.has(node.tagName)){
        node.replaceWith(...node.childNodes);
        return;
      }
      [...node.attributes].forEach(attribute=>{
        const name=attribute.name.toLowerCase();
        if(node.tagName==='A'&&name==='href'){
          node.setAttribute('href',safeHref(attribute.value));
          return;
        }
        if(node.tagName==='A'&&name==='target'&&attribute.value==='_blank') return;
        if(node.tagName==='A'&&name==='rel'){
          node.setAttribute('rel','noopener');
          return;
        }
        if((node.tagName==='STRONG'||node.tagName==='SPAN')&&name==='class'&&attribute.value==='key') return;
        node.removeAttribute(attribute.name);
      });
      if(node.tagName==='A'&&/^https?:\/\//i.test(node.getAttribute('href')||'')){
        node.setAttribute('target','_blank');
        node.setAttribute('rel','noopener');
      }
    });
    return template.innerHTML;
  }

  function setCanonicalHtml(id,value){
    byId(id).innerHTML=sanitizeCanonicalHtml(value);
  }

  function renderMeta(){
    document.title=active.meta.title;
    document.querySelector('meta[name="description"]').setAttribute('content',active.meta.description);
    document.querySelector('meta[property="og:title"]').setAttribute('content',active.meta.ogTitle);
    document.querySelector('meta[property="og:description"]').setAttribute('content',active.meta.ogDescription);
  }

  function renderSwitcher(){
    byId('caseSwitcherId').textContent=`CASE ${active.id}`;
    byId('caseName').textContent=active.name;
    byId('caseSwitcherTrigger').setAttribute('aria-label',`${active.name}，点击切换案例`);
    byId('caseSwitcherList').innerHTML=cases.map(item=>{
      const isActive=item.slug===active.slug;
      return `<button class="case-switcher-item${isActive?' active':''}" type="button" data-switch-case="${escapeAttr(item.slug)}"${isActive?' aria-current="true"':''}>
        <span class="case-switcher-item-id">CASE ${escapeHtml(item.id)}</span>
        <span class="case-switcher-item-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.label)}</small></span>
        ${isActive?'<span class="case-switcher-active-dot" aria-label="当前案例"></span>':'<span aria-hidden="true">→</span>'}
      </button>`;
    }).join('');
    byId('randomCaseButton').disabled=cases.length<2;
  }

  function restoreEvidence(){
    const evidenceKey=`buchikui-${active.slug}-evidence-v1`;
    const boxes=[...document.querySelectorAll('[data-evidence]')];
    const count=byId('progressCount');

    function persistEvidence(){
      const n=boxes.filter(box=>box.checked).length;
      count.textContent=String(n);
      localStorage.setItem(evidenceKey,JSON.stringify(Object.fromEntries(boxes.map(box=>[box.dataset.evidence,box.checked]))));
    }

    try{
      const saved=JSON.parse(localStorage.getItem(evidenceKey)||'{}');
      boxes.forEach(box=>box.checked=!!saved[box.dataset.evidence]);
    }catch(error){}

    boxes.forEach(box=>box.addEventListener('change',persistEvidence));
    persistEvidence();
  }

  function setLayoutMode(){
    const compact=active.layout==='compact';
    const standardOnly=[byId('serviceStandard'),byId('cases'),byId('evidence'),byId('template')];
    standardOnly.forEach(element=>element.hidden=compact);

    const mobilePrimary=byId('mobilePrimaryAction');
    mobilePrimary.href=compact?'#route':'#cases';
    mobilePrimary.textContent=compact?'查看处理步骤':'找到我的问题';
    mobilePrimary.setAttribute('aria-label',compact?'跳到处理步骤':'跳到问题场景');
  }

  function renderHero(){
    setCanonicalHtml('heroTitle',active.hero.title);
    setCanonicalHtml('heroCopy',active.hero.copy);
    setCanonicalHtml('panicTitle',active.panic.title);
    byId('panicList').innerHTML=active.panic.items.map(item=>`<li><strong>${escapeHtml(item.title)}</strong></li>`).join('');
  }

  function renderEvidence(){
    setCanonicalHtml('evidenceTitle',active.evidence.title);
    setCanonicalHtml('evidenceIntro',active.evidence.intro);

    const checklist=byId('checklist');
    const renderCheck=item=>`<label class="check"><input type="checkbox" data-evidence="${escapeAttr(item.key)}"><span class="box"></span><span><strong>${escapeHtml(item.title)}</strong>${item.detail?`<small>${escapeHtml(item.detail)}</small>`:''}</span>${item.when?`<span class="when">${escapeHtml(item.when)}</span>`:''}</label>`;

    if(active.evidence.groups&&active.evidence.groups.length){
      checklist.classList.add('grouped');
      checklist.innerHTML=active.evidence.groups.map((group,index)=>{
        const items=active.evidence.items.filter(item=>item.group===group.key);
        return `<section class="evidence-group" role="group" aria-labelledby="evidence-group-${index}">
          <div class="evidence-group-head"><strong id="evidence-group-${index}">${escapeHtml(group.title)}</strong></div>
          <div class="evidence-group-list">${items.map(renderCheck).join('')}</div>
        </section>`;
      }).join('');
    }else{
      checklist.classList.remove('grouped');
      checklist.innerHTML=active.evidence.items.map(renderCheck).join('');
    }

    restoreEvidence();
  }

  function renderServiceStandard(){
    const section=byId('serviceStandard');
    const details=byId('serviceStandardDetails');
    const standard=active.serviceStandard;
    if(!standard){
      section.hidden=true;
      return;
    }

    section.hidden=false;
    details.open=false;
    byId('serviceStandardKicker').textContent=standard.kicker||'正常服务基线';
    setCanonicalHtml('serviceStandardTitle',standard.title);
    byId('serviceStandardCount').textContent=`${standard.items.length} 项 · 展开查看`;
    setCanonicalHtml('serviceStandardIntro',standard.intro);
    byId('serviceStandardGrid').innerHTML=standard.items.map((item,index)=>`<article class="standard-step"><span class="n">${String(index+1).padStart(2,'0')}</span><h3>${sanitizeCanonicalHtml(item.title)}</h3><p>${sanitizeCanonicalHtml(item.text)}</p></article>`).join('');
    const note=byId('serviceStandardNote');
    note.hidden=!standard.note;
    if(standard.note) setCanonicalHtml('serviceStandardNote',standard.note);
  }

  function renderStandardCase(){
    renderServiceStandard();
    setCanonicalHtml('casesTitle',active.section.title);
    setCanonicalHtml('casesIntro',active.section.intro);
    byId('caseList').innerHTML=active.scenarios.map((item,index)=>{
      const blocks=item.blocks.map(block=>{
        const classes=['case-block'];
        if(block.full) classes.push('full');
        if(block.kind==='action') classes.push('action');
        return `<div class="${classes.join(' ')}"><b>${escapeHtml(block.label)}</b>${sanitizeCanonicalHtml(block.html)}</div>`;
      }).join('');
      return `<article class="case" id="case-${index+1}"><div class="case-no">${String(index+1).padStart(2,'0')}</div><div class="case-title"><h3>${escapeHtml(item.title)}</h3></div><div class="case-body">${blocks}</div></article>`;
    }).join('');

    renderEvidence();

    byId('templateDetails').open=false;
    byId('templateCard').dataset.label=active.template.label||'书面沟通模板';
    setCanonicalHtml('templateTitle',active.template.title);
    setCanonicalHtml('templateIntro',active.template.intro);
    byId('templateText').textContent=active.template.text;
  }

  function renderRouteComparison(){
    let host=byId('routeComparison');
    if(!host){
      host=document.createElement('section');
      host.id='routeComparison';
      byId('routeGrid').insertAdjacentElement('afterend',host);
    }

    const comparison=active.route.comparison;
    host.hidden=!comparison;
    if(!comparison){
      host.className='';
      host.innerHTML='';
      return;
    }

    const kinds=new Set(['product','custody','trading','advisor']);
    const totals=comparison.rows.map(row=>(row.segments||[]).reduce((sum,segment)=>sum+Number(segment.value||0),0));
    const max=Number(comparison.max)||Math.max(1,...totals);
    const legend=(comparison.legend||[]).map(item=>{
      const kind=kinds.has(item.kind)?item.kind:'product';
      return `<span class="fee-legend-item"><i class="fee-swatch fee-${kind}" aria-hidden="true"></i>${escapeHtml(item.label)}</span>`;
    }).join('');
    const rows=comparison.rows.map((row,index)=>{
      const total=totals[index];
      const segments=(row.segments||[]).map(segment=>{
        const kind=kinds.has(segment.kind)?segment.kind:'product';
        const value=Math.max(0,Number(segment.value||0));
        const width=Math.min(100,(value/max)*100);
        return `<span class="fee-segment fee-${kind}" style="width:${width.toFixed(3)}%" title="${escapeAttr(`${value.toFixed(2)}%`)}"></span>`;
      }).join('');
      return `<div class="fee-row${row.highlight?' is-highlight':''}">
        <div class="fee-label"><strong>${escapeHtml(row.label)}</strong>${row.extra?`<small>${escapeHtml(row.extra)}</small>`:''}</div>
        <div class="fee-track" role="img" aria-label="${escapeAttr(`${row.label}：${row.totalLabel||`${total.toFixed(2)}%`}`)}">${segments}</div>
        <div class="fee-total">${escapeHtml(row.totalLabel||`${total.toFixed(2)}%`)}</div>
      </div>`;
    }).join('');

    host.className='fee-comparison';
    host.innerHTML=`<div class="fee-comparison-head"><div><span class="fee-comparison-kicker">费用对比</span><h3>${escapeHtml(comparison.title)}</h3><p>${escapeHtml(comparison.intro||'')}</p></div><div class="fee-legend">${legend}</div></div><div class="fee-chart">${rows}</div>${comparison.footnote?`<p class="fee-footnote">${escapeHtml(comparison.footnote)}</p>`:''}`;
  }

  function renderRoute(){
    setCanonicalHtml('routeTitle',active.route.title||'处理路径');
    byId('routeGrid').innerHTML=active.route.steps.map((step,index)=>{
      const href=safeHref(step.href);
      const external=/^https?:\/\//i.test(href);
      return `<article class="route-step"><span class="n">${String(index+1).padStart(2,'0')}</span><h3>${sanitizeCanonicalHtml(step.title)}</h3><p>${sanitizeCanonicalHtml(step.text)}</p><a href="${escapeAttr(href)}"${external?' target="_blank" rel="noopener"':''}>${escapeHtml(step.link)}</a></article>`;
    }).join('');
    renderRouteComparison();
    const note=byId('routeNote');
    note.hidden=!active.route.note;
    if(active.route.note) setCanonicalHtml('routeNote',active.route.note);
  }

  function renderDiscussion(){
    const section=byId('discussion');
    const discussion=active.discussion;
    section.hidden=!discussion;
    if(!discussion){
      byId('discussionTitle').textContent='';
      byId('discussionBody').textContent='';
      return;
    }
    setCanonicalHtml('discussionTitle',discussion.title);
    setCanonicalHtml('discussionBody',discussion.html);
  }

  function renderSources(){
    byId('sourcesTitle').textContent=`本页依据与官方入口（更新：${active.updated}）`;
    byId('sourceList').innerHTML=active.sources.map(source=>{
      const href=safeHref(source.href);
      return `<li><a href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHtml(source.title)}</a> — ${sanitizeCanonicalHtml(source.note)}</li>`;
    }).join('');
    byId('legalText').textContent=active.legal;
    byId('takeawayText').textContent=active.takeaway;
  }

  function renderCase(){
    renderMeta();
    renderSwitcher();
    setLayoutMode();
    renderHero();

    if(active.layout!=='compact') renderStandardCase();

    renderRoute();
    renderDiscussion();
    renderSources();
  }

  function isSwitcherOpen(){return !byId('caseSwitcherPopover').hidden}

  function openSwitcher(){
    byId('caseSwitcherPopover').hidden=false;
    byId('caseSwitcherBackdrop').hidden=false;
    byId('caseSwitcher').classList.add('open');
    byId('caseSwitcherTrigger').setAttribute('aria-expanded','true');
    document.body.classList.add('case-switcher-open');
  }

  function closeSwitcher(){
    byId('caseSwitcherPopover').hidden=true;
    byId('caseSwitcherBackdrop').hidden=true;
    byId('caseSwitcher').classList.remove('open');
    byId('caseSwitcherTrigger').setAttribute('aria-expanded','false');
    document.body.classList.remove('case-switcher-open');
  }

  function updatePinnedUrl(next){
    if(!pinnedMode) return;
    const url=new URL(location.href);
    url.searchParams.set('case',next.slug);
    url.hash='';
    history.pushState({case:next.slug},'',url.pathname+url.search);
  }

  function applyCaseSwitch(next,options){
    active=next;
    if(options.updateUrl!==false) updatePinnedUrl(next);
    renderCase();
    window.scrollTo({top:0,left:0,behavior:'auto'});
    requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('case-changing')));
  }

  function switchCase(next,options={}){
    if(!next||next.slug===active.slug){closeSwitcher();return}
    closeSwitcher();
    caseTransitionController?.abort();
    document.body.classList.add('case-changing');

    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      applyCaseSwitch(next,options);
      return;
    }

    const main=document.querySelector('main');
    caseTransitionController=new AbortController();
    const controller=caseTransitionController;
    main.addEventListener('transitionend',event=>{
      if(event.target!==main||event.propertyName!=='opacity') return;
      controller.abort();
      if(caseTransitionController===controller) caseTransitionController=null;
      applyCaseSwitch(next,options);
    },{signal:controller.signal});
  }

  function randomOtherCase(){
    if(cases.length<2) return active;
    const others=cases.filter(item=>item.slug!==active.slug);
    return others[Math.floor(Math.random()*others.length)];
  }

  function shareUrl(){
    const url=new URL(location.href);
    url.searchParams.set('case',active.slug);
    url.hash='';
    return url.toString();
  }

  function createShareMeritToast(){
    const toast=document.createElement('div');
    toast.className='consumer-feedback-toast share-merit-toast';
    toast.setAttribute('role','status');
    toast.setAttribute('aria-live','polite');
    toast.hidden=true;
    document.body.appendChild(toast);
    return toast;
  }

  const shareMeritToast=createShareMeritToast();
  let shareMeritTimer=null;

  function hideShareMerit(){
    shareMeritToast.classList.remove('is-visible');
    setTimeout(()=>{shareMeritToast.hidden=true},180);
  }

  function showShareMerit(nextText=''){
    clearTimeout(shareMeritTimer);
    shareMeritToast.textContent='功德 +1';
    shareMeritToast.hidden=false;
    requestAnimationFrame(()=>shareMeritToast.classList.add('is-visible'));
    shareMeritTimer=setTimeout(()=>{
      if(nextText){
        shareMeritToast.textContent=nextText;
        shareMeritTimer=setTimeout(hideShareMerit,1400);
        return;
      }
      hideShareMerit();
    },900);
  }

  async function sharePage(){
    const data={title:active.meta.ogTitle,text:active.shareText,url:shareUrl()};
    try{
      if(navigator.share){
        await navigator.share(data);
        showShareMerit();
        return;
      }
      await navigator.clipboard.writeText(data.url);
      showShareMerit('已复制到粘贴板');
    }catch(error){
      if(error?.name!=='AbortError'&&!navigator.share) window.prompt('复制这个 CASE 的链接：',data.url);
    }
  }

  byId('caseSwitcherTrigger').addEventListener('click',event=>{
    event.stopPropagation();
    isSwitcherOpen()?closeSwitcher():openSwitcher();
  });

  byId('caseSwitcherList').addEventListener('click',event=>{
    const button=event.target.closest('[data-switch-case]');
    if(!button) return;
    switchCase(cases.find(item=>item.slug===button.dataset.switchCase));
  });

  byId('randomCaseButton').addEventListener('click',()=>switchCase(randomOtherCase()));
  byId('caseSwitcherBackdrop').addEventListener('click',closeSwitcher);
  document.addEventListener('click',event=>{if(isSwitcherOpen()&&!byId('caseSwitcher').contains(event.target)) closeSwitcher()});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&isSwitcherOpen()){closeSwitcher();byId('caseSwitcherTrigger').focus()}});

  window.addEventListener('popstate',()=>{
    if(!pinnedMode) return;
    const slug=new URLSearchParams(location.search).get('case');
    const next=cases.find(item=>item.slug===slug);
    if(next&&next.slug!==active.slug) switchCase(next,{updateUrl:false});
  });

  document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
  document.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',sharePage));

  byId('copyTemplate').addEventListener('click',async function(){
    const text=byId('templateText').innerText;
    try{
      await navigator.clipboard.writeText(text);
      this.textContent='已复制';
      setTimeout(()=>this.textContent='复制',1400);
    }catch(error){window.prompt('复制以下内容：',text)}
  });

  renderCase();
})();