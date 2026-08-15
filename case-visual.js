(function(){
  const section=document.getElementById('caseVisual');
  const stamp=document.getElementById('caseStamp');
  if(!section||!stamp) return;

  const money=value=>`¥${Math.round(value).toLocaleString('zh-CN')}`;
  const pct=value=>`${(value*100).toFixed(2)}%`;
  const multiple=value=>`${value.toFixed(2)}×`;

  function getActiveCase(){
    const match=stamp.textContent.match(/CASE\s+(\d+)/);
    return match?window.BUCHIKUI_CASES.find(item=>item.id===match[1]):null;
  }

  function cumulativeLoss(rate,years){
    return 1-Math.pow(1-rate,years);
  }

  function renderMultiple(model,benchmark,years){
    const advisorRate=cumulativeLoss(model.annualizedComparisonFee,years);
    const referenceRate=cumulativeLoss(benchmark.fee,years);
    const advisorCost=model.principal*advisorRate;
    const referenceCost=model.principal*referenceRate;
    const ratio=advisorRate/referenceRate;

    return `<article class="cost-multiple">
      <div class="cost-multiple-head"><strong>${years} 年</strong><span>${String(years).padStart(2,'0')} YEAR</span></div>
      <div class="cost-multiple-number">${multiple(ratio)}</div>
      <p class="cost-multiple-rate"><b>投顾 ${pct(advisorRate)}</b><span>vs</span><b>IQQ ${pct(referenceRate)}</b></p>
      <div class="cost-multiple-money">
        <span>等效累计损耗约 ${money(advisorCost)} vs ${money(referenceCost)}</span>
        <strong>相差 ${money(advisorCost-referenceCost)}</strong>
      </div>
    </article>`;
  }

  function render(){
    const active=getActiveCase();
    const model=active&&active.costModel;
    if(!model||!model.annualizedComparisonFee){
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
    const recurringMultiple=model.recurringFee/iqq.fee;

    section.innerHTML=`<div class="wrap">
      <header class="cost-vis-head">
        <div><span class="cost-vis-kicker">费用倍率 / COST MULTIPLE</span><h2>一年约 19 倍。<br>十年仍约 18 倍。</h2></div>
        <p>这里把一年综合成本 <strong>${pct(model.annualizedComparisonFee)}</strong> 作为年化等效费率，与 IQQ 的 <strong>${pct(iqq.fee)}</strong> 用完全相同的复利公式比较。核心不是“少了多少钱”，而是<strong>费用侵蚀的量级究竟差多少倍</strong>。</p>
      </header>
      <div class="cost-vis-grid">
        <article class="cost-iceberg">
          <div><h3>费用冰山</h3><small>买卖时最显眼的费用，只是水面上的一小块。</small></div>
          <div class="iceberg-meter" aria-label="费用冰山：一次性申购与赎回费用约 ${money(visibleRoundTrip)}，持续费用首年约 ${money(firstYearRecurring)}">
            <div class="iceberg-visible"><span class="iceberg-label">水面上 / 一次性</span><strong>${money(visibleRoundTrip)}</strong><p>申购 ${pct(model.purchaseFee)} + 赎回 ${pct(model.redemptionFee)}，按 1 万元粗略折算。</p></div>
            <div class="iceberg-hidden"><span class="iceberg-label">水面下 / 每年持续</span><strong>${pct(model.recurringFee)}</strong><p>底层基金运作费与投顾费合计，首年约 ${money(firstYearRecurring)}。这部分才是长期持续侵蚀的主体。</p></div>
          </div>
        </article>
        <div class="cost-timeline">
          <div><h3>对标 IQQ：费用倍率</h3><small>公式统一为：累计费用损耗 = 1 − (1 − 年化费率)<sup>n</sup>。</small></div>
          <div class="cost-multiples">${[1,5,10].map(years=>renderMultiple(model,iqq,years)).join('')}</div>
          <div class="cost-recurring-callout">
            <span>公式口径</span>
            <strong>[1 − (1 − 1.91%)ⁿ] ÷ [1 − (1 − 0.10%)ⁿ]</strong>
            <p>1 年约 19.10 倍，5 年约 18.42 倍，10 年约 17.62 倍。倍率随时间略下降，是复利损耗的数学结果；并不意味着绝对费用损耗在下降。</p>
          </div>
          <div class="cost-recurring-callout">
            <span>持续费用本身</span>
            <strong>${pct(model.recurringFee)} ÷ ${pct(iqq.fee)} = ${recurringMultiple.toFixed(1)}×</strong>
            <p>投顾示例中约 1.70%/年的底层基金运作费 + 投顾费，与 IQQ 0.10% 的当前净费用率相比，本身就是约 17 倍的持续费用层级。</p>
          </div>
        </div>
      </div>
      <p class="cost-vis-note"><strong>口径说明：</strong>${pct(model.annualizedComparisonFee)} 来自本页“一年横盘”综合成本算例，其中包含一次性的申购 / 赎回费。5 年和 10 年这里把它视为<strong>年化等效费率</strong>做同口径复利比较，是为了看费用量级，不表示一次性费用在真实长期持有中每年都会重复发生。尚未计入投顾调仓摩擦，也未计入 ETF 券商佣金、买卖价差、汇兑与税费。</p>
    </div>`;
  }

  new MutationObserver(render).observe(stamp,{childList:true,characterData:true,subtree:true});
  render();
})();
