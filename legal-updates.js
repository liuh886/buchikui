(function(){
  const VERIFIED='2026-08-21';
  const updates={
    rental:{
      kicker:'2026 新规 + 最新典型案例',
      title:'平台不能只说“这是商户纠纷”。',
      text:'自 2026-02-01 起，平台依据自身规则对消费者采取不利处理，应说明事实、理由和依据，并提供便捷申诉；消费者要求人工判定时，不能只交给 AI / 系统自动处理。平台纠纷规则还应依法公平设置举证责任。最高法 2026-08-03 发布的电商平台典型案例进一步提示：平台实际掌握的交易、资金、投诉等数据和控制能力，会影响其是否已经尽到必要的平台责任。',
      action:'遇到扣款、驳回或责任推诿，直接要求：具体规则条款 + 商户提交材料 + 平台审核依据 + 人工复核结果。',
      source:{title:'【部门规章】《网络交易平台规则监督管理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2026/art_85b474fc5a08494bb60ca6a280b98d7d.html'},
      source2:{title:'【最高法典型案例】平台数据优势与必要措施责任',href:'https://www.court.gov.cn/zixun/xiangqing/507691.html'}
    },
    'beauty-hair':{
      kicker:'2025 司法解释',
      title:'消费记录在商家手里，不代表消费者只能认栽。',
      text:'最高法明确：预付式消费中，合同、消费次数、消费金额、余额等证据由经营者控制，经营者无正当理由拒不提交的，法院可以根据消费者主张认定争议事实。',
      action:'退卡、闭店、余额争议时，明确要求商家提交完整合同、消费明细和余额记录；商家拒绝提供，本身就是需要固定的重要事实。',
      source:{title:'【司法解释】最高法预付式消费司法解释',href:'https://www.court.gov.cn/zixun/xiangqing/459321.html'}
    },
    'bank-small-account-fee':{
      kicker:'监管已明确',
      title:'“系统自动扣”不是收费依据。',
      text:'金融监管部门已将“个人客户唯一账户仍被收取年费和小额账户管理费”列为违规收费，并公开过责令整改退费及处罚案例。',
      action:'要求银行逐笔说明：扣费当日你在该行有几个账户、哪个账户享受减免、这笔收费依据什么规则。不要只接受“系统就是这样扣”的答复。',
      source:{title:'【监管典型案例】唯一账户违规收费',href:'https://www.nfra.gov.cn/cn/view/pages/ItemDetail.html?docId=1130947&generaltype=0&itemId=4099'}
    },
    'mobile-plan-cost':{
      kicker:'2026 监管重点',
      title:'“新老用户不同权”已经被通信监管直接点名。',
      text:'2026 年通信监管工作继续强调新老用户同等权益、简化套餐变更流程。按现行电信用户申诉规则，企业投诉处理不满意或 15 日内未答复，可以进一步申诉；收费争议还存在较短的申诉时限。',
      action:'客服说“老用户不能办”时，不要停在口头答复：要求写明套餐状态、具体限制条件、同档替代方案和工单号，并及时升级申诉。',
      source:{title:'【行业监管】套餐变更与新老用户权益',href:'https://cqca.miit.gov.cn/xwdt/gzdt/art/2026/art_61fe759a72a746ab96fb624b211fad8c.html'},
      source2:{title:'【部门规章】《电信用户申诉处理办法》',href:'https://www.miit.gov.cn/zwgk/zcwj/flfg/art/2020/art_b2e4b04d28f84f0d8c11e76c2b5c650a.html'}
    },
    'internet-court-self-litigation':{
      kicker:'2025 新司法解释',
      title:'能网上立案，不等于案件归互联网法院。',
      text:'自 2025-11-01 起，互联网法院按新的集中管辖范围受案。网络购物、网络服务等案件是否归互联网法院，仍要同时看案件类型、地域连接点和有效管辖约定。',
      action:'立案前先写清“为什么这个法院有管辖权”。不要因为交易发生在线上，就直接把互联网法院当成默认入口。',
      source:{title:'【司法解释】《最高人民法院关于互联网法院案件管辖的规定》',href:'https://www.court.gov.cn/zixun/xiangqing/478291.html'}
    },
    'alipay-advisor-cost':{
      kicker:'2026 新规',
      title:'基金投顾不得双重收费。',
      text:'自 2026-01-01 起施行的基金销售费用新规进一步降低多类基金销售费用，并明确要求基金投顾业务不得双重收费。费用不能因为被拆成“底层基金 + 投顾 + 销售”几层就失去可解释性。',
      action:'买前把投顾费、底层基金运作费、申赎费、销售服务费分层列出来；同一项服务疑似重复收费时，要求机构写清收费项目、计提基数和规则依据。',
      source:{title:'【证监会规则】《公开募集证券投资基金销售费用管理规定》',href:'https://www.csrc.gov.cn/csrc/c100028/c7606047/content.shtml'}
    },
    'bank-wealth-not-guaranteed':{
      kicker:'2026 新规',
      title:'风险测评不是“过关考试”。',
      text:'自 2026-02-01 起，《金融机构产品适当性管理办法》禁止金融机构代替客户评估、不当提示或以其他方式影响评估结果真实性，也禁止主动推介风险等级高于客户承受能力的产品。',
      action:'自己填、如实填，并保存测评结果和产品风险等级。有人教你“这个选高一点才能买”时，把这句话和销售过程一起固定下来。',
      source:{title:'【部门规章】《金融机构产品适当性管理办法》',href:'https://www.nfra.gov.cn/cn/view/pages/rulesDetail.html?docId=1217183'}
    },
    'rental-credit-card-first':{
      kicker:'CASE 008 · 关键权利',
      title:'免押不是免授权；“技术服务”不是免责。',
      text:'信用免押可能把信用评估、平台规则和持续扣款授权叠在一次点击里。平台自称“技术服务方”或支付机构自称“指令执行方”，都不能当然免除其依法承担的平台规则、用户争议和投诉处理责任。信用卡预授权的相对优势也不是“商户扣不了”，而是争议可以进入发卡行—收单行的调单、核查和举证链路。',
      action:'选押金方式只问四件事：谁能扣？最多多少？授权何时结束？发生争议后谁掌握、谁应提供关键证据？',
      source:{title:'【部门规章】《网络交易平台规则监督管理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2026/art_85b474fc5a08494bb60ca6a280b98d7d.html'},
      source2:{title:'【司法解释】银行卡争议交易举证规则',href:'https://www.court.gov.cn/zixun/xiangqing/304771.html'}
    }
  };

  const esc=value=>String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  const link=source=>source?`<a href="${esc(source.href)}" target="_blank" rel="noopener">${esc(source.title)} →</a>`:'';

  function getActiveCase(){
    const name=document.getElementById('caseName')?.textContent?.trim();
    return (window.BUCHIKUI_CASES||[]).find(item=>item.name===name)||null;
  }

  function ensureHost(){
    let host=document.getElementById('rightsPulse');
    if(host) return host;
    host=document.createElement('section');
    host.id='rightsPulse';
    host.className='service-standard-wrap';
    host.setAttribute('aria-label','最近规则变化与当前权利');
    const hero=document.querySelector('.hero');
    if(hero) hero.insertAdjacentElement('afterend',host);
    return host;
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
    host.hidden=false;
    host.innerHTML=`<div class="wrap"><div class="route-note" role="note"><strong>${esc(item.kicker)} · 权利核验 ${VERIFIED}</strong><br><span class="key">${esc(item.title)}</span> ${esc(item.text)}<br><strong>现在可以这样做：</strong> ${esc(item.action)}<br>${link(item.source)}${item.source2?` · ${link(item.source2)}`:''}</div></div>`;
  }

  window.addEventListener('DOMContentLoaded',()=>{
    render();
    const name=document.getElementById('caseName');
    if(name) new MutationObserver(render).observe(name,{childList:true,subtree:true,characterData:true});
  });
})();
