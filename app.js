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
    byId('caseSwitcherTrigger').setAttribute('aria-label',`当前是 CASE ${active.id}：${active.name}。点击切换案例`);
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
    const standardOnly=[document.querySelector('.situation'),byId('serviceStandard'),byId('cases'),byId('evidence'),byId('template')];
    standardOnly.forEach(element=>element.hidden=compact);

    const navLinks=[...document.querySelectorAll('nav a')];
    const mobilePrimary=byId('mobilePrimaryAction');
    byId('scenarioNav').href=compact?'#route':'#cases';
    byId('routeNav').textContent=active.route.navLabel||'维权路径';
    byId('templateNav').textContent=active.template?.navLabel||'沟通模板';
    navLinks.slice(1).forEach(link=>link.hidden=compact);
    if(mobilePrimary){
      mobilePrimary.href=compact?'#route':'#scenarioPicker';
      mobilePrimary.textContent=compact?'查看处理步骤':'找到我的问题';
      mobilePrimary.setAttribute('aria-label',compact?'跳到处理步骤':'跳到问题场景');
    }
  }

  function renderHero(){
    byId('caseStamp').textContent=`CASE ${active.id} / ${active.label}`;
    setCanonicalHtml('heroTitle',active.hero.title);
    setCanonicalHtml('heroCopy',active.hero.copy);
    setCanonicalHtml('panicTitle',active.panic.title);
    byId('panicList').innerHTML=active.panic.items.map(item=>`<li><div><strong>${escapeHtml(item.title)}</strong>${sanitizeCanonicalHtml(item.text)}</div></li>`).join('');
  }

  function renderEvidence(){
    setCanonicalHtml('evidenceTitle',active.evidence.title);
    setCanonicalHtml('evidenceIntro',active.evidence.intro);
    byId('evidenceFootnote').textContent=active.evidence.footnote;

    const checklist=byId('checklist');
    const renderCheck=item=>`<label class="check"><input type="checkbox" data-evidence="${escapeAttr(item.key)}"><span class="box"></span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span><span class="when">${escapeHtml(item.when)}</span></label>`;

    if(active.evidence.groups&&active.evidence.groups.length){
      checklist.classList.add('grouped');
      checklist.innerHTML=active.evidence.groups.map((group,index)=>{
        const items=active.evidence.items.filter(item=>item.group===group.key);
        return `<section class="evidence-group" role="group" aria-labelledby="evidence-group-${index}">
          <div class="evidence-group-head"><strong id="evidence-group-${index}">${escapeHtml(group.title)}</strong><span>${escapeHtml(group.note)}</span></div>
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
    const standard=active.serviceStandard;
    if(!standard){
      section.hidden=true;
      return;
    }

    section.hidden=false;
    byId('serviceStandardKicker').textContent=standard.kicker||'正常服务标准';
    setCanonicalHtml('serviceStandardTitle',standard.title);
    setCanonicalHtml('serviceStandardIntro',standard.intro);
    byId('serviceStandardGrid').innerHTML=standard.items.map((item,index)=>`<article class="route-step"><span class="n">STANDARD ${String(index+1).padStart(2,'0')}</span><h3>${sanitizeCanonicalHtml(item.title)}</h3><p>${sanitizeCanonicalHtml(item.text)}</p></article>`).join('');
    setCanonicalHtml('serviceStandardNote',standard.note||'');
  }

  function renderStandardCase(){
    const situation=document.querySelector('.situation');
    situation.classList.toggle('dense',active.scenarios.length>6);
    byId('scenarioNav').textContent=`${active.scenarios.length} 个场景`;
    byId('situationList').innerHTML='<span class="situation-label">我遇到的是：</span>'+active.scenarios.map((item,index)=>`<a href="#case-${index+1}">${escapeHtml(item.short)}</a>`).join('');
    renderServiceStandard();
    byId('casesKicker').textContent=active.section.kicker;
    setCanonicalHtml('casesTitle',active.section.title);
    setCanonicalHtml('casesIntro',active.section.intro);
    byId('caseList').innerHTML=active.scenarios.map((item,index)=>{
      const blocks=item.blocks.map(block=>{
        const classes=['case-block'];
        if(block.full) classes.push('full');
        if(block.kind==='action') classes.push('action');
        return `<div class="${classes.join(' ')}"><b>${escapeHtml(block.label)}</b>${sanitizeCanonicalHtml(block.html)}</div>`;
      }).join('');
      return `<article class="case" id="case-${index+1}"><div class="case-no">${String(index+1).padStart(2,'0')}</div><div class="case-title"><span class="risk">${escapeHtml(item.risk)}</span><h3>${escapeHtml(item.title)}</h3></div><div class="case-body">${blocks}</div></article>`;
    }).join('');

    renderEvidence();

    byId('templateCard').dataset.label=active.template.label||'书面沟通模板';
    setCanonicalHtml('templateTitle',active.template.title);
    setCanonicalHtml('templateIntro',active.template.intro);
    byId('templateText').textContent=active.template.text;
  }

  function renderRoute(){
    byId('routeKicker').textContent=active.route.kicker||'维权路径';
    setCanonicalHtml('routeTitle',active.route.title||'从能解决问题的<br>地方开始。');
    setCanonicalHtml('routeIntro',active.route.intro);
    byId('routeGrid').innerHTML=active.route.steps.map((step,index)=>{
      const href=safeHref(step.href);
      const external=/^https?:\/\//i.test(href);
      return `<article class="route-step"><span class="n">STEP ${String(index+1).padStart(2,'0')}</span><h3>${sanitizeCanonicalHtml(step.title)}</h3><p>${sanitizeCanonicalHtml(step.text)}</p><a href="${escapeAttr(href)}"${external?' target="_blank" rel="noopener"':''}>${escapeHtml(step.link)}</a></article>`;
    }).join('');
    setCanonicalHtml('routeNote',active.route.note);
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

    if(active.layout==='compact') byId('scenarioNav').textContent='处理步骤';
    else renderStandardCase();

    renderRoute();
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

  function showShareMerit(){
    clearTimeout(shareMeritTimer);
    shareMeritToast.textContent='功德 +1';
    shareMeritToast.hidden=false;
    requestAnimationFrame(()=>shareMeritToast.classList.add('is-visible'));
    shareMeritTimer=setTimeout(()=>{
      shareMeritToast.classList.remove('is-visible');
      setTimeout(()=>{shareMeritToast.hidden=true},180);
    },1800);
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
      showShareMerit();
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

  byId('mobilePrimaryAction').addEventListener('click',event=>{
    if(active.layout==='compact') return;
    event.preventDefault();
    const target=byId('scenarioPicker');
    const offset=window.innerWidth<=860?70:88;
    const top=target.getBoundingClientRect().top+window.scrollY-offset;
    const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({top,behavior:reduced?'auto':'smooth'});
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
