(function(){
  const cases=window.BUCHIKUI_CASES||[];
  if(!cases.length) return;

  const params=new URLSearchParams(location.search);
  const requested=params.get('case');
  const active=cases.find(item=>item.slug===requested)||cases[Math.floor(Math.random()*cases.length)];

  const byId=id=>document.getElementById(id);
  const setHtml=(id,value)=>{byId(id).innerHTML=value};
  const escapeAttr=value=>String(value).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  document.title=active.meta.title;
  document.querySelector('meta[name="description"]').setAttribute('content',active.meta.description);
  document.querySelector('meta[property="og:title"]').setAttribute('content',active.meta.ogTitle);
  document.querySelector('meta[property="og:description"]').setAttribute('content',active.meta.ogDescription);

  byId('caseName').textContent=`CASE ${active.id} · ${active.name}`;
  byId('caseStamp').textContent=`CASE ${active.id} / ${active.label}`;
  setHtml('heroTitle',active.hero.title);
  setHtml('heroCopy',active.hero.copy);
  setHtml('panicTitle',active.panic.title);
  byId('panicList').innerHTML=active.panic.items.map(item=>`<li><div><strong>${item.title}</strong>${item.text}</div></li>`).join('');

  byId('scenarioNav').textContent=`${active.scenarios.length} 个场景`;
  byId('situationList').innerHTML='<span class="situation-label">我遇到的是：</span>'+active.scenarios.map((item,index)=>`<a href="#case-${index+1}">${item.short}</a>`).join('');
  byId('casesKicker').textContent=active.section.kicker;
  setHtml('casesTitle',active.section.title);
  setHtml('casesIntro',active.section.intro);
  byId('caseList').innerHTML=active.scenarios.map((item,index)=>{
    const blocks=item.blocks.map(block=>`<div class="case-block${block.full?' full':''}"><b>${block.label}</b>${block.html}</div>`).join('');
    return `<article class="case" id="case-${index+1}"><div class="case-no">${String(index+1).padStart(2,'0')}</div><div class="case-title"><span class="risk">${item.risk}</span><h3>${item.title}</h3></div><div class="case-body">${blocks}</div></article>`;
  }).join('');

  setHtml('evidenceTitle',active.evidence.title);
  setHtml('evidenceIntro',active.evidence.intro);
  byId('evidenceFootnote').textContent=active.evidence.footnote;
  byId('checklist').innerHTML=active.evidence.items.map(item=>`<label class="check"><input type="checkbox" data-evidence="${escapeAttr(item.key)}"><span class="box"></span><span><strong>${item.title}</strong><small>${item.detail}</small></span><span class="when">${item.when}</span></label>`).join('');

  setHtml('routeIntro',active.route.intro);
  byId('routeGrid').innerHTML=active.route.steps.map((step,index)=>`<article class="route-step"><span class="n">STEP ${String(index+1).padStart(2,'0')}</span><h3>${step.title}</h3><p>${step.text}</p><a href="${escapeAttr(step.href)}"${step.href.startsWith('http')?' target="_blank" rel="noopener"':''}>${step.link}</a></article>`).join('');
  setHtml('routeNote',active.route.note);

  setHtml('templateTitle',active.template.title);
  setHtml('templateIntro',active.template.intro);
  byId('templateText').textContent=active.template.text;

  byId('sourcesTitle').textContent=`本页依据与官方入口（更新：${active.updated}）`;
  byId('sourceList').innerHTML=active.sources.map(source=>`<li><a href="${escapeAttr(source.href)}" target="_blank" rel="noopener">${source.title}</a> — ${source.note}</li>`).join('');
  byId('legalText').textContent=active.legal;

  const evidenceKey=`buchikui-${active.slug}-evidence-v1`;
  const boxes=[...document.querySelectorAll('[data-evidence]')];
  const count=byId('progressCount');
  function persistEvidence(){
    const n=boxes.filter(box=>box.checked).length;
    count.textContent=`${n} / ${boxes.length}`;
    localStorage.setItem(evidenceKey,JSON.stringify(Object.fromEntries(boxes.map(box=>[box.dataset.evidence,box.checked]))));
  }
  try{
    const saved=JSON.parse(localStorage.getItem(evidenceKey)||'{}');
    boxes.forEach(box=>box.checked=!!saved[box.dataset.evidence]);
  }catch(e){}
  boxes.forEach(box=>box.addEventListener('change',persistEvidence));
  persistEvidence();

  document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));

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
  document.querySelectorAll('[data-share]').forEach(button=>button.addEventListener('click',sharePage));

  byId('copyTemplate').addEventListener('click',async function(){
    const text=byId('templateText').innerText;
    try{
      await navigator.clipboard.writeText(text);
      this.textContent='已复制';
      setTimeout(()=>this.textContent='复制',1400);
    }catch(e){window.prompt('复制以下内容：',text)}
  });
})();
