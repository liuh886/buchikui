// 编辑层：权威依据的渲染代码（Tab、hash 选中、来源面板、核验标签）。
// 由 scripts/build-authority.mjs 原样内联进 legal-updates.js；不要在这里写数据。
  const esc=value=>String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  const link=source=>source?`<a href="${esc(source.href)}" target="_blank" rel="noopener">${esc(source.title)} →</a>`:'';
  const ruleSources=rule=>rule.sources||[];
  const normalizeRules=item=>item&&Array.isArray(item.rules)?item.rules:[];
  const ruleId=(rule,index)=>String((rule&&rule.id)||`item-${index||0}`);
  const isCaseRule=rule=>rule&&rule.kind==='case';
  // 核验日期只在该条依据自己复核过时显示；没有单独核验记录的，退回本批核验日期并如实标注为“本批”。
  const ruleVerified=rule=>rule&&rule.verified?rule.verified:'';
  const verifiedLabel=rule=>{
    const own=ruleVerified(rule);
    return own?`核验 ${own}`:`本批核验 ${VERIFIED}`;
  };
  const itemVerified=item=>normalizeRules(item).reduce(
    (latest,rule)=>ruleVerified(rule)>latest?ruleVerified(rule):latest,
    ''
  );

  function allSources(item){
    const seen=new Set();
    return normalizeRules(item).flatMap(ruleSources).filter(source=>{
      if(!source||!source.href||seen.has(source.href)) return false;
      seen.add(source.href);
      return true;
    });
  }

  function getActiveCase(){
    // 主路径：app.js 在写入 body[data-active-case-slug] 后直调 renderForSlug；
    // 兜底只认地址里的 /c/<slug>/ 与旧 ?case= 参数，不做按标题猜测。
    const slug=document.body?.dataset?.activeCaseSlug;
    if(slug){
      const bySlug=(window.BUCHIKUI_CASES||[]).find(item=>item.slug===slug);
      if(bySlug) return bySlug;
    }
    try{
      const param=new URLSearchParams(location.search).get('case')
        ||((location.pathname.match(/\/c\/([a-z0-9][a-z0-9-]*)\/?$/)||[])[1]||'');
      if(param) return (window.BUCHIKUI_CASES||[]).find(item=>item.slug===param)||null;
    }catch(error){}
    return null;
  }

  function ensureHost(){
    return document.getElementById('rightsPulse');
  }

  function ruleBasis(rule){
    const type=String(rule.type||'').trim();
    const rest=type.split('·').slice(1).map(part=>part.trim()).filter(Boolean);
    return [...rest,rule.authority].filter(Boolean).join(' · ');
  }

  // 权重徽标：把“这条依据有多硬”变成一眼可辨的签名；标签取类型首段原文，不重写效力排序。
  function ruleBadge(rule){
    if(isCaseRule(rule)) return `<span class="rights-pulse-badge is-case">${esc(rule.type||'案例参考')}</span>`;
    const head=String(rule.type||'').split('·')[0].trim();
    let cls='is-policy';
    if(/法律|行政法规|司法解释/.test(head)) cls='is-statute';
    else if(/部门规章|监管|证监|规范/.test(head)) cls='is-regulatory';
    return `<span class="rights-pulse-badge ${cls}">${esc(head||'规则')}</span>`;
  }

  function metaHtml(rule,count){
    return `
      <span class="rights-pulse-label">${isCaseRule(rule)?'裁判参考':'权威依据'}</span>
      ${ruleBadge(rule)}
      <strong>${esc(rule.status||'现行')}</strong>
      ${ruleBasis(rule)?`<span>${esc(ruleBasis(rule))}</span>`:''}
      ${rule.effective?`<span>实施 ${esc(rule.effective)}</span>`:''}
      ${count>1?`<span>${count} 项关键参考</span>`:''}
      <span>${esc(verifiedLabel(rule))}</span>`;
  }

  function panelHtml(rule){
    const sources=ruleSources(rule).map(link).join('<span aria-hidden="true"> · </span>');
    return `
      ${rule.document?`<div class="rights-pulse-document">${esc(rule.document)}</div>`:''}
      <h3>${esc(rule.title)}</h3>
      <p>${esc(rule.text)}</p>
      <div class="rights-pulse-action"><span>${isCaseRule(rule)?'裁判要点':'现实提醒'}</span><strong>${esc(rule.action)}</strong></div>
      ${sources?`<div class="rights-pulse-sources">${sources}</div>`:''}`;
  }

  function bindRuleTabs(host,rules){
    const buttons=[...host.querySelectorAll('[data-rights-rule]')];
    if(buttons.length<2) return;

    const meta=host.querySelector('.rights-pulse-meta');
    const panel=host.querySelector('.rights-pulse-panel');

    function select(index,focus){
      const rule=rules[index];
      if(!rule) return;
      buttons.forEach((button,buttonIndex)=>{
        const selected=buttonIndex===index;
        button.setAttribute('aria-selected',selected?'true':'false');
        button.tabIndex=selected?0:-1;
      });
      meta.innerHTML=metaHtml(rule,rules.length);
      panel.innerHTML=panelHtml(rule);
      panel.setAttribute('aria-labelledby',buttons[index].id);
      const wrap=host.querySelector('.rights-pulse');
      if(wrap) wrap.id=`rule-${ruleId(rule,index)}`;
      if(focus) buttons[index].focus();
    }

    buttons.forEach((button,index)=>{
      button.addEventListener('click',()=>select(index,false));
      button.addEventListener('keydown',event=>{
        let next=null;
        if(event.key==='ArrowRight') next=(index+1)%buttons.length;
        if(event.key==='ArrowLeft') next=(index-1+buttons.length)%buttons.length;
        if(event.key==='Home') next=0;
        if(event.key==='End') next=buttons.length-1;
        if(next===null) return;
        event.preventDefault();
        select(next,true);
      });
    });
  }

  function bindHash(host,rules){
    if(rules.length<2) return;
    const apply=()=>{
      const match=(location.hash||'').match(/^#rule-(.+)$/);
      if(!match) return;
      const index=rules.findIndex((rule,position)=>ruleId(rule,position)===match[1]);
      if(index<0) return;
      if(index>0){
        const button=host.querySelector(`[data-rights-rule="${index}"]`);
        if(button) button.click();
      }
      host.scrollIntoView({block:'start'});
    };
    if(!bindHash.bound){
      window.addEventListener('hashchange',apply);
      bindHash.bound=true;
    }
    apply();
  }

  function render(){
    const host=ensureHost();
    const active=getActiveCase();
    const item=active&&updates[active.slug];
    const rules=normalizeRules(item);
    if(!rules.length){
      host.hidden=true;
      host.innerHTML='';
      return;
    }

    const first=rules[0];
    host.setAttribute('aria-label',rules.some(isCaseRule)?'关键规则与案例参考':'当前法律状态与消费者权利');
    const tabs=rules.length>1?`<div class="rights-pulse-tabs" role="tablist" aria-label="切换关键参考">${rules.map((rule,index)=>`<button class="rights-pulse-tab" type="button" role="tab" id="rightsRuleTab-${index}" aria-controls="rightsPulsePanel" aria-selected="${index===0?'true':'false'}" tabindex="${index===0?'0':'-1'}" data-rights-rule="${index}">${esc(rule.tab)}</button>`).join('')}</div>`:'';

    host.hidden=false;
    host.innerHTML=`<div class="wrap"><div class="rights-pulse" id="rule-${esc(ruleId(first,0))}">
      <div class="rights-pulse-meta">${metaHtml(first,rules.length)}</div>
      <div class="rights-pulse-content">
        ${tabs}
        <div class="rights-pulse-panel" id="rightsPulsePanel" role="tabpanel"${rules.length>1?' aria-labelledby="rightsRuleTab-0"':''}>${panelHtml(first)}</div>
      </div>
    </div></div>`;
    bindRuleTabs(host,rules);
    bindHash(host,rules);
  }

  function renderForSlug(slug){
    if(slug && document.body) document.body.dataset.activeCaseSlug=slug;
    render();
  }

  // allSources / verifiedAt 供共享渲染器使用：浏览器与预渲染用同一套 HTML 把权威层来源并入「原文」段。
  window.BuchikuiAuthority={
    getRules:slug=>normalizeRules(updates[slug]),
    allSources:slug=>allSources(updates[slug]),
    verifiedAt:slug=>itemVerified(updates[slug]),
    batchVerified:()=>VERIFIED,
    staticBlock:slug=>{
      const rules=normalizeRules(updates[slug]);
      if(!rules.length) return '';
      const blocks=rules.map((rule,index)=>`<div class="rights-pulse" id="rule-${esc(ruleId(rule,index))}"><div class="rights-pulse-meta">${metaHtml(rule,rules.length)}</div><div class="rights-pulse-content">${panelHtml(rule)}</div></div>`).join('');
      return `<div class="wrap">${blocks}</div>`;
    }
  };

  window.BuchikuiRights={render:renderForSlug,renderActive:render};
