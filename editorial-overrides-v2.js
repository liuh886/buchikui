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

  function patchCase(slug,patch){
    const target=cases.find(item=>item.slug===slug);
    if(target) merge(target,patch);
  }

  function patchScenario(slug,short,patch){
    const target=cases.find(item=>item.slug===slug);
    const scenario=target?.scenarios?.find(item=>item.short===short);
    if(scenario) merge(scenario,patch);
  }

  function patchBlock(slug,short,label,patch){
    const target=cases.find(item=>item.slug===slug);
    const scenario=target?.scenarios?.find(item=>item.short===short);
    const block=scenario?.blocks?.find(item=>item.label===label);
    if(block) merge(block,patch);
  }

  const copy={
    rental:{
      panic:{title:'先留订单和书面记录；<br>要扣钱就先要依据。'},
      section:{
        intro:'到店无车先保留商家未履约记录；换车要让系统和实际车辆一致；验损要对旧伤；扣款要看授权、责任和金额依据。'
      },
      route:{
        title:'租赁经营问题找 12328；<br>押金、收费和条款争议找 12315。'
      }
    },

    'beauty-hair':{
      panic:{title:'先停充值，保存余额和流水；<br>有损伤先就医留记录。'},
      route:{
        title:'预付、价格和服务争议走 12315；<br>侵入性医美再找卫健部门。'
      },
      takeaway:'美容美发尽量少做大额预付。折扣越依赖长期锁定，余额、转店和退款的退出成本越高。'
    },

    'bank-small-account-fee':{
      panic:{title:'先查扣费当天，<br>你在这家银行到底有几个账户。'}
    },

    'mobile-plan-cost':{
      panic:{title:'先查近 3 个月账单和用量，<br>再找一个明确的目标套餐。'},
      section:{
        intro:'近 3 个月账单决定你实际需要多少；目标套餐页面决定你要申请什么；客服工单要留下“为什么不能办”的具体理由。'
      }
    },

    'internet-court-self-litigation':{
      panic:{title:'法院、被告、诉讼请求和核心证据，<br>立案前先对上。'},
      section:{
        title:'别把官司当作文比赛。<br>先把法院、被告和请求做对。',
        intro:'先确认受诉法院、被告主体和诉讼请求，再整理证据目录、质证意见和庭审准备。起诉状写得长不长，不是首要问题。'
      },
      evidence:{
        title:'立案材料、证据目录、质证表、期限清单，<br>分开准备。',
        intro:'立案材料解决“谁告谁、去哪告、要判什么”；证据目录解决“靠什么证明”；质证表和期限清单留到证据交换、开庭和上诉阶段使用。'
      },
      route:{
        title:'先选对法院和被告，<br>再进入举证、质证和庭审。',
        intro:'立案前先检查管辖、主体和请求；立案后按法院期限提交证据、质证和庭审材料，裁判生效后再看履行或执行。'
      },
      takeaway:'第一次自己打民事官司，先把法院、被告、诉讼请求和证据对应好。能在线立案，不等于案件就归互联网法院管。'
    },

    'alipay-advisor-cost':{
      panic:{title:'投顾费不是总成本；<br>底层运作费和交易费也要一起算。'}
    },

    'bank-wealth-not-guaranteed':{
      evidence:{
        title:'产品文件、风险测评、推荐记录和购买页面，<br>要还原购买当天发生了什么。',
        intro:'先保存购买时版本的说明书、风险揭示、风险测评和推荐页面；再补持有期间的净值、赎回限制和实际损失。'
      },
      route:{
        title:'先查销售过程和风险匹配；<br>有误导或错配再升级投诉。',
        intro:'正常净值波动先回到产品风险和资金用途；如果争议是保本承诺、收益展示、风险测评被干预或产品错配，就要求销售银行和产品管理人分别调查并书面回复。'
      },
      takeaway:'理财亏损本身不等于销售违法。真正要查的是：买入时产品风险、你的风险等级和销售人员的说法是否对得上。'
    },

    'rental-credit-card-first':{
      route:{
        intro:'下单时保存扣款授权；服务结束后确认授权是否终止。发生扣款时，把商户的损失主张和平台、支付机构的直接扣款依据分开核对。'
      }
    },

    'appliance-repair-trap':{
      section:{
        intro:'搜索阶段核验维修方身份；上门阶段记录每次诊断与换件结果；付款前核对价目和明细；原故障没解决再做独立复检。'
      },
      evidence:{
        title:'维修前状态、每次诊断、换件结果和账单，<br>缺一项都可能影响判断。',
        intro:'维修前先保存原故障；每次换件都记录“为什么换、换完是否修好”；付款时再把配件、人工和收费明细对上。'
      },
      route:{
        title:'先找经营者退争议费用；<br>虚假维修线索再交 12315 或主管部门。'
      },
      template:{
        title:'按时间列出每次诊断、换件、结果和收费。',
        intro:'尤其写清第一次换件后原故障是否解决，以及后续为什么又追加 B、C 部件。'
      }
    },

    'airport-sales-pitch':{
      route:{
        title:'先找销售主体核对退款；<br>办成金融产品就直接找发卡行或保险公司。'
      },
      template:{
        title:'投诉材料先列销售主体、现场承诺、<br>正式产品和收款方。',
        intro:'把现场怎么介绍、正式合同写什么、钱付给谁、实际限制是什么逐项对照。'
      }
    },

    'dating-safety':{
      section:{
        intro:'身份长期无法核验、临时转去私密场所、指定高消费店、借钱投资、拿手机操作、阻止离开，分别对应不同风险。'
      },
      route:{
        title:'有人身危险先离开；<br>刚转账就立刻止付并报警。'
      },
      template:{
        title:'报警或投诉时写账号、地点、金额、<br>具体行为和时间。',
        intro:'不必先给关系定性。把对方账号、见面地点、付款或转账、限制离开或其他异常行为按时间写清。'
      },
      takeaway:'第一次见面默认公共场所、独立往返、不转钱、不交手机。对方阻止离开或逼你当场破例时，直接结束见面。'
    },

    'thailand-travel-safety':{
      discussion:{
        intro:'大皇宫“关闭”、20 铢 tuk-tuk、DCC、租车损坏索赔和宝石套利，是游客更常遇到的几类套路；下面分别给对应动作。'
      },
      takeaway:'目的地、交通或手机开始被陌生人控制时，不再继续跟随，先恢复独立交通和对外联系。'
    },

    'layoff-compensation':{
      evidence:{
        title:'第一次约谈、工作条件变化、PIP / 警告、<br>持续出勤和最终解除，按时间连起来。',
        intro:'把公司最初提出的方案、后续工作量或岗位变化、绩效与纪律记录、你的书面回应以及最终解除理由放在同一条时间线上。'
      },
      route:{
        title:'先书面谈方案和补偿；<br>协商不成再调解、仲裁或监察分流。',
        intro:'第一次约谈先听清解除理由并留录音；当天把口头方案转成书面确认。还能谈就继续协商或调解，解除和补偿争议最后再进入仲裁，欠薪等事项另按人社监察渠道处理。'
      }
    },

    'alibaba-auction-trap':{
      section:{
        intro:'司法还是商业拍卖先分清主体；异常竞价留完整日志；低价起拍不能替代独立估值；成交前把悔拍责任算进最高价。'
      },
      route:{
        title:'先让平台保全竞价日志；<br>涉嫌违法再向市场监管提交。',
        intro:'异常竞价先固定标的编号、竞买号和时间段并要求平台保全后台数据；涉嫌拍卖方参与竞买、串通或重大信息披露问题，再把完整材料交市场监管或法院。'
      }
    },

    'qingdao-travel':{
      panic:{title:'海鲜、游艇先把总价说清；<br>民宿毁约别主动取消。'},
      section:{
        intro:'海鲜争议看计价单位和加工费；司机带店看是否改变目的地；出海看码头、航程和附加费；民宿毁约看谁发起取消。'
      },
      route:{
        title:'价格和经营争议找 12315 / 12345；<br>人身威胁直接 110。'
      },
      template:{
        title:'投诉时写明商户、订单、金额和具体行为。',
        intro:'把事前标价或承诺、实际发生、争议金额和诉求分开写；涉及人身侵害再补时间、地点和报警记录。'
      },
      takeaway:'青岛旅游最实用的几件事：海鲜先算总价，司机带店不去，出海先确认码头和全包价，民宿毁约不主动取消。'
    },

    'transport-platform-layered-fees':{
      route:{
        title:'先让入口平台和承运平台给出全链路费用表；<br>解释不了再交 12328 / 市场监管。',
        intro:'先用同一订单的用户端和司机端截图要求平台说明流转主体、每层收费和计价规则；平台仍无法解释，再按道路运输和价格规则分别提交监管。'
      }
    }
  };

  Object.entries(copy).forEach(([slug,patch])=>patchCase(slug,patch));

  patchScenario('qingdao-travel','景区拍照',{
    title:'公共景区拍照被辱骂、尾随或阻拦离开，先撤到安全位置并报警'
  });
  patchBlock('qingdao-travel','景区拍照','现在做什么',{
    html:'<p>先拉开距离，向<strong class="key">人多、有工作人员或景区安保</strong>的位置移动。安全允许时录音录像，保留对方持续辱骂、恐吓、尾随或阻拦离开的过程。若对方继续纠缠、限制离开或存在现实人身威胁，<strong>直接拨打 110</strong>，说明具体地点、行为和当前安全风险，并保存接报案记录。</p>'
  });
})();