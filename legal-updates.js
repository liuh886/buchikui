(function(){
  const VERIFIED='2026-08-21';
  const updates={
    rental:{
      status:'现行',
      authority:'部门规章 · 最高法典型案例 · 行业政策',
      effective:'2026-02-01',
      title:'平台不能只说“这是商户纠纷”。',
      text:'平台依据自身规则对消费者采取不利处理，应说明事实、理由和依据，提供申诉复核；消费者要求人工判定时，不能只交给 AI / 系统。2026 年租车三年行动方案又直接要求推广合同示范文本，明确押金退还、事故和违章处理、违约责任，并点名治理“天价定损”、加强租赁电商平台资质审核。最高法最新典型案例进一步提示：平台掌握的交易、资金、投诉数据和实际控制能力，会影响其是否尽到必要的平台责任。',
      action:'遇到扣款、定损或平台推诿，要求四样东西：具体规则条款、商户提交材料、平台审核依据、人工复核结果；租车定损再追加损伤事实和金额计算依据。',
      sources:[
        {title:'【部门规章】《网络交易平台规则监督管理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2026/art_85b474fc5a08494bb60ca6a280b98d7d.html'},
        {title:'【政策文件】租车高质量发展三年行动方案（2026—2028年）',href:'https://xxgk.mot.gov.cn/jigou/ysfws/202606/t20260605_4206926.html'},
        {title:'【最高法典型案例】平台数据优势与必要措施责任',href:'https://www.court.gov.cn/zixun/xiangqing/507691.html'}
      ]
    },
    'beauty-hair':{
      status:'现行',
      authority:'司法解释 · 最高法典型案例',
      effective:'2025-05-01',
      title:'消费记录在商家手里，不代表消费者只能认栽。',
      text:'最高法预付式消费司法解释已经把几个高频痛点写成明确规则：符合条件的首次预付消费可在付款后七日内请求返还本金；非因消费者原因退款时，已消费项目原则上按折扣价或优惠比例计算；商家控制合同、消费次数、金额、余额等证据却无正当理由拒不提交，法院可以结合消费者主张认定争议事实；恶意“卷款跑路”还可能触发惩罚性赔偿。',
      action:'退卡、闭店、余额争议时，把“我要退款”改成三项具体请求：完整合同和消费流水、按现行规则计算的退款明细、剩余余额；商家拒绝提供自己控制的记录，也要把“拒绝提供”固定成证据。',
      sources:[
        {title:'【司法解释】最高法预付式消费司法解释',href:'https://gongbao.court.gov.cn/Details/415add6e9c15736f2fbd871bdb1538.html'},
        {title:'【最高法典型案例】预付消费证据、退款与职业闭店',href:'https://www.court.gov.cn/zixun/xiangqing/459331.html'}
      ]
    },
    'bank-small-account-fee':{
      status:'现行',
      authority:'监管典型案例 · 部门规章',
      title:'“系统自动扣”不是收费依据。',
      text:'金融监管部门已将“个人客户唯一账户仍被收取年费和小额账户管理费”列为违规收费，并公开过整改退费和处罚案例。《商业银行服务价格管理办法》还要求银行建立收费投诉登记、调查、处理和答复机制。',
      action:'要求银行逐笔说明：扣费当日你在该行有几个账户、哪个账户享受减免、收费依据是哪一条、投诉调查结论是什么。不要只接受“系统就是这样扣”的答复。',
      sources:[
        {title:'【监管典型案例】唯一账户违规收费',href:'https://www.nfra.gov.cn/cn/view/pages/ItemDetail.html?docId=1130947&generaltype=0&itemId=4099'},
        {title:'【部门规章】《商业银行服务价格管理办法》',href:'https://www.nfra.gov.cn/cn/view/pages/rulesDetail.html?docId=274908&itemId=4214'}
      ]
    },
    'mobile-plan-cost':{
      status:'现行',
      authority:'行业规范 · 部门规章 · 监管动态',
      title:'同等条件的老用户，不应被一句“你办不了”挡住。',
      text:'现行资费营销规则要求，同一本地网营业区内具有同等交易条件的同类用户，对资费方案应享有同等选择权；除合同另有约定外，不得强制或限制用户选择、变更任一在售资费方案。2026 年通信监管仍在直接点名“新老用户不同权”和套餐变更难。投诉后 15 日未答复或处理不满意即可申诉；收费争议超过 5 个月再申诉，通常不予受理。',
      action:'客服说“仅限新用户 / 老用户不能办”时，要求写进工单：套餐是否仍在售、你的号码具体缺少哪项交易条件、限制来自哪份规则、有没有同档替代方案。收费争议不要拖过 5 个月。',
      sources:[
        {title:'【行业规范】进一步规范电信资费营销行为',href:'https://shca.miit.gov.cn/zwgk/zcwj/wjfb/art/2022/art_2265bad324484a1fb243f5231c1014a5.html'},
        {title:'【部门规章】《电信用户申诉处理办法》',href:'https://www.miit.gov.cn/zwgk/zcwj/flfg/art/2020/art_b2e4b04d28f84f0d8c11e76c2b5c650a.html'},
        {title:'【2026监管动态】新老用户同等权益与套餐变更',href:'https://cqca.miit.gov.cn/xwdt/gzdt/art/2026/art_61fe759a72a746ab96fb624b211fad8c.html'}
      ]
    },
    'internet-court-self-litigation':{
      status:'现行',
      authority:'司法解释 · 全国诉讼服务规则',
      effective:'2025-11-01',
      title:'先选对法院，再用全国统一入口和要素式文本。',
      text:'互联网法院的新集中管辖范围已于 2025-11-01 起施行；能网上立案，不等于案件当然归互联网法院。2025-12-01 起，全国法院统一电子诉讼服务平台正式启用；67 类起诉状、答辩状示范文本也已全国推广，2026 年仍持续作为便利自行诉讼的重要工具。',
      action:'立案前先写清“为什么这个法院有管辖权”，再优先用人民法院在线服务全国版和对应的要素式示范文本；不要自己从零写一篇长起诉状。',
      sources:[
        {title:'【司法解释】互联网法院案件管辖规定',href:'https://www.court.gov.cn/zixun/xiangqing/478291.html'},
        {title:'【诉讼服务】全国法院统一电子诉讼服务平台',href:'https://www.court.gov.cn/zixun/xiangqing/482581.html'},
        {title:'【最高法】67类起诉状答辩状示范文本',href:'https://www.court.gov.cn/zixun/xiangqing/468671.html'},
        {title:'【2026典型案例】示范文本应用第四批',href:'https://www.court.gov.cn/zixun/xiangqing/505271.html'}
      ]
    },
    'alipay-advisor-cost':{
      status:'现行',
      authority:'证监会规则',
      effective:'2026-01-01',
      title:'基金投顾不得双重收费。',
      text:'基金销售费用新规已经生效：降低多类基金销售费用，明确持有期限超过一年的基金份额（货币市场基金等例外除外）不得继续收取销售服务费，并要求基金投顾业务不得双重收费。费用不能因为被拆成“底层基金 + 投顾 + 销售”几层就失去可解释性。',
      action:'买前把投顾费、底层基金运作费、申赎费、销售服务费分层列出来；同一项服务疑似重复收费时，要求机构写清收费项目、计提基数、费率和规则依据。',
      sources:[
        {title:'【证监会规则】《公开募集证券投资基金销售费用管理规定》',href:'https://www.csrc.gov.cn/csrc/c100028/c7606047/content.shtml'}
      ],
      upcoming:{
        effective:'2026-09-30',
        authority:'八部门联合办法',
        title:'第三方互联网平台将不能介入金融产品的签约、资金划转和适当性测评。',
        text:'《金融产品网络营销管理办法》届时生效：第三方平台不得介入或变相介入销售合同签订、资金划转、适当性测评，也不得就金融产品与消费者进行互动咨询；购买环节原则上应跳转至金融机构自营平台。'
      },
      upcomingSource:{title:'【即将生效】《金融产品网络营销管理办法》',href:'https://www.cac.gov.cn/2026-04/24/c_1778769008779432.htm'}
    },
    'bank-wealth-not-guaranteed':{
      status:'现行',
      authority:'部门规章',
      effective:'2026-02-01',
      title:'风险测评不是“过关考试”。',
      text:'《金融机构产品适当性管理办法》禁止金融机构代替客户评估、不当提示或以其他方式影响评估结果真实性；产品风险高于客户风险承受能力，原则上属于不具备适当性；通过互联网销售也必须把适当性管理嵌入流程。',
      action:'自己填、如实填并保存结果。有人教你“这个选高一点才能买”时，把话术、测评前后页面、产品风险等级一起固定下来；之后投诉不要只说“亏了”，而要指出具体哪一步适当性义务失守。',
      sources:[
        {title:'【部门规章】《金融机构产品适当性管理办法》',href:'https://www.nfra.gov.cn/cn/view/pages/rulesDetail.html?docId=1217183'}
      ],
      upcoming:{
        effective:'2026-09-30',
        authority:'八部门联合办法',
        title:'第三方平台不能替金融机构做适当性，也不能用品牌混同替代责任主体。',
        text:'新规生效后，第三方互联网平台不得介入适当性测评或销售合同签订，不得就金融产品提供互动咨询，并应清晰展示实际提供金融产品的金融机构。'
      },
      upcomingSource:{title:'【即将生效】《金融产品网络营销管理办法》',href:'https://www.cac.gov.cn/2026-04/24/c_1778769008779432.htm'}
    },
    'appliance-repair-trap':{
      status:'现行',
      authority:'部门规章',
      effective:'2026-04-15',
      title:'别只写“诈骗”：退费是投诉，违法线索是举报。',
      text:'2026 年新的《市场监督管理投诉举报处理办法》已经生效。同一份材料同时包含消费投诉和违法举报时，市场监管部门应分别处理；调解过程中发现涉嫌违反市场监管法律法规规章的线索，也应另行核查。调解没谈成，不等于违法线索一起结束。',
      action:'在 12315 材料里直接分两栏：投诉诉求写退款金额和理由；举报线索写冒充官方、虚假 / 误导宣传、未明码标价、低价诱骗高价结算等具体事实。虚报故障、故意替换正常部件等行业违规，再向属地商务主管部门或当地承接执法部门反映。',
      sources:[
        {title:'【2026部门规章】《市场监督管理投诉举报处理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2026/art_e4d03a20c0fd49769e408c7bf3791ff5.html'}
      ]
    },
    'rental-credit-card-first':{
      status:'现行',
      authority:'部门规章 · 行政法规',
      effective:'2026-02-01',
      title:'旧扣款争议，别只看今天的协议。',
      text:'平台规则和付款授权会更新。现行规则要求平台保存相应历史规则版本，非银行支付机构的交易记录自交易结束后至少保存五年；平台依据规则对消费者采取不利处理时，还应说明事实、理由和依据并提供申诉、人工复核。',
      action:'要求提供交易当时的付款授权、当时版本的平台规则、原始支付指令和交易记录、商户提交的扣款凭证。平台不要只回复“商户发起”或“系统处理”。',
      sources:[
        {title:'【部门规章】《网络交易平台规则监督管理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2026/art_85b474fc5a08494bb60ca6a280b98d7d.html'},
        {title:'【部门规章】《非银行支付机构监督管理条例实施细则》',href:'https://www.pbc.gov.cn/tiaofasi/144941/144979/3941920/2025111716285425957/2024042210595110796.pdf'}
      ]
    }
  };

  const esc=value=>String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const link=source=>source?`<a href="${esc(source.href)}" target="_blank" rel="noopener">${esc(source.title)} →</a>`:'';
  const allSources=item=>[...(item.sources||[]),item.upcomingSource].filter(Boolean);

  function getActiveCase(){
    const name=document.getElementById('caseName')?.textContent?.trim();
    return (window.BUCHIKUI_CASES||[]).find(item=>item.name===name)||null;
  }

  function ensureHost(){
    let host=document.getElementById('rightsPulse');
    if(host) return host;
    host=document.createElement('section');
    host.id='rightsPulse';
    host.setAttribute('aria-label','当前法律状态与消费者权利');
    const hero=document.querySelector('.hero');
    if(hero) hero.insertAdjacentElement('afterend',host);
    return host;
  }

  function syncSources(item){
    const list=document.getElementById('sourceList');
    if(!list) return;
    const sources=allSources(item);
    const existing=new Set([...list.querySelectorAll('a[href]')].map(anchor=>anchor.href));
    sources.forEach(source=>{
      let normalized=source.href;
      try{normalized=new URL(source.href,location.href).href}catch(error){}
      if(existing.has(normalized)) return;
      const li=document.createElement('li');
      const a=document.createElement('a');
      a.href=source.href;
      a.target='_blank';
      a.rel='noopener';
      a.textContent=source.title;
      li.append(a,document.createTextNode(` — 当前权利更新依据；法律核验 ${VERIFIED}。`));
      list.appendChild(li);
      existing.add(normalized);
    });
    const title=document.getElementById('sourcesTitle');
    if(title&&!title.textContent.includes('权利核验')) title.textContent+=` · 权利核验 ${VERIFIED}`;
  }

  function render(){
    const host=ensureHost();
    const active=getActiveCase();
    const item=active&&updates[active.slug];
    if(!item){
      host.hidden=true;
      host.innerHTML='';
      return;
    }

    const sources=(item.sources||[]).map(link).join('<span aria-hidden="true"> · </span>');
    const upcoming=item.upcoming?`<div class="rights-pulse-upcoming"><div class="rights-pulse-upcoming-meta">即将生效 · ${esc(item.upcoming.effective)} · ${esc(item.upcoming.authority)}</div><strong>${esc(item.upcoming.title)}</strong><p>${esc(item.upcoming.text)}</p>${item.upcomingSource?`<div class="rights-pulse-upcoming-source">${link(item.upcomingSource)}</div>`:''}</div>`:'';

    host.hidden=false;
    host.innerHTML=`<div class="wrap"><div class="rights-pulse">
      <div class="rights-pulse-meta">
        <span class="rights-pulse-label">权利校验</span>
        <strong>${esc(item.status||'现行')}</strong>
        <span>${esc(item.authority||'')}</span>
        ${item.effective?`<span>实施 ${esc(item.effective)}</span>`:''}
        <span>核验 ${VERIFIED}</span>
      </div>
      <div class="rights-pulse-content">
        <h2>${esc(item.title)}</h2>
        <p>${esc(item.text)}</p>
        <div class="rights-pulse-action"><span>你现在可以要求</span><strong>${esc(item.action)}</strong></div>
        ${upcoming}
        <div class="rights-pulse-sources">${sources}</div>
      </div>
    </div></div>`;
    syncSources(item);
  }

  window.addEventListener('DOMContentLoaded',()=>{
    render();
    const name=document.getElementById('caseName');
    if(name) new MutationObserver(render).observe(name,{childList:true,subtree:true,characterData:true});
  });
})();