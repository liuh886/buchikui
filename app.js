(function(){
  'use strict';

  const cases=Array.isArray(window.BUCHIKUI_CASES)?window.BUCHIKUI_CASES:[];
  const app=document.getElementById('app');
  if(!app) return;

  const esc=value=>String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

  const allowedRichTags=new Set(['A','B','BR','CODE','EM','LI','OL','P','SMALL','SPAN','STRONG','UL']);
  const stripHtml=value=>{
    const node=document.createElement('div');
    node.innerHTML=String(value||'');
    return (node.textContent||'').replace(/\s+/g,' ').trim();
  };

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

  function siteBase(){
    const match=location.pathname.match(/^(.*?\/)(?:c\/[^/]+\/?)?$/);
    return match?match[1]:'./';
  }

  const base=siteBase();
  const pathSlug=((location.pathname.match(/\/c\/([a-z0-9][a-z0-9-]*)\/?$/)||[])[1]||'');
  const active=pathSlug?cases.find(item=>item.slug===pathSlug):null;

  const categories={
    rental:'租车',
    'rental-credit-card-first':'租车',
    'beauty-hair':'预付消费',
    'bank-small-account-fee':'银行',
    'bank-wealth-not-guaranteed':'银行与理财',
    'alipay-advisor-cost':'投资与费用',
    'mobile-plan-cost':'通信',
    'internet-court-self-litigation':'诉讼',
    'appliance-repair-trap':'维修',
    'airport-sales-pitch':'线下推销',
    'dating-safety':'人身与财产安全',
    'thailand-travel-safety':'旅行',
    'alibaba-auction-trap':'拍卖',
    'layoff-compensation':'劳动',
    'qingdao-travel':'旅行消费',
    'transport-platform-layered-fees':'平台交易'
  };

  const categoryOf=item=>categories[item.slug]||'消费场景';
  const caseUrl=item=>`${base}c/${encodeURIComponent(item.slug)}/`;

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
      .sort((a,b)=>String(b.updated||'').localeCompare(String(a.updated||'')))
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

      <section class="home-section shell" aria-labelledby="recentTitle">
        <div class="section-heading">
          <div>
            <p class="eyebrow">最近更新</p>
            <h2 id="recentTitle">最近值得知道</h2>
          </div>
          <p>不是新闻流，只收录会改变现实交易判断的内容。</p>
        </div>
        <div class="recent-list">${recent.map((item,index)=>homeRow(item,index===0)).join('')}</div>
      </section>

      <section class="home-section shell" aria-labelledby="allTitle">
        <div class="section-heading">
          <div>
            <p class="eyebrow">按场景找</p>
            <h2 id="allTitle">我正在遇到什么问题？</h2>
          </div>
          <p id="searchCount">${cases.length} 个主题</p>
        </div>
        <div class="topic-list" id="topicList">${cases.map(topicRow).join('')}</div>
        <p class="empty-state" id="emptyState" hidden>暂时没有匹配的主题。换一个更短的关键词试试。</p>
      </section>`;

    const search=document.getElementById('caseSearch');
    search?.addEventListener('input',()=>filterTopics(search.value));
  }

  function searchableText(item){
    const scenarioText=(item.scenarios||[]).map(entry=>entry.title).join(' ');
    const panicText=(item.panic?.items||[]).map(entry=>`${entry.title} ${entry.text||''}`).join(' ');
    return [item.name,item.meta?.description,item.hero?.copy,categoryOf(item),scenarioText,panicText].join(' ').toLocaleLowerCase('zh-CN');
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
    const countNode=document.getElementById('searchCount');
    if(countNode) countNode.textContent=term?`${count} 个结果`:`${cases.length} 个主题`;
    const empty=document.getElementById('emptyState');
    if(empty) empty.hidden=count!==0;
  }

  function homeRow(item,featured=false){
    return `<a class="recent-row${featured?' is-featured':''}" href="${esc(caseUrl(item))}">
      <div class="row-meta"><span>${esc(categoryOf(item))}</span><time datetime="${esc(item.updated||'')}">${esc(item.updated||'持续更新')}</time></div>
      <div class="row-copy"><h3>${esc(item.name)}</h3><p>${esc(item.meta?.description||stripHtml(item.hero?.copy)||'')}</p></div>
      <span class="row-arrow" aria-hidden="true">→</span>
    </a>`;
  }

  function topicRow(item){
    return `<a class="topic-row" data-topic="${esc(item.slug)}" href="${esc(caseUrl(item))}">
      <span class="topic-category">${esc(categoryOf(item))}</span>
      <strong>${esc(item.name)}</strong>
      <span aria-hidden="true">→</span>
    </a>`;
  }

  function renderCase(item){
    document.body.dataset.page='case';
    document.body.dataset.activeCaseSlug=item.slug;
    setMeta(item.meta?.title||`${item.name}｜不吃亏`,item.meta?.description||stripHtml(item.hero?.copy));
    renderHeader(item.name);

    const reminders=caseReminders(item);
    const evidence=item.evidence?.items||[];
    const steps=item.route?.steps||[];
    const sources=item.sources||[];

    app.innerHTML=`
      <article class="case-page">
        <header class="case-intro shell">
          <a class="back-link" href="${esc(base)}">← 返回全部主题</a>
          <div class="case-meta"><span>${esc(categoryOf(item))}</span>${item.updated?`<time datetime="${esc(item.updated)}">更新 ${esc(item.updated)}</time>`:''}</div>
          <h1>${esc(item.name)}</h1>
          <p class="case-lead">${esc(stripHtml(item.hero?.copy)||item.meta?.description||'')}</p>
        </header>

        <section class="authority-section" aria-labelledby="authorityTitle">
          <div class="shell">
            <p class="eyebrow">权威依据</p>
            <h2 id="authorityTitle">规则和裁判怎么说</h2>
            <p class="section-intro">优先展示法律法规、司法解释、部门规章、监管文件、典型案例和高价值裁判。结论以原文适用范围为边界。</p>
          </div>
          <div id="rightsPulse"></div>
        </section>

        ${reminders.length?`<section class="reading-section shell" aria-labelledby="reminderTitle">
          <div class="section-heading compact"><div><p class="eyebrow">现实交易</p><h2 id="reminderTitle">这些地方最容易被忽视</h2></div></div>
          <div class="reminder-list">${reminders.map((entry,index)=>reminderRow(entry,index)).join('')}</div>
        </section>`:''}

        ${evidence.length?`<section class="reading-section shell" aria-labelledby="evidenceTitle">
          <div class="section-heading compact"><div><p class="eyebrow">发生纠纷后</p><h2 id="evidenceTitle">先保留这些材料</h2></div></div>
          <ul class="plain-list evidence-list">${evidence.map(entry=>`<li><strong>${esc(entry.title)}</strong>${entry.detail?`<span>${esc(entry.detail)}</span>`:''}</li>`).join('')}</ul>
        </section>`:''}

        ${steps.length?`<section class="reading-section shell" id="route" aria-labelledby="routeTitle">
          <div class="section-heading compact"><div><p class="eyebrow">需要继续处理时</p><h2 id="routeTitle">处理路径</h2></div></div>
          <ol class="route-list">${steps.map((step,index)=>routeRow(step,index)).join('')}</ol>
          ${item.route?.note?`<div class="route-note">${sanitizeRichHtml(item.route.note)}</div>`:''}
        </section>`:''}

        ${sources.length?`<section class="source-section shell" aria-labelledby="sourceTitle">
          <div class="section-heading compact"><div><p class="eyebrow">原文</p><h2 id="sourceTitle">依据与出处</h2></div></div>
          <ol class="source-list">${sources.map(sourceRow).join('')}</ol>
          ${item.legal?`<p class="legal-note">${esc(item.legal)}</p>`:''}
        </section>`:''}

        ${item.takeaway?`<footer class="case-takeaway shell"><span>记住这一点</span><strong>${esc(item.takeaway)}</strong></footer>`:''}
      </article>`;

    if(window.BuchikuiRights?.render){
      window.BuchikuiRights.render(item.slug);
      const label=document.querySelector('.rights-pulse-label');
      if(label) label.textContent=label.textContent.includes('案例')?'裁判参考':'权威依据';
      document.querySelectorAll('.rights-pulse-action span').forEach(node=>{node.textContent=node.textContent.includes('关键')?'裁判要点':'现实提醒';});
      const pulse=document.getElementById('rightsPulse');
      pulse?.setAttribute('aria-label','与本主题直接相关的权威依据');
    }
  }

  function caseReminders(item){
    if(Array.isArray(item.scenarios)&&item.scenarios.length){
      return item.scenarios.map(entry=>({
        title:entry.title,
        fact:entry.blocks?.find(block=>block.kind!=='action')?.html||'',
        action:entry.blocks?.find(block=>block.kind==='action')?.html||''
      }));
    }
    return (item.panic?.items||[]).map(entry=>({title:entry.title,fact:'',action:entry.text||''}));
  }

  function reminderRow(entry,index){
    return `<article class="reminder-row">
      <span class="reminder-index">${String(index+1).padStart(2,'0')}</span>
      <div class="reminder-copy"><h3>${esc(entry.title)}</h3>
        ${entry.fact?`<div class="fact-line"><b>关键事实</b>${sanitizeRichHtml(entry.fact)}</div>`:''}
        ${entry.action?`<div class="action-line"><b>现实提醒</b>${sanitizeRichHtml(entry.action)}</div>`:''}
      </div>
    </article>`;
  }

  function routeRow(step,index){
    const href=safeHref(step.href);
    const external=/^https?:\/\//i.test(href);
    return `<li><span>${String(index+1).padStart(2,'0')}</span><div><h3>${sanitizeRichHtml(step.title||'')}</h3><p>${sanitizeRichHtml(step.text||'')}</p>${step.link&&href!=='#'?`<a href="${esc(href)}"${external?' target="_blank" rel="noopener"':''}>${esc(step.link)}</a>`:''}</div></li>`;
  }

  function sourceRow(source){
    const href=safeHref(source.href);
    const external=/^https?:\/\//i.test(href);
    return `<li><a href="${esc(href)}"${external?' target="_blank" rel="noopener"':''}>${esc(source.title||'查看原文')}</a>${source.note?`<p>${esc(source.note)}</p>`:''}</li>`;
  }

  document.addEventListener('click',event=>{
    const share=event.target.closest('[data-share]');
    if(!share) return;
    const url=location.href;
    const title=active?.shareText||active?.name||'不吃亏';
    if(navigator.share){navigator.share({title:'不吃亏',text:title,url}).catch(()=>{});return;}
    navigator.clipboard?.writeText(url).then(()=>{share.textContent='链接已复制';setTimeout(()=>{share.textContent='分享'},1400);}).catch(()=>{});
  });

  if(pathSlug&&!active){
    renderHeader();
    setMeta('没有找到这个主题｜不吃亏','这个消费主题不存在或已经调整。');
    app.innerHTML=`<section class="missing shell"><p class="eyebrow">404</p><h1>这个主题不存在。</h1><p>可能已经调整名称或移除。</p><a href="${esc(base)}">返回全部主题 →</a></section>`;
  }else if(active){
    renderCase(active);
  }else{
    renderHome();
  }
})();
