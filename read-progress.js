(()=>{
  'use strict';

  // 阅读进度 + 当前章节指示：只给位置感，不做第二套导航（产品规范红线）。
  // 装饰性元素，对读屏隐藏；章节名取自现有 section，不新增信息架构。
  const SECTIONS=[
    ['.hero','主张'],
    ['#rightsPulse','权利校验'],
    ['#caseOverview','案例介绍'],
    ['#serviceStandard','服务基线'],
    ['#cases','场景'],
    ['#evidence','证据'],
    ['#route','路径'],
    ['#template','模板'],
    ['#discussion','讨论'],
  ];

  const host=document.createElement('div');
  host.className='read-progress';
  host.setAttribute('aria-hidden','true');
  host.innerHTML='<span class="read-progress-track"><i id="readProgressFill"></i></span><span class="read-progress-label" id="readProgressLabel"></span>';
  document.body.prepend(host);
  const fill=host.querySelector('#readProgressFill');
  const label=host.querySelector('#readProgressLabel');

  function visibleTargets(){
    return SECTIONS
      .map(([selector,name])=>({element:document.querySelector(selector),name}))
      .filter(({element})=>element&&!element.hidden&&element.offsetParent!==null);
  }

  const spy=new IntersectionObserver((entries)=>{
    let best=null;
    for(const entry of entries){
      if(!entry.isIntersecting) continue;
      if(!best||entry.intersectionRatio>best.intersectionRatio) best=entry;
    }
    if(best){
      const found=visibleTargets().find(({element})=>element===best.target);
      if(found&&label.textContent!==found.name) label.textContent=found.name;
    }
  },{rootMargin:'-38% 0px -55% 0px',threshold:[0,0.25,0.5,0.75,1]});

  function watch(){
    spy.disconnect();
    visibleTargets().forEach(({element})=>spy.observe(element));
  }

  function paint(){
    const max=document.documentElement.scrollHeight-window.innerHeight;
    const ratio=max>0?Math.min(1,Math.max(0,window.scrollY/max)):0;
    fill.style.width=`${(ratio*100).toFixed(1)}%`;
  }

  const main=document.querySelector('main');
  if(main) new MutationObserver(watch).observe(main,{childList:true,subtree:true});
  window.addEventListener('scroll',paint,{passive:true});
  window.addEventListener('resize',paint);
  watch();
  paint();
})();
