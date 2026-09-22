(function(){
  'use strict';

  const R=window.BuchikuiRender;
  const cases=Array.isArray(window.BUCHIKUI_CASES)?window.BUCHIKUI_CASES:[];
  const app=document.getElementById('app');
  if(!app||!R) return;

  const esc=R.esc;
  const stripTags=R.stripTags;
  const rich=value=>sanitizeRichHtml(value);
  const facets=window.BUCHIKUI_FACETS||{};

  const legacySlug=new URLSearchParams(location.search).get('case');
  if(legacySlug&&/^[a-z0-9][a-z0-9-]*$/.test(legacySlug)&&!location.pathname.includes('/c/')){
    location.replace(`${siteBase()}c/${legacySlug}/`);
    return;
  }

  const allowedRichTags=new Set(['A','B','BR','CODE','EM','LI','OL','P','SMALL','SPAN','STRONG','UL']);

  function sanitizeRichHtml(value){
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
          node.setAttribute('href',R.safeHref(attribute.value));
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
      if(node.tagName==='A'&&R.isExternal(node.getAttribute('href'))) node.setAttribute('target','_blank');
    });
    return template.innerHTML;
  }

  function siteBase(){
    const script=document.querySelector('script[src*="app.js"]');
    if(script&&script.src){
      try{
        const path=new URL('.',script.src).pathname;
        if(path) return path;
      }catch(error){}
    }
    const match=location.pathname.match(/^(.*?\/)(?:c\/[^/]+\/?)?$/);
    return match?match[1]:'./';
  }

  const base=siteBase();
  const pathSlug=((location.pathname.match(/\/c\/([a-z0-9][a-z0-9-]*)\/?$/)||[])[1]||'');
  const active=pathSlug?cases.find(item=>item.slug===pathSlug):null;
  const categoryOf=R.categoryOf;
  const caseUrl=item=>R.caseUrl(item,base);

  function setMeta(title,description){
    document.title=title;
    const meta=document.querySelector('meta[name="description"]');
    if(meta) meta.setAttribute('content',description);
  }

  function renderHeader(caseName=''){
    const header=document.getElementById('siteHeader');
    if(!header) return;
    header.innerHTML=`<div class="shell header-inner">
      <a class="brand" href="${esc(base)}" aria-label="不吃亏首页">不吃亏</a>
      <span class="header-note">${caseName?esc(caseName):'消费普法 · 只看关键依据'}</span>
    </div>`;
  }

  function renderHome(){
    document.body.dataset.page='home';
    delete document.body.dataset.activeCaseSlug;
    setMeta('不吃亏｜从判决和监管规则里学会避坑','从裁判文书、法律法规、部门规章、监管文件和典型案例中提炼现实交易最容易忽视的关键点。');
    renderHeader();

    const recent=[...cases]
      .sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||''))||String(a.id||'').localeCompare(String(b.id||'')))
      .slice(0,6);

    app.innerHTML=`
      <section class="home-hero shell">
        <p class="eyebrow">消费普法</p>
        <h1>很多纠纷，<br>本可以在付款前避免。</h1>
        <p class="home-lead">我们从裁判文书、法律法规、管理办法、监管文件和典型案例里提取关键点，再翻译成现实交易中真正需要留意的一件事。</p>
        <label class="search-box" for="caseSearch">
          <span>搜索消费问题</span>
          <input id="caseSearch" type="search" autocomplete="off" placeholder="租车押金、预付卡、维修、平台扣款……">
        </label>
      </section>

      <section class="home-section shell" id="recentSection" aria-labelledby="recentTitle">
        <div class="section-heading">
          <div>
            <p class="eyebrow">最近更新</p>
            <h2 id="recentTitle">最近值得知道</h2>
          </div>
          <p>不是新闻流，只收录会改变现实交易判断的内容。</p>
        </div>
        <div class="recent-list">${recent.map((item,index)=>R.homeRow(item,index===0,base)).join('')}</div>
      </section>

      <section class="home-section shell" aria-labelledby="allTitle">
        <div class="section-heading">
          <div>
            <p class="eyebrow">按场景找</p>
            <h2 id="allTitle">我正在遇到什么问题？</h2>
          </div>
          <p id="searchCount" aria-live="polite">${cases.length} 个主题</p>
        </div>
        ${facetControls()}
        <div class="topic-list" id="topicList">${cases.map(item=>R.topicRow(item,base,facets)).join('')}</div>
        <p class="empty-state" id="emptyState" aria-live="polite" hidden>暂时没有匹配的主题。换一个更短的关键词试试。</p>
      </section>`;

    const search=document.getElementById('caseSearch');
    if(!search) return;
    search.addEventListener('input',()=>{filterTopics(search.value);syncFacetUrl();});
    bindFacets();
    applyFilters();
    const initial=new URLSearchParams(location.search).get('q');
    if(initial){
      search.value=initial;
      filterTopics(initial);
    }
  }

  const STAGE_ORDER=['pre','during','dispute'];
  const STAGE_LABELS={pre:'下单 / 付款前',during:'履约中',dispute:'已产生纠纷'};
  const TYPE_ORDER=['law','regulation','interpretation','rule','case','other'];
  const TYPE_LABELS={law:'法律',regulation:'行政法规',interpretation:'司法解释',rule:'部门规章 / 监管文件',case:'典型案例 / 裁判',other:'其他'};
  const activeFilters={stage:new Set(),type:new Set(),category:new Set()};
  let currentQuery='';

  function presentCategories(){
    const seen=[];
    for(const item of cases){
      const category=facets[item.slug]?.category||categoryOf(item);
      if(!seen.includes(category)) seen.push(category);
    }
    return seen;
  }

  function presentTypes(){
    const seen=[];
    for(const item of cases) for(const type of facets[item.slug]?.types||[]) if(!seen.includes(type)) seen.push(type);
    return TYPE_ORDER.filter(type=>seen.includes(type));
  }

  function facetChip(group,value,label){
    return `<button class="facet-chip" type="button" data-facet="${esc(group)}" data-value="${esc(value)}" aria-pressed="false">${esc(label)}</button>`;
  }

  function facetControls(){
    const groups=[`<div class="facet-group"><span>你现在处于哪一步</span><div class="facet-options">${STAGE_ORDER.map(stage=>facetChip('stage',stage,STAGE_LABELS[stage])).join('')}</div></div>`];
    const types=presentTypes();
    if(types.length>1) groups.push(`<div class="facet-group"><span>依据类型</span><div class="facet-options">${types.map(type=>facetChip('type',type,TYPE_LABELS[type])).join('')}</div></div>`);
    const categories=presentCategories();
    if(categories.length>1) groups.push(`<div class="facet-group"><span>消费场景</span><div class="facet-options">${categories.map(category=>facetChip('category',category,category)).join('')}</div></div>`);
    return `<div class="topic-facets" id="topicFacets"><div class="topic-facets-head"><span>筛选</span><button class="facet-clear" type="button" id="facetClear" hidden>清空筛选</button></div>${groups.join('')}<p class="facet-note">同一组可多选（或），不同组取交集（且），也可直接搜索。</p></div>`;
  }

  function bindFacets(){
    const host=document.getElementById('topicFacets');
    if(!host) return;
    host.addEventListener('click',event=>{
      const clear=event.target.closest('#facetClear');
      if(clear){
        activeFilters.stage.clear();
        activeFilters.type.clear();
        activeFilters.category.clear();
        host.querySelectorAll('.facet-chip[aria-pressed="true"]').forEach(node=>node.setAttribute('aria-pressed','false'));
        const search=document.getElementById('caseSearch');
        if(search) search.value='';
        filterTopics('');
        syncFacetUrl();
        return;
      }
      const chip=event.target.closest('[data-facet]');
      if(!chip) return;
      const set=activeFilters[chip.dataset.facet];
      if(!set) return;
      const value=chip.dataset.value;
      if(set.has(value)) set.delete(value); else set.add(value);
      chip.setAttribute('aria-pressed',set.has(value)?'true':'false');
      applyFilters();
      syncFacetUrl();
    });
    const params=new URLSearchParams(location.search);
    for(const [group,key] of [['stage','stage'],['type','type'],['category','cat']]){
      const raw=params.get(key);
      if(!raw) continue;
      for(const value of raw.split(',')){
        if(!value||!activeFilters[group]) continue;
        const chip=host.querySelector(`[data-facet="${group}"][data-value="${CSS.escape(value)}"]`);
        if(!chip) continue;
        activeFilters[group].add(value);
        chip.setAttribute('aria-pressed','true');
      }
    }
  }

  function syncFacetUrl(){
    const params=new URLSearchParams(location.search);
    const put=(key,set)=>{if(set.size) params.set(key,[...set].join(',')); else params.delete(key);};
    put('stage',activeFilters.stage);
    put('type',activeFilters.type);
    put('cat',activeFilters.category);
    const query=currentQuery.trim();
    if(query) params.set('q',query); else params.delete('q');
    const qs=params.toString();
    history.replaceState(null,'',qs?`${location.pathname}?${qs}`:location.pathname);
  }

  function searchableText(item){
    const scenarioText=(item.scenarios||[]).map(entry=>entry.title).join(' ');
    const panicText=(item.panic?.items||[]).map(entry=>`${entry.title} ${entry.text||''}`).join(' ');
    const sourceText=(item.sources||[]).map(source=>source.title).join(' ');
    return [item.name,item.hero?.title,item.meta?.description,item.hero?.copy,item.takeaway,item.legal,categoryOf(item),scenarioText,panicText,sourceText]
      .join(' ')
      .replace(/<[^>]*>/g,' ')
      .toLocaleLowerCase('zh-CN');
  }

  function filterTopics(query){
    currentQuery=String(query||'');
    applyFilters();
  }

  function applyFilters(){
    const term=currentQuery.trim().toLocaleLowerCase('zh-CN');
    const anyFilter=!!term||activeFilters.stage.size>0||activeFilters.type.size>0||activeFilters.category.size>0;
    let count=0;
    document.querySelectorAll('[data-topic]').forEach(row=>{
      const slug=row.dataset.topic;
      const item=cases.find(candidate=>candidate.slug===slug);
      const facet=facets[slug]||{};
      let matched=!!item;
      if(matched&&term) matched=searchableText(item).includes(term);
      if(matched&&activeFilters.stage.size) matched=(facet.stage||[]).some(stage=>activeFilters.stage.has(stage));
      if(matched&&activeFilters.type.size) matched=(facet.types||[]).some(type=>activeFilters.type.has(type));
      if(matched&&activeFilters.category.size) matched=activeFilters.category.has(facet.category);
      row.hidden=!matched;
      if(matched) count+=1;
    });
    const recentSection=document.getElementById('recentSection');
    if(recentSection) recentSection.hidden=anyFilter;
    const countNode=document.getElementById('searchCount');
    if(countNode) countNode.textContent=anyFilter?`${count} 个相关主题`:`${cases.length} 个主题`;
    const empty=document.getElementById('emptyState');
    if(empty) empty.hidden=count!==0;
    const clear=document.getElementById('facetClear');
    if(clear) clear.hidden=!anyFilter;
  }

  function renderCase(item){
    document.body.dataset.page='case';
    document.body.dataset.activeCaseSlug=item.slug;
    setMeta(item.meta?.title||`${item.name}｜不吃亏`,item.meta?.description||stripTags(item.hero?.copy));
    renderHeader(item.name);
    app.innerHTML=R.caseArticleHtml(item,{base,rich,related:facets[item.slug]?.related||[]});

    if(window.BuchikuiRights?.render){
      window.BuchikuiRights.render(item.slug);
      const pulse=document.getElementById('rightsPulse');
      pulse?.setAttribute('aria-label','与本主题直接相关的权威依据');
    }
  }

  function renderNotFound(){
    document.body.dataset.page='missing';
    delete document.body.dataset.activeCaseSlug;
    setMeta('没有找到这个主题｜不吃亏','这个消费主题不存在或已经调整。');
    renderHeader();
    app.innerHTML=R.missingHtml(base);
  }

  document.addEventListener('click',event=>{
    const share=event.target.closest('[data-share]');
    if(!share) return;
    const url=location.href;
    const title=active?.shareText||active?.name||'不吃亏';
    if(navigator.share){navigator.share({title:'不吃亏',text:title,url}).catch(()=>{});return;}
    navigator.clipboard?.writeText(url).then(()=>{
      share.textContent='链接已复制';
      const status=document.getElementById('shareStatus');
      if(status) status.textContent='页面链接已复制';
      setTimeout(()=>{share.textContent='分享';if(status) status.textContent='';},1400);
    }).catch(()=>{});
  });

  if(document.body.dataset.notFound||(pathSlug&&!active)){
    renderNotFound();
  }else if(active){
    renderCase(active);
  }else{
    renderHome();
  }
})();
