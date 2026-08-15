(function(){
  const section=document.getElementById('caseVisual');
  const stamp=document.getElementById('caseStamp');
  if(!section||!stamp) return;

  const money=value=>`¥${Math.round(value).toLocaleString('zh-CN')}`;
  const pct=value=>`${(value*100).toFixed(2)}%`;

  function getActiveCase(){
    const match=stamp.textContent.match(/CASE\s+(\d+)/);
    return match?window.BUCHIKUI_CASES.find(item=>item.id===match[1]):null;
  }

  function advisorValue(model,years,rebalanceDrag=0){
    return model.principal*(1-model.purchaseFee)*Math.pow((1+model.grossReturn)*(1-model.recurringFee)*(1-rebalanceDrag),years)*(1-model.redemptionFee);
  }

  function benchmarkValue(model,item,years){
    return model.principal*Math.pow((1+model.grossReturn)*(1-item.fee),years);
  }

  function renderHorizon(model,iqq,years){
    const advisor=advisorValue(model,years,0);
    const reference=benchmarkValue(model,iqq,years);
    const gap=reference-advisor;
    const gapRate=gap/reference;
    const max=Math.max(advisor,reference);
    return `<article class="wealth-horizon">
      <div class="wealth-horizon-head"><strong>${years} 年</strong><span>${String(years).padStart(2,'0')} YEAR</span></div>
      <div class="wealth-bars">
        <div class="wealth-bar iqq">
          <div class="wealth-bar-copy"><b>IQQ</b><strong>${money(reference)}</strong></div>
          <div class="wealth-track" aria-hidden="true"><div class="wealth-fill" style="--bar:${(reference/max*100).toFixed(2)}%"></div></div>
        </div>
        <div class="wealth-bar advisor">
          <div class="wealth-bar-copy"><b>投顾 · 已知成本下限</b><strong>${money(advisor)}</strong></div>
          <div class="wealth-track" aria-hidden="true"><div class="wealth-fill" style="--bar:${(advisor/max*100).toFixed(2)}%"></div></div>
        </div>
      </div>
      <div class="wealth-gap"><span>即使假设调仓摩擦 = 0</span><strong>仍少 ${money(gap)} · ${pct(gapRate)}</strong></div>
    </article>`;
  }

  function renderSensitivity(model,iqq){
    const years=10;
    const reference=benchmarkValue(model,iqq,years);
    const scenarios=[0,...model.rebalanceSensitivity];
    return scenarios.map(drag=>{
      const value=advisorValue(model,years,drag);
      const gap=reference-value;
      const label=drag===0?'0% · 已知成本下限':`+${pct(drag)} / 年`;
      return `<div class="rebalance-row">
        <span>${label}</span>
        <strong>${money(value)}</strong>
        <em>比 IQQ 少 ${money(gap)}</em>
      </div>`;
    }).join('');
  }

  function render(){
    const active=getActiveCase();
    const model=active&&active.costModel;
    if(!model||!model.grossReturn){
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
    const iqqTen=benchmarkValue(model,iqq,10);

    section.innerHTML=`<div class="wrap">
      <header class="cost-vis-head">
        <div><span class="cost-vis-kicker">费用复利 / COST COMPOUNDING</span><h2>同样 8%，<br>费用会把终点拉开。</h2></div>
        <p>假设投顾组合和 IQQ 背后的市场暴露都获得同样的 <strong>${pct(model.grossReturn)}</strong> 年化毛收益。投顾主线甚至先把调仓摩擦设成 0——也就是说，这已经是一个<strong>偏乐观的成本下限</strong>。</p>
      </header>
      <div class="cost-vis-grid">
        <div class="cost-timeline">
          <div><h3>同样年化 8%，最后留下多少？</h3><small>IQQ 只计当前产品自身净费用率 ${pct(iqq.fee)}；投顾主线计已知费用，并暂时假设调仓摩擦为 0。</small></div>
          <div class="wealth-horizons">${[5,10,20].map(years=>renderHorizon(model,iqq,years)).join('')}</div>
          <div class="rebalance-sensitivity">
            <div class="rebalance-head">
              <div><span>10 年敏感性</span><strong>未知调仓成本，会继续拉开差距。</strong></div>
              <p>IQQ 10 年约 ${money(iqqTen)}。下列 0.20% / 0.50% / 1.00% 只是年化等效摩擦情景，不是对产品真实调仓成本的认定。</p>
            </div>
            <div class="rebalance-rows">${renderSensitivity(model,iqq)}</div>
          </div>
        </div>
      </div>
      <p class="cost-vis-note"><strong>计算口径：</strong>投顾已知成本下限 = ${money(model.principal)} × (1 − ${pct(model.purchaseFee)}) × [ (1 + ${pct(model.grossReturn)}) × (1 − ${pct(model.recurringFee)}) ]ⁿ × (1 − ${pct(model.redemptionFee)})；调仓敏感性再额外乘入 (1 − 调仓摩擦)ⁿ。IQQ = ${money(model.principal)} × [ (1 + ${pct(model.grossReturn)}) × (1 − ${pct(iqq.fee)}) ]ⁿ。两边都只是费用隔离模型，不是收益预测；ETF 自身的佣金、价差、汇兑和税费未计入。</p>
    </div>`;
  }

  new MutationObserver(render).observe(stamp,{childList:true,characterData:true,subtree:true});
  render();
})();
