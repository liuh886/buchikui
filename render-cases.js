(function(root){
  'use strict';

  const CATEGORIES={
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

  const esc=value=>String(value??'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');

  const stripTags=value=>String(value||'').replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();

  const isExternal=href=>/^https?:\/\//i.test(String(href||''));

  function safeHref(value){
    const href=String(value||'').trim();
    if(!href) return '#';
    if(href.startsWith('#')||href.startsWith('./')||href.startsWith('../')||(/^\/(?!\/)/).test(href)) return href;
    if(isExternal(href)) return href;
    return '#';
  }

  const categoryOf=item=>CATEGORIES[item?.slug]||'消费场景';
  const caseUrl=(item,base='./')=>`${base}c/${encodeURIComponent(item.slug)}/`;

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

  function homeRow(item,featured,base,rich){
    const description=item.meta?.description||stripTags(item.hero?.copy)||'';
    return `<a class="recent-row${featured?' is-featured':''}" href="${esc(caseUrl(item,base))}">
      <div class="row-meta"><span>${esc(categoryOf(item))}</span><time datetime="${esc(item.updated||'')}">${esc(item.updated||'持续更新')}</time></div>
      <div class="row-copy"><h3>${esc(item.name)}</h3><p>${esc(description)}</p></div>
      <span class="row-arrow" aria-hidden="true">→</span>
    </a>`;
  }

  function topicRow(item,base){
    return `<a class="topic-row" data-topic="${esc(item.slug)}" href="${esc(caseUrl(item,base))}">
      <span class="topic-category">${esc(categoryOf(item))}</span>
      <strong>${esc(item.name)}</strong>
      <span aria-hidden="true">→</span>
    </a>`;
  }

  function reminderRow(entry,index,rich){
    return `<article class="reminder-row">
      <span class="reminder-index">${String(index+1).padStart(2,'0')}</span>
      <div class="reminder-copy"><h3>${esc(entry.title)}</h3>
        ${entry.fact?`<div class="fact-line"><b>关键事实</b>${rich(entry.fact)}</div>`:''}
        ${entry.action?`<div class="action-line"><b>现实提醒</b>${rich(entry.action)}</div>`:''}
      </div>
    </article>`;
  }

  function routeRow(step,index,rich){
    const href=safeHref(step.href);
    return `<li><span>${String(index+1).padStart(2,'0')}</span><div><h3>${rich(step.title||'')}</h3><p>${rich(step.text||'')}</p>${step.link&&href!=='#'?`<a href="${esc(href)}"${isExternal(href)?' target="_blank" rel="noopener"':''}>${esc(step.link)}</a>`:''}</div></li>`;
  }

  function sourceRow(source){
    const href=safeHref(source.href);
    return `<li><a href="${esc(href)}"${isExternal(href)?' target="_blank" rel="noopener"':''}>${esc(source.title||'查看原文')}</a>${source.note?`<p>${esc(source.note)}</p>`:''}</li>`;
  }

  function sectionHead(id,eyebrow,title,introHtml){
    return `<div class="section-heading compact"><div><p class="eyebrow">${esc(eyebrow)}</p><h2 id="${id}">${esc(title)}</h2>${introHtml?`<p class="section-intro">${introHtml}</p>`:''}</div></div>`;
  }

  function caseArticleHtml(item,options){
    const opts=options||{};
    const base=opts.base||'./';
    const rich=opts.rich||(value=>esc(stripTags(value)));
    const authorityHtml=opts.authorityHtml!==undefined?opts.authorityHtml:'<div id="rightsPulse"></div>';
    const reminders=caseReminders(item);
    const evidence=item.evidence?.items||[];
    const steps=item.route?.steps||[];
    const sources=item.sources||[];
    const heading=item.hero?.title||item.name;
    const lead=item.hero?.copy||item.meta?.description||'';

    return `<article class="case-page">
        <header class="case-intro shell">
          <nav class="case-nav" aria-label="面包屑"><a class="back-link" href="${esc(base)}">← 返回全部主题</a></nav>
          <div class="case-meta"><span>${esc(categoryOf(item))}</span>${item.updated?`<time datetime="${esc(item.updated)}">更新 ${esc(item.updated)}</time>`:''}</div>
          <h1>${rich(heading)}</h1>
          <p class="case-lead">${esc(stripTags(lead))}</p>
        </header>

        <section class="authority-section" aria-labelledby="authorityTitle">
          <div class="shell">
            <h2 id="authorityTitle">规则和裁判怎么说</h2>
            <p class="section-intro">优先展示法律法规、司法解释、部门规章、监管文件、典型案例和高价值裁判。结论以原文适用范围为边界。</p>
          </div>
          ${authorityHtml}
        </section>

        ${reminders.length?`<section class="reading-section shell" aria-labelledby="reminderTitle">
          ${sectionHead('reminderTitle','现实交易','这些地方最容易被忽视',item.panic?.title?rich(item.panic.title):'')}
          <div class="reminder-list">${reminders.map((entry,index)=>reminderRow(entry,index,rich)).join('')}</div>
        </section>`:''}

        ${evidence.length?`<section class="reading-section shell" aria-labelledby="evidenceTitle">
          ${sectionHead('evidenceTitle','发生纠纷后','先保留这些材料','')}
          <ul class="plain-list evidence-list">${evidence.map(entry=>`<li><strong>${esc(entry.title)}</strong>${entry.detail?`<span>${esc(entry.detail)}</span>`:''}</li>`).join('')}</ul>
        </section>`:''}

        ${steps.length?`<section class="reading-section shell" id="route" aria-labelledby="routeTitle">
          ${sectionHead('routeTitle','需要继续处理时','处理路径',item.route?.intro?rich(item.route.intro):'')}
          <ol class="route-list">${steps.map((step,index)=>routeRow(step,index,rich)).join('')}</ol>
          ${item.route?.note?`<div class="route-note">${rich(item.route.note)}</div>`:''}
        </section>`:''}

        ${sources.length?`<section class="source-section shell" aria-labelledby="sourceTitle">
          ${sectionHead('sourceTitle','原文','依据与出处','')}
          <ol class="source-list">${sources.map(sourceRow).join('')}</ol>
          ${item.legal?`<p class="legal-note">${esc(item.legal)}</p>`:''}
        </section>`:''}

        ${item.takeaway?`<footer class="case-takeaway shell"><span>记住这一点</span><strong>${esc(item.takeaway)}</strong></footer>`:''}
      </article>`;
  }

  function missingHtml(base){
    return `<section class="missing shell"><p class="eyebrow">404</p><h1>这个主题不存在。</h1><p>可能已经调整名称或移除。</p><a href="${esc(base)}">返回全部主题 →</a></section>`;
  }

  root.BuchikuiRender={
    CATEGORIES,
    esc,
    stripTags,
    safeHref,
    isExternal,
    categoryOf,
    caseUrl,
    caseReminders,
    homeRow,
    topicRow,
    reminderRow,
    routeRow,
    sourceRow,
    caseArticleHtml,
    missingHtml
  };
})(typeof window!=='undefined'?window:globalThis);
