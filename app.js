(function(){
  const cases=window.BUCHIKUI_CASES||[];
  if(!cases.length) return;

  const byId=id=>document.getElementById(id);
  const escapeAttr=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const escapeHtml=value=>String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const params=new URLSearchParams(location.search);
  const requested=params.get('case');
  const requestedCase=cases.find(item=>item.slug===requested);
  let pinnedMode=Boolean(requestedCase);
  let active=requestedCase||cases[Math.floor(Math.random()*cases.length)];
  let transitionTimer=null;

  if(requested&&!requestedCase){
    const cleanUrl=new URL(location.href);
    cleanUrl.searchParams.delete('case');
    history.replaceState(null,'',cleanUrl.pathname+cleanUrl.search+cleanUrl.hash);
  }

  function setHtml(id,value){byId(id).innerHTML=value}

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
    }catch(e){}

    boxes.forEach(box=>box.addEventListener('change',persistEvidence));
    persistEvidence();
  }

  function setLayoutMode(){
    const compact=active.layout==='compact';
    const standardOnly=[document.querySelector('.situation'),byId('cases'),byId('evidence'),byId('template')];
    standardOnly.forEach(element=>element.hidden=compact);

    const navLinks=[...document.querySelectorAll('nav a')];
    const mobilePrimary=byId('mobilePrimaryAction');
    byId('scenarioNav').href=compact?'#route':'#cases';
    navLinks.slice(1).forEach(link=>link.hidden=compact);
    if(mobilePrimary){
      mobilePrimary.href=compact?'#route':'#scenarioPicker';
      mobilePrimary.textContent=compact?'查看处理步骤':'找到我的问题';
      mobilePrimary.setAttribute('aria-label',compact?'跳到处理步骤':'跳到问题场景');
    }
  }

  function renderEvidence(){
    setHtml('evidenceTitle',active.evidence.title);
    setHtml('evidenceIntro',active.evidence.intro);
    byId('evidenceFootnote').textContent=active.evidence.footnote;

    const checklist=byId('checklist');
    const renderCheck=item=>`<label class="check"><input type="checkbox" data-evidence="${escapeAttr(item.key)}"><span class="box"></span><span><strong>${item.title}</strong><small>${item.detail}</small></span><span class="when">${item.when}</span></label>`;

    if(active.evidence.groups&&active.evidence.groups.length){
      checklist.classList.add('grouped');
      checklist.innerHTML=active.evidence.groups.map((group,index)=>{
        const items=active.evidence.items.filter(item=>item.group===group.key);
        return `<section class="evidence-group" role="group" aria-labelledby="evidence-group-${index}">
          <div class="evidence-group-head"><strong id="evidence-group-${index}">${group.title}</strong><span>${group.note}</span></div>
          <div class="evidence-group-list">${items.map(renderCheck).join('')}</div>
        </section>`;
      }).join('');
    }else{
      checklist.classList.remove('grouped');
      checklist.innerHTML=active.evidence.items.map(renderCheck).join('');
    }

    restoreEvidence();
  }

  function renderStandardCase(){
    byId('scenarioNav').textContent=`${active.scenarios.length} 个场景`;
    byId('situationList').innerHTML='<span class="situation-label">我遇到的是：</span>'+active.scenarios.map((item,index)=>`<a href="#case-${index+1}">${item.short}</a>`).join('');
    byId('casesKicker').textContent=active.section.kicker;
    setHtml('casesTitle',active.section.title);
    setHtml('casesIntro',active.section.intro);
    byId('caseList').innerHTML=active.scenarios.map((item,index)=>{
      const blocks=item.blocks.map(block=>{
        const classes=['case-block'];
        if(block.full) classes.push('full');
        if(block.kind==='action') classes.push('action');
        return `<div class="${classes.join(' ')}"><b>${block.label}</b>${block.html}</div>`;
      }).join('');
      return `<article class="case" id="case-${index+1}"><div class="case-no">${String(index+1).padStart(2,'0')}</div><div class="case-title"><span class="risk">${item.risk}</span><h3>${item.title}</h3></div><div class="case-body">${blocks}</div></article>`;
    }).join('');

    renderEvidence();

    setHtml('templateTitle',active.template.title);
    setHtml('templateIntro',active.template.intro);
    byId('templateText').textContent=active.template.text;
  }

  function renderCase(){
    document.title=active.meta.title;
    document.querySelector('meta[name="description"]').setAttribute('content',active.meta.description);
    document.querySelector('meta[property="og:title"]').setAttribute('content',active.meta.ogTitle);
    document.querySelector('meta[property="og:description"]').setAttribute('content',active.meta.ogDescription);

    renderSwitcher();
    setLayoutMode();
    byId('caseStamp').textContent=`CASE ${active.id} / ${active.label}`;
    setHtml('heroTitle',active.hero.title);
    setHtml('heroCopy',active.hero.copy);
    setHtml('panicTitle',active.panic.title);
    byId('panicList').innerHTML=active.panic.items.map(item=>`<li><div><strong>${item.title}</strong>${item.text}</div></li>`).join('');

    if(active.layout==='compact') byId('scenarioNav').textContent='处理步骤';
    else renderStandardCase();

    const routeHeading=document.querySelector('.route .section-head h2');
    routeHeading.innerHTML=active.route.title||'从能解决问题的<br>地方开始。';
    setHtml('routeIntro',active.route.intro);
    byId('routeGrid').innerHTML=active.route.steps.map((step,index)=>`<article class="route-step"><span class="n">STEP ${String(index+1).padStart(2,'0')}</span><h3>${step.title}</h3><p>${step.text}</p><a href="${escapeAttr(step.href)}"${step.href.startsWith('http')?' target="_blank" rel="noopener"':''}>${step.link}</a></article>`).join('');
    setHtml('routeNote',active.route.note);

    byId('sourcesTitle').textContent=`本页依据与官方入口（更新：${active.updated}）`;
    byId('sourceList').innerHTML=active.sources.map(source=>`<li><a href="${escapeAttr(source.href)}" target="_blank" rel="noopener">${source.title}</a> — ${source.note}</li>`).join('');
    byId('legalText').textContent=active.legal;
  }

  function isSwitcherOpen(){return !byId('caseSwitcherPopover').hidden}

  function openSwitcher(){
    byId('caseSwitcherPopover').hidden=false;
    byId('caseSwitcherBackdrop').hidden=false;
    byId('caseSwitcher').classList.add('open');
    byId('caseSwitcherTrigger').setAttribute('aria-expanded','true');
  }

  function closeSwitcher(){
    byId('caseSwitcherPopover').hidden=true;
    byId('caseSwitcherBackdrop').hidden=true;
    byId('caseSwitcher').classList.remove('open');
    byId('caseSwitcherTrigger').setAttribute('aria-expanded','false');
  }

  function updatePinnedUrl(next){
    if(!pinnedMode) return;
    const url=new URL(location.href);
    url.searchParams.set('case',next.slug);
    url.hash='';
    history.pushState({case:next.slug},'',url.pathname+url.search);
  }

  function switchCase(next,options={}){
    if(!next||next.slug===active.slug){closeSwitcher();return}
    closeSwitcher();
    clearTimeout(transitionTimer);
    document.body.classList.add('case-changing');

    const apply=()=>{
      active=next;
      if(options.updateUrl!==false) updatePinnedUrl(next);
      renderCase();
      window.scrollTo({top:0,left:0,behavior:'auto'});
      requestAnimationFrame(()=>requestAnimationFrame(()=>document.body.classList.remove('case-changing')));
    };

    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) apply();
    else transitionTimer=setTimeout(apply,100);
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

  async function sharePage(){
    const data={title:active.meta.ogTitle,text:active.shareText,url:shareUrl()};
    try{
      if(navigator.share){await navigator.share(data)}
      else{await navigator.clipboard.writeText(data.url);alert('这个 CASE 的链接已复制')}
    }catch(e){}
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
    }catch(e){window.prompt('复制以下内容：',text)}
  });

  renderCase();
})();