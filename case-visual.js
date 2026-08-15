(function(){
  const section=document.getElementById('caseVisual');
  const stamp=document.getElementById('caseStamp');
  if(!section||!stamp) return;

  let mode='flat';
  const money=value=>`¥${Math.round(value).toLocaleString('zh-CN')}`;
  const pct=value=>`${(value*100).toFixed(2)}%`;

  function getActiveCase(){
    const match=stamp.textContent.match(/CASE\s+(\d+)/);
    return match?window.BUCHIKUI_CASES.find(item=>item.id===match[1]):null;
  }

  function advisorValue(visual,years,grossReturn){
    return visual.principal*(1-visual.purchaseFee)*Math.pow((1+grossReturn)*(1-visual.recurringFee),years)*(1-visual.redemptionFee);
  }

  function benchmarkValue(visual,item,years,grossReturn){
    return visual.principal*Math.pow((1+grossReturn)*(1-item.fee),years);
  }

  function renderBars(visual,years,grossReturn){
    const advisor=advisorValue(visual,years,grossReturn);
    const values=visual.benchmarks.map(item=>({name:item.name,value:benchmarkValue(visual,item,years,grossReturn)}));
    const all=[{name:'投顾示例',value:advisor,className:'advisor'},...values.map(item=>({...item,className:item.name.toLowerCase()}))];
    const max=Math.max(...all.map(item=>item.value));
    const iqq=values.find(item=>item.name==='IQQ');
    return `<article class="cost-horizon">
      <div class="cost-horizon-head"><strong>${years} 年</strong><span>${String(years).padStart(2,'0')} YEAR</span></div>
      <div class="cost-bars">
        ${all.map(item=>`<div class="cost-bar ${item.className}">
          <div class="cost-bar-copy"><b>${item.name}</b><strong>${money(item.value)}</strong></div>
          <div class="cost-track" aria-hidden="true"><div class="cost-fill" style="--bar:${(item.value/max*100).toFixed(2)}%"></div></div>
        </div>`).join('')}
      </div>
      <div class="cost-gap">相对 IQQ 少留下<strong>${money(iqq.value-advisor)}</strong></div>
    </article>`;
  }

  function render(){
    const active=getActiveCase();
    const visual=active&&active.visual;
    if(!visual||visual.type!=='cost-compound'){
      section.hidden=true;
      section.innerHTML='';
      return;
    }

    section.hidden=false;
    const grossReturn=mode==='growth'?visual.growthRate:0;
    const visibleRoundTrip=visual.principal*(visual.purchaseFee+visual.redemptionFee);
    const firstYearRecurring=visual.principal*visual.recurringFee;
    const tenYearFlatCost=visual.principal-advisorValue(visual,10,0);

    section.innerHTML=`<div class="wrap">
      <header class="cost-vis-head">
        <div><span class="cost-vis-kicker">费用复利 / COST COMPOUNDING</span><h2>小费率，<br>会被时间放大。</h2></div>
        <p>同样从 ${money(visual.principal)} 出发。先把市场收益设成 0，只看费用本身怎么侵蚀本金；再切到“所有产品底层都同样年化 ${pct(visual.growthRate)}”的示意，观察费用如何进一步吃掉复利。</p>
      </header>
      <div class="cost-vis-grid">
        <article class="cost-iceberg">
          <div><h3>费用冰山</h3><small>买卖时最显眼的费用，其实只是水面上的一小块。</small></div>
          <div class="iceberg-meter" aria-label="费用冰山：一次性申购与赎回费用约 ${money(visibleRoundTrip)}，持续费用首年约 ${money(firstYearRecurring)}">
            <div class="iceberg-visible"><span class="iceberg-label">水面上 / 一次性</span><strong>${money(visibleRoundTrip)}</strong><p>申购 0.12% + 赎回 0.10%，按 1 万元粗略折算。</p></div>
            <div class="iceberg-hidden"><span class="iceberg-label">水面下 / 每年持续</span><strong>${pct(visual.recurringFee)}</strong><p>基金运作费约 1.20% + 投顾费约 0.50%。首年约 ${money(firstYearRecurring)}；横盘 10 年后，连同进出费用累计约损耗 ${money(tenYearFlatCost)}。</p></div>
          </div>
        </article>
        <div class="cost-timeline">
          <div><h3>时间放大器</h3><small>柱长只用于同一持有期内横向比较；金额才是主信息。</small></div>
          <div class="cost-mode" role="group" aria-label="切换费用复利假设">
            <button type="button" data-cost-mode="flat" aria-pressed="${mode==='flat'}">市场横盘 0%</button>
            <button type="button" data-cost-mode="growth" aria-pressed="${mode==='growth'}">同样年化 ${pct(visual.growthRate)}（示意）</button>
          </div>
          <div class="cost-horizons">${[1,5,10].map(years=>renderBars(visual,years,grossReturn)).join('')}</div>
        </div>
      </div>
      <p class="cost-vis-note"><strong>${mode==='flat'?'当前模式：只隔离费用影响。':'当前模式：同样年化 8% 只是说明性假设，不是收益预测。'}</strong> 投顾示例按申购费 ${pct(visual.purchaseFee)}、持续费用 ${pct(visual.recurringFee)}/年、退出赎回费 ${pct(visual.redemptionFee)} 计算；IQQ / QQQ / VOO 只计当前产品自身年费率，不含券商佣金、买卖价差、汇兑、税费等。IQQ 当前 0.10% 为费率减免后的净费用率，未来可能变化。</p>
    </div>`;
  }

  section.addEventListener('click',event=>{
    const button=event.target.closest('[data-cost-mode]');
    if(!button) return;
    mode=button.dataset.costMode;
    render();
  });

  new MutationObserver(render).observe(stamp,{childList:true,characterData:true,subtree:true});
  render();
})();
