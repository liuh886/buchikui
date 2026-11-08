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

  function renderHeader(){
    const header=document.getElementById('siteHeader');
    if(!header) return;
    header.innerHTML=`<div class="shell header-inner">
      <div class="brand-block"><a class="brand" href="${esc(base)}" aria-label="不吃亏首页">不吃亏</a>
      <span class="header-note">不花钱，也能买到教训。</span></div>
      <nav class="header-nav" aria-label="主要导航">${document.body.dataset.page==='case'&&window.BuchikuiSurveyApp?.hasSaved()?`<a href="${esc(base)}?resume=1">返回问卷</a>`:''}${document.body.dataset.page==='library'?`<a href="${esc(base)}?resume=1">${window.BuchikuiSurveyApp?.hasSaved()?'返回问卷':'填写问卷'}</a>`:`<a href="${esc(base)}?view=library">案例库</a>`}</nav>
    </div>`;
  }

  function renderHome(){
    document.body.dataset.page='home';
    delete document.body.dataset.activeCaseSlug;
    setMeta('不吃亏｜测测你的消费经历角色','测测你的消费经历角色，不花钱，也买教训。简单记录真实遭遇，带走可爱的角色和真实案例提醒。');
    renderHeader();
    window.BuchikuiSurveyApp.mount({app,base});
  }

  function renderLibrary(){
    document.body.dataset.page='library';
    delete document.body.dataset.activeCaseSlug;
    setMeta('案例库｜不吃亏','搜索具体消费问题，阅读对应案例、权威依据和现实提醒，也可以按卷章浏览。');
    renderHeader();
    const book=window.BuchikuiBook;
    app.innerHTML=`<section class="library-intro shell" aria-labelledby="libraryTitle">
        <h1 id="libraryTitle">案例库</h1>
        <p class="library-lead">遇到了什么？先找相似问题，再看依据与提醒。</p>
        <label class="search-box" for="caseSearch">
          <span class="sr-only">搜索消费问题</span>
          <input id="caseSearch" type="search" autocomplete="off" placeholder="搜索具体问题，如：退卡、扣款、售假" aria-controls="libraryResults topicList" enterkeyhint="search">
        </label>
        <div class="library-shortcuts" aria-label="按问题查找"><span>试试</span>${['退卡','扣款','售假','维修','旅游'].map(term=>`<button class="library-shortcut" type="button" data-library-query="${esc(term)}">${esc(term)}</button>`).join('')}</div>
        <div class="library-tools"><p id="searchCount" role="status" aria-live="polite">${cases.length} 个主题</p><details class="library-filters"><summary>按条件筛选</summary>${facetControls()}</details></div>
      </section><section class="library-results shell" id="libraryResults" aria-labelledby="libraryResultsTitle" hidden><div class="library-results-heading"><h2 id="libraryResultsTitle">相关消费问题</h2><button class="text-button" type="button" id="libraryBrowse">清空搜索，浏览目录</button></div><div id="libraryResultList"></div></section><div class="library-book shell" id="topicList">${book.volumes.map((volume,index)=>`<section class="book-volume" data-book-volume aria-labelledby="volume-${index}"><h2 id="volume-${index}"><small>第${book.number(index)}卷</small>${esc(volume.title)}</h2><div class="topic-list">${volume.chapters.map(([slug])=>cases.find(item=>item.slug===slug)).filter(Boolean).map(item=>R.topicRow(item,base,facets)).join('')}</div></section>`).join('')}</div><section class="library-empty shell" id="emptyState" aria-live="polite" hidden><h2>暂时没有匹配的问题</h2><p>可以换一个说法，或清空条件浏览已有章节。</p><button class="decision-button" type="button" id="searchClear">清空搜索与筛选</button></section>`;

    const search=document.getElementById('caseSearch');
    if(!search) return;
    search.addEventListener('input',()=>{filterTopics(search.value);syncFacetUrl();});
    app.querySelectorAll('[data-library-query]').forEach(button=>button.addEventListener('click',()=>{
      search.value=button.dataset.libraryQuery;
      filterTopics(search.value);syncFacetUrl();search.focus();
    }));
    document.getElementById('libraryBrowse').addEventListener('click',()=>{
      search.value='';filterTopics('');syncFacetUrl();search.focus();
    });
    document.getElementById('searchClear').addEventListener('click',()=>{
      document.getElementById('facetClear').click();
      search.focus();
    });
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
    return `<div class="topic-facets" id="topicFacets"><div class="topic-facets-head"><span>筛选</span><button class="facet-clear" type="button" id="facetClear" hidden>清空搜索与筛选</button></div>${groups.join('')}</div>`;
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
    params.set('view','library');
    const put=(key,set)=>{if(set.size) params.set(key,[...set].join(',')); else params.delete(key);};
    put('stage',activeFilters.stage);
    put('type',activeFilters.type);
    put('cat',activeFilters.category);
    const query=currentQuery.trim();
    if(query) params.set('q',query); else params.delete('q');
    const qs=params.toString();
    history.replaceState(null,'',qs?`${location.pathname}?${qs}`:location.pathname);
  }

  function filterTopics(query){
    currentQuery=String(query||'');
    applyFilters();
  }

  function applyFilters(){
    const term=currentQuery.trim().toLocaleLowerCase('zh-CN');
    const anyFilter=!!term||activeFilters.stage.size>0||activeFilters.type.size>0||activeFilters.category.size>0;
    let count=0;
    const results=[];
    document.querySelectorAll('[data-topic]').forEach(row=>{
      const slug=row.dataset.topic;
      const item=cases.find(candidate=>candidate.slug===slug);
      const facet=facets[slug]||{};
      let matched=!!item;
      const entries=matched&&term?R.searchEntries(item,term):[];
      if(matched&&term) matched=entries.length>0;
      if(matched&&activeFilters.stage.size) matched=(facet.stage||[]).some(stage=>activeFilters.stage.has(stage));
      if(matched&&activeFilters.type.size) matched=(facet.types||[]).some(type=>activeFilters.type.has(type));
      if(matched&&activeFilters.category.size) matched=activeFilters.category.has(facet.category);
      row.hidden=!matched;
      if(matched){count+=1;for(const entry of entries) results.push({item,...entry});}
    });
    document.querySelectorAll('[data-book-volume]').forEach(volume=>{
      volume.hidden=![...volume.querySelectorAll('[data-topic]')].some(row=>!row.hidden);
    });
    const countNode=document.getElementById('searchCount');
    if(countNode) countNode.textContent=term?`${results.length} 个相关问题 · ${count} 个章节`:anyFilter?`${count} 个相关章节`:`${cases.length} 个主题章节`;
    const resultSection=document.getElementById('libraryResults');
    if(resultSection) resultSection.hidden=!term||results.length===0;
    const directory=document.getElementById('topicList');
    if(directory) directory.hidden=!!term;
    const resultList=document.getElementById('libraryResultList');
    if(resultList) resultList.innerHTML=results.map(entry=>{
      const chapter=window.BuchikuiBook?.chapter(entry.item.slug);
      const excerpt=entry.text.length>110?`${entry.text.slice(0,110)}…`:entry.text;
      return `<article class="library-result"><p class="library-result-context">${esc(chapter?`${chapter.volume} · ${chapter.title}`:entry.item.name)}</p><h3><a href="${esc(caseUrl(entry.item)+(entry.anchor?`#${entry.anchor}`:''))}">${esc(entry.title)}</a></h3><p>${esc(excerpt)}</p><a class="library-result-link" href="${esc(caseUrl(entry.item)+(entry.anchor?`#${entry.anchor}`:''))}">查看${entry.anchor?'对应内容':'这一章'}与依据 →</a></article>`;
    }).join('');
    const empty=document.getElementById('emptyState');
    if(empty) empty.hidden=count!==0;
    const clear=document.getElementById('facetClear');
    if(clear) clear.hidden=!anyFilter;
  }

  function renderCase(item){
    document.body.dataset.page='case';
    document.body.dataset.activeCaseSlug=item.slug;
    setMeta(item.meta?.title||`${item.name}｜不吃亏`,item.meta?.description||stripTags(item.hero?.copy));
    renderHeader();
    const authority=window.BuchikuiAuthority;
    app.innerHTML=R.caseArticleHtml(item,{
      base,
      rich,
      related:facets[item.slug]?.related||[],
      authoritySources:authority?authority.allSources(item.slug):[],
      verified:authority?authority.verifiedAt(item.slug):'',
      resume:!!window.BuchikuiSurveyApp?.hasSaved()
    });

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
  }else if(new URLSearchParams(location.search).get('view')==='library'||['q','stage','type','cat'].some(key=>new URLSearchParams(location.search).has(key))){
    renderLibrary();
  }else{
    renderHome();
  }
})();
