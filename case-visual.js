(function(){
  const section=document.getElementById('caseVisual');
  const stamp=document.getElementById('caseStamp');
  if(!section||!stamp) return;

  const money=value=>`¥${Math.round(value).toLocaleString('zh-CN')}`;
  const pct=value=>`${(value*100).toFixed(2)}%`;
  const multiple=value=>`${value.toFixed(1)}×`;

  function getActiveCase(){
    const match=stamp.textContent.match(/CASE\s+(\d+)/);
    return match?window.BUCHIKUI_CASES.find(item=>item.id===match[1]):null;
  }

  function advisorValue(model,years){
    return model.principal*(1-model.purchaseFee)*Math.pow(1-model.recurringFee,years)*(1-model.redemptionFee);
  }

  function benchmarkValue(model,item,years){
    return model.principal*Math.pow(1-item.fee,years);
  }

  function renderMultiple(model,benchmark,years){
    const advisor=advisorValue(model,years);
    const reference=benchmarkValue(model,benchmark,years);
    const advisorCost=model.principal-advisor;
    const referenceCost=model.principal-reference;
    const advisorRate=advisorCost/model.principal;
    const referenceRate=referenceCost/model.principal;
    const ratio=advisorCost/referenceCost;

    return `<article class="cost-multiple">
      <div class="cost-multiple-head"><strong>${years} 年</strong><span>${String(years).padStart(2,'0')} YEAR</span></div>
      <div class="cost-multiple-number">${multiple(ratio)}</div>
      <p class="cost-multiple-rate"><b>投顾 ${pct(advisorRate)}</b><span>vs</span><b>IQQ ${pct(referenceRate)}</b></p>
      <div class="cost-multiple-money">
        <span>累计费用约 ${money(advisorCost)} vs ${money(referenceCost)}</span>
        <strong>相差 ${money(advisorCost-referenceCost)}</strong>
      </div>
    </article>`;
  }

  function render(){
    const active=getActiveCase();
    const model=active&&active.costModel;
    if(!model){
      section.hidden=true;
      section.innerHTML='';
      return;
    }

    const iqq=model.benchmarks.find(item=>item.name==='IQQ');
    if(!iqq){
      section.hidden=true;
      section.innerHTML='';
      return;
    }

    section.hidden=false;
    const visibleRoundTrip=model.principal*(model.purchaseFee+model.redemptionFee);
    const firstYearRecurring=model.principal*model.recurringFee;
    const tenYearFlatCost=model.principal-advisorValue(model,10);
    const recurringMultiple=model.recurringFee/iqq.fee;

    section.innerHTML=`<div class="wrap">
      <header class="cost-vis-head">
        <div><span class="cost-vis-kicker">费用倍率 / COST MULTIPLE</span><h2>真正惊人的，<br>不是 1.91%。<br>是约 19 倍。</h2></div>
        <p>把市场收益设成 0，只隔离费用本身：同样从 ${money(model.principal)} 出发，用 IQQ 作为低成本纳指 100 对标。比较的不是谁涨得更多，而是<strong>同一笔钱被费用吃掉的比例相差多少倍</strong>。</p>
      </header>
      <div class="cost-vis-grid">
        <article class="cost-iceberg">
          <div><h3>费用冰山</h3><small>买卖时最显眼的费用，只是水面上的一小块。</small></div>
          <div class="iceberg-meter" aria-label="费用冰山：一次性申购与赎回费用约 ${money(visibleRoundTrip)}，持续费用首年约 ${money(firstYearRecurring)}">
            <div class="iceberg-visible"><span class="iceberg-label">水面上 / 一次性</span><strong>${money(visibleRoundTrip)}</strong><p>申购 ${pct(model.purchaseFee)} + 赎回 ${pct(model.redemptionFee)}，按 1 万元粗略折算。</p></div>
            <div class="iceberg-hidden"><span class="iceberg-label">水面下 / 每年持续</span><strong>${pct(model.recurringFee)}</strong><p>底层基金运作费与投顾费合计。首年约 ${money(firstYearRecurring)}；横盘 10 年，连同进出费用累计约损耗 ${money(tenYearFlatCost)}。</p></div>
          </div>
        </article>
        <div class="cost-timeline">
          <div><h3>对标 IQQ：费用倍率</h3><small>下方比较“累计费用损耗率”。倍率越高，意味着为相近市场暴露付出的费用层级越重。</small></div>
          <div class="cost-multiples">${[1,5,10].map(years=>renderMultiple(model,iqq,years)).join('')}</div>
          <div class="cost-recurring-callout">
            <span>长期持续费用本身</span>
            <strong>${pct(model.recurringFee)} ÷ ${pct(iqq.fee)} = ${multiple(recurringMultiple)}</strong>
            <p>1 年的总倍率更高，是因为还叠加了申购和赎回这两个一次性成本。持有期拉长后倍率略回落，不代表投顾变便宜；累计被费用侵蚀的金额仍持续扩大。</p>
          </div>
        </div>
      </div>
      <p class="cost-vis-note"><strong>口径：</strong>市场横盘、无分红，只比较费用造成的本金损耗。投顾示例按申购费 ${pct(model.purchaseFee)}、持续费用 ${pct(model.recurringFee)}/年、退出赎回费 ${pct(model.redemptionFee)} 计算；IQQ 只计当前产品自身净费用率 ${pct(iqq.fee)}。尚未计入投顾调仓摩擦，也未计入 ETF 券商佣金、买卖价差、汇兑与税费。IQQ 当前费率以后续官方资料为准。</p>
    </div>`;
  }

  new MutationObserver(render).observe(stamp,{childList:true,characterData:true,subtree:true});
  render();
})();
