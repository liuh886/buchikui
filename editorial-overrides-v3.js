(function(){
  const cases=window.BUCHIKUI_CASES||[];
  if(!cases.length) return;

  function merge(target,patch){
    Object.entries(patch||{}).forEach(([key,value])=>{
      if(value&&typeof value==='object'&&!Array.isArray(value)){
        if(!target[key]||typeof target[key]!=='object'||Array.isArray(target[key])) target[key]={};
        merge(target[key],value);
        return;
      }
      target[key]=value;
    });
  }

  function getCase(slug){return cases.find(item=>item.slug===slug)}
  function patchCase(slug,patch){const item=getCase(slug); if(item) merge(item,patch)}
  function patchPanicItem(slug,index,patch){const item=getCase(slug)?.panic?.items?.[index]; if(item) merge(item,patch)}
  function patchEvidence(slug,patch){const item=getCase(slug)?.evidence; if(item) merge(item,patch)}
  function replaceDiscussion(slug,from,to){
    const item=getCase(slug)?.discussion;
    if(item?.html&&item.html.includes(from)) item.html=item.html.replace(from,to);
  }

  patchCase('rental',{
    hero:{
      title:'租车纠纷，<br>先把<em>谁履约、开什么车、为什么扣钱</em>对清。',
      copy:'平台入口、门头品牌和实际出租方可能不是同一主体。取车时还要核对实际车辆、旧伤和保障；发生扣款时，再要求对方说明<strong>事实依据、责任依据和金额计算</strong>。'
    },
    serviceStandard:{
      title:'正常租车至少要说清：<br>谁出租、多少钱、什么车、怎么验损。'
    }
  });
  patchPanicItem('rental',3,{
    title:'无车、扣款、拒赔，先拿到对应书面结论',
    text:'无车要求确认无法履约和退款安排；扣款要求事实、条款和金额依据；拒赔要求具体除外责任和书面理由。'
  });

  patchCase('beauty-hair',{
    hero:{
      copy:'预付卡纠纷先算充值本金、赠送、已消费和余额；中途加项目看价格何时告知、你是否明确同意；出现损伤再保存服务过程和医疗记录。<strong>门店搬迁、转店或闭店时，先确认原经营主体和旧余额，不要用新协议覆盖旧责任。</strong>'
    }
  });

  patchCase('mobile-plan-cost',{
    hero:{
      copy:'老套餐太贵时，先找一个仍在售的目标套餐。客服回复“仅限新用户”“系统办不了”或“没有权限”时，要求说明<strong>你的号码具体缺哪项条件、限制依据是什么，并生成工单</strong>。'
    }
  });

  patchCase('alipay-advisor-cost',{
    name:'支付宝投顾：0.5% 不是总成本',
    meta:{
      title:'不吃亏｜支付宝投顾：0.5% 不是总成本',
      ogTitle:'支付宝投顾：0.5% 不是总成本。'
    },
    hero:{
      title:'支付宝投顾，<br><em>0.5% 不是总成本。</em>',
      copy:'投顾建立在底层基金之上。<strong>底层基金运作费不会因为用了投顾而消失，申购、赎回和调仓还可能产生交易成本。</strong>比较费用时，把交易手续费、底层运作费和投顾管理费放在同一张账里。'
    }
  });

  patchCase('rental-credit-card-first',{
    discussion:{
      intro:'关键差别是争议发生后，谁必须进入交易核查链。信用卡预授权多了发卡行的授权、风险监测和调单路径；信用免押则要继续核对商户、平台和支付机构各自的授权与复核责任。'
    }
  });
  replaceDiscussion(
    'rental-credit-card-first',
    '平台应尽的审核、复核和争议处理责任，还有很长的路要走。',
    '发生争议时，平台应说明依据并提供申诉复核；支付机构也应处理支付争议，不能只用“去找商户”结束流程。'
  );

  patchCase('appliance-repair-trap',{
    hero:{
      copy:'网上搜“官方售后”，排在前面的可能只是广告或第三方维修。<strong>先从品牌官网、官方 App、产品说明书或包装找到售后入口。</strong>上门后记录每次诊断、报价和换件结果；第一次换件没有解决原故障，就先停并考虑独立复检。'
    }
  });

  patchCase('airport-sales-pitch',{
    shareText:'机场里遇到主动推销，制服和柜台位置不能替代身份核验。付款或提交验证码、刷脸前，先确认销售公司、正式产品、合同主体、收款方、费用和退出规则。',
    hero:{
      copy:'人在机场、穿得像工作人员、站在值机区附近，都不能单独证明他是机场或航空公司员工。<strong>公司全称、与机场 / 航司的关系、正式产品名称、收款主体、费用和限制</strong>都要能核验。决定购买时，保存销售人员身份、宣传页、合同 / 申请页和付款页面；口头承诺较多时再录音。'
    },
    discussion:{
      intro:'机场最容易制造的是身份错觉：地点、制服和“合作方”三个信号叠在一起，让第三方销售看起来像机场或航司官方人员。'
    }
  });

  patchEvidence('dating-safety',{
    title:'账号、见面地点、账单、转账和报警记录，<br>按时间保存。',
    intro:'只保留和身份线索、见面经过、消费转账及现场风险有关的材料，不需要为了查清对方全部背景去收集无关隐私。'
  });
  patchCase('dating-safety',{
    route:{
      note:'<strong>先处理眼前风险：</strong>被阻止离开或遭到威胁，先离开现场并报警；钱刚转出去，立即联系银行 / 支付平台争取止付并同步报警；强制消费在安全离场后再补菜单、账单和商户证据。'
    }
  });

  patchCase('layoff-compensation',{
    route:{
      note:'<strong>仲裁可能持续数月。</strong>第一次约谈录音、考勤、绩效原始数据、工作量变化、调岗 / PIP / 警告和解除通知现在就保存，不要等劳动关系已经解除后再补。'
    },
    discussion:{
      intro:'星宇股份事件的价值，不是提供一个通用补偿数字，而是说明公司从“协商离职”转向调岗、绩效或纪律路径时，第一场约谈和后续条件变化必须放在同一条时间线上核对。'
    }
  });
  replaceDiscussion(
    'layoff-compensation',
    '<strong>这个案例可复制的经验很明确：第一场约谈开始就固定录音、解除理由、调岗内容、工时和补偿。</strong>后续公司无论把路径转向调岗、绩效还是纪律处理，都能回到最初时间线核对。',
    '<strong>如果公司先谈离职，随后又改成调岗、绩效或纪律处理，最初约谈的录音、解除理由、调岗内容、工时和补偿方案就成为后续核对的起点。</strong>'
  );

  patchCase('alibaba-auction-trap',{
    name:'阿里拍卖局中局：先查谁在拍、谁在竞价',
    meta:{
      title:'不吃亏｜阿里拍卖局中局：先查谁在拍、谁在竞价',
      ogTitle:'阿里拍卖：先查谁在拍、谁在竞价。'
    },
    hero:{
      title:'阿里拍卖，<br><em>先查谁在拍、谁在竞价。</em>',
      copy:'同一平台里既有法院司法拍卖，也有商业机构组织的拍卖，责任主体和规则并不相同。<strong>低起拍价、多人抢拍和连续加价都不能证明标的便宜；商业拍卖还要排除拍卖人、委托人或关联主体违规参与竞价。</strong>'
    }
  });

  patchCase('transport-platform-layered-fees',{
    panic:{title:'先保存用户端价格、司机端价格、<br>订单链和每层收费。'},
    section:{
      title:'四种价格断层：<br>多平台转单、动态压价、累计差额、系统定价。',
      intro:'多平台转单看每层收费；动态压价看连续报价；累计差额要做全链路费用表；“系统定价”则要求平台说明规则版本、价格构成和影响因素。'
    }
  });
  replaceDiscussion(
    'transport-platform-layered-fees',
    '<strong>算法监管也还需要继续细化：</strong>',
    '<strong>现行规则还没有单独列明“根据司机历史接受价个体化压低报价”：</strong>'
  );
  replaceDiscussion(
    'transport-platform-layered-fees',
    '<strong>Buchikui 的治理建议：</strong>',
    '<strong>建议把接单前价格也纳入透明义务：</strong>'
  );

  patchCase('bank-small-account-fee',{
    route:{
      note:'<strong>直接问银行三件事：</strong>每次扣费当天你名下有几个账户；哪个账户享受减免；这一笔收费依据哪项规则。符合免收条件的，再要求逐笔退费并保留工单。'
    }
  });
})();
