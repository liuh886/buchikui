(function(){
  'use strict';

  const R=window.BuchikuiRender;
  const cases=Array.isArray(window.BUCHIKUI_CASES)?window.BUCHIKUI_CASES:[];
  const app=document.getElementById('app');
  if(!app||!R) return;

  const esc=R.esc;
  const stripTags=R.stripTags;
  const rich=value=>sanitizeRichHtml(value);

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
        <div class="topic-list" id="topicList">${cases.map(item=>R.topicRow(item,base)).join('')}</div>
        <p class="empty-state" id="emptyState" aria-live="polite" hidden>暂时没有匹配的主题。换一个更短的关键词试试。</p>
      </section>`;

    const search=document.getElementById('caseSearch');
    if(!search) return;
    search.addEventListener('input',()=>filterTopics(search.value));
    const initial=new URLSearchParams(location.search).get('q');
    if(initial){
      search.value=initial;
      filterTopics(initial);
    }
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
    const term=String(query||'').trim().toLocaleLowerCase('zh-CN');
    let count=0;
    document.querySelectorAll('[data-topic]').forEach(row=>{
      const item=cases.find(candidate=>candidate.slug===row.dataset.topic);
      const matched=!!item&&(!term||searchableText(item).includes(term));
      row.hidden=!matched;
      if(matched) count+=1;
    });
    const recentSection=document.getElementById('recentSection');
    if(recentSection) recentSection.hidden=!!term;
    const countNode=document.getElementById('searchCount');
    if(countNode) countNode.textContent=term?`${count} 个相关主题`:`${cases.length} 个主题`;
    const empty=document.getElementById('emptyState');
    if(empty) empty.hidden=count!==0;
  }

  function renderCase(item){
    document.body.dataset.page='case';
    document.body.dataset.activeCaseSlug=item.slug;
    setMeta(item.meta?.title||`${item.name}｜不吃亏`,item.meta?.description||stripTags(item.hero?.copy));
    renderHeader(item.name);
    app.innerHTML=R.caseArticleHtml(item,{base,rich});

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
