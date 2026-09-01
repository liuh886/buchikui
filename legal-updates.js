(function(){
  const VERIFIED='2026-08-21';
  const updates={
    rental:{
      rules:[
        {
          id:'operator',
          tab:'经营主体',
          status:'现行',
          type:'行政法规',
          authority:'国务院',
          effective:'2024-07-01',
          document:'《中华人民共和国消费者权益保护法实施条例》',
          title:'平台入口、门头品牌和实际出租方，不能混成一个主体。',
          text:'通过网络提供服务时，经营者应显著说明真实名称；由其他经营者实际提供服务的，还应向消费者提供实际经营者的名称、经营地址和联系方式。租车纠纷里，平台、合同出租方、收款方和实际交车方可能不是同一家公司。',
          action:'要求平台或门店明确提供实际出租方的公司全称、经营地址和联系方式，并把它与合同签约方、收款主体、实际交车方逐一对上。',
          sources:[
            {title:'【行政法规】《消费者权益保护法实施条例》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2024/art_0aea188276a44f0baf940ab95ee00e0a.html'}
          ]
        },
        {
          id:'vehicle-status',
          tab:'车辆资质',
          status:'现行',
          type:'部门规章',
          authority:'交通运输部',
          effective:'2021-04-01',
          document:'《小微型客车租赁经营服务管理办法》',
          title:'投入租赁经营的小微型客车，使用性质应登记为“租赁”。',
          text:'现行办法要求，从事小微型客车租赁经营的企业具备相应条件，其中投入经营的小微型客车应检验合格，且登记使用性质为“租赁”。这是判断车辆是否按租赁业务规范投入经营的直接事实。',
          action:'取车时拍下车牌和行驶证，核对“使用性质”。发现实际车辆、订单车辆或行驶证信息对不上时，先要求更正，不要直接确认正常交付。',
          sources:[
            {title:'【部门规章】《小微型客车租赁经营服务管理办法》现行修正版',href:'https://xxgk.mot.gov.cn/2020/jigou/fgs/202108/t20210825_3616598.html'}
          ]
        },
        {
          id:'deposit',
          tab:'押金退还',
          status:'现行',
          type:'行政法规',
          authority:'国务院',
          effective:'2024-07-01',
          document:'《中华人民共和国消费者权益保护法实施条例》',
          title:'收押金，要提前说清怎么退、多久退；符合条件就应及时退。',
          text:'经营者收取押金，应事先与消费者约定退还方式、程序和时限，不得设置不合理退还条件。消费者符合退还条件时，经营者应及时退还。',
          action:'下单时保存押金金额、退还条件、程序和时限；还车后符合条件仍未退的，要求经营者按当时约定说明未退原因和具体退还时间。',
          sources:[
            {title:'【行政法规】《消费者权益保护法实施条例》第二十条',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2024/art_0aea188276a44f0baf940ab95ee00e0a.html'}
          ]
        },
        {
          id:'platform-appeal',
          tab:'平台申诉',
          status:'现行',
          type:'部门规章',
          authority:'市场监管总局 · 国家网信办',
          effective:'2026-02-01',
          document:'《网络交易平台规则监督管理办法》',
          title:'平台不能只回复“这是商户纠纷”或“系统判定”。',
          text:'平台依据平台规则对消费者采取不利措施时，应说明事实、理由和依据并提供便捷申诉；消费者提出人工判定要求时，不能仅采用人工智能等技术手段处理。',
          action:'要求平台提供具体规则条款、商户提交材料、平台审核依据和人工复核结果。不要只接受“商户发起”或“系统审核”的结论。',
          sources:[
            {title:'【部门规章】《网络交易平台规则监督管理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2026/art_85b474fc5a08494bb60ca6a280b98d7d.html'}
          ]
        }
      ]
    },
    'beauty-hair':{
      rules:[
        {
          id:'prepaid-refund',
          tab:'预付退款',
          status:'现行',
          type:'司法解释',
          authority:'最高人民法院',
          effective:'2025-05-01',
          document:'《关于审理预付式消费民事纠纷案件适用法律若干问题的解释》',
          title:'符合条件的预付消费，付款后七日内可以请求返还预付款本金。',
          text:'司法解释明确适用于理发、美容等生活消费。消费者自付款之日起七日内请求返还预付款本金，人民法院原则上予以支持，但对已经从该经营者或其他经营者获得过相同商品或服务等情形设有例外。超过七日，也不等于当然不能解除或退款。',
          action:'先核对付款日期和七日退款例外；同时保存付款记录、会员合同、消费流水和当前余额。要求退款时把本金、赠送和已消费金额分开。',
          sources:[
            {title:'【司法解释】最高法预付式消费司法解释',href:'https://gongbao.court.gov.cn/Details/415add6e9c15736f2fbd871bdb1538.html'}
          ]
        },
        {
          id:'relocation-transfer',
          tab:'搬店转店',
          status:'现行',
          type:'司法解释',
          authority:'最高人民法院',
          effective:'2025-05-01',
          document:'《关于审理预付式消费民事纠纷案件适用法律若干问题的解释》',
          title:'搬店造成明显不便，或未经同意把合同义务转给第三人，可以成为解除合同的理由。',
          text:'司法解释明确，经营者变更经营场所给消费者接受服务造成明显不便，或者未经消费者同意将预付式消费合同义务转给第三人，消费者请求解除合同，人民法院应予支持。',
          action:'门店搬迁、转让或要求转卡时，先固定旧合同、余额和原经营主体。没说清旧债务由谁承担前，不要为了继续消费直接签新协议或补差价。',
          sources:[
            {title:'【司法解释】最高法预付式消费司法解释第十三条',href:'https://gongbao.court.gov.cn/Details/415add6e9c15736f2fbd871bdb1538.html'}
          ]
        },
        {
          id:'price-change',
          tab:'单方加价',
          status:'现行',
          type:'司法解释 · 行政法规',
          authority:'最高人民法院 · 国务院',
          effective:'2025-05-01',
          document:'预付式消费司法解释 + 《消费者权益保护法实施条例》',
          title:'预付以后，经营者不能未经同意单方提高价格。',
          text:'司法解释规定，经营者未经消费者同意单方提高商品或服务价格、降低质量，消费者可以要求按合同约定履行并承担相应违约责任；实施条例也要求预付合同约定具体内容和价款，履行中不得任意加价。',
          action:'中途新增项目或加价时，当场写明是否同意，保存原套餐、价目、当次项目确认和结算清单。不要让“已经做了”替代你的明确同意。',
          sources:[
            {title:'【司法解释】最高法预付式消费司法解释第十二条',href:'https://gongbao.court.gov.cn/Details/415add6e9c15736f2fbd871bdb1538.html'},
            {title:'【行政法规】《消费者权益保护法实施条例》第二十二条',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2024/art_0aea188276a44f0baf940ab95ee00e0a.html'}
          ]
        },
        {
          id:'medical-beauty',
          tab:'医美资质',
          status:'现行',
          type:'部门规章',
          authority:'国家卫生健康委',
          effective:'2002-05-01',
          document:'《医疗美容服务管理办法》',
          title:'属于医疗美容的项目，必须进入医疗机构和医疗执业资质体系。',
          text:'现行办法将使用手术、药物、医疗器械以及其他具有创伤性或侵入性的医学技术进行美容修复与再塑纳入医疗美容；未取得医疗机构执业许可并核准相应医疗美容诊疗科目，不得开展医疗美容服务。',
          action:'项目涉及侵入性、药物或医疗器械等医疗美容行为时，先核验机构医疗资质、核准诊疗科目和实施人员执业资格，不要只看“美容院”“工作室”或营销名称。',
          sources:[
            {title:'【部门规章】《医疗美容服务管理办法》',href:'https://www.nhc.gov.cn/wjw/c100221/202201/d7e8fa33a26b425da98d69fb04191699.shtml'}
          ]
        }
      ]
    },
    'bank-small-account-fee':{
      rules:[
        {
          id:'fee-waiver',
          tab:'账户减免',
          status:'现行',
          type:'监管典型案例 · 部门规章',
          authority:'金融监管总局',
          title:'“系统自动扣”不是收费依据。',
          text:'监管部门已将个人客户唯一账户仍被收取年费和小额账户管理费列为违规收费。银行还应建立收费投诉登记、调查、处理和答复机制。',
          action:'要求银行逐笔说明：扣费当日你在该行有几个账户、哪个账户享受减免、收费依据是什么、投诉核查结论是什么。',
          sources:[
            {title:'【监管典型案例】唯一账户违规收费',href:'https://www.nfra.gov.cn/cn/view/pages/ItemDetail.html?docId=1130947&generaltype=0&itemId=4099'},
            {title:'【部门规章】《商业银行服务价格管理办法》',href:'https://www.nfra.gov.cn/cn/view/pages/rulesDetail.html?docId=274908&itemId=4214'}
          ]
        }
      ]
    },
    'mobile-plan-cost':{
      rules:[
        {
          id:'plan-choice',
          tab:'套餐选择',
          status:'现行',
          type:'行业监管规范',
          authority:'工业和信息化部',
          effective:'2018-08-23',
          document:'《关于进一步规范电信资费营销行为的通知》',
          title:'同等交易条件的同类用户，对在售资费方案应有同等选择权。',
          text:'电信业务经营者应公示所有面向公众市场销售的在售资费方案；在同一本地网营业区或业务区内，应保证具有同等交易条件的同类用户对资费方案具有同等选择权。除合同另有约定外，不得强制或限制用户选择、变更任一在售资费方案。',
          action:'拿一个明确的在售目标套餐去问。办不了时，要求工单写清套餐是否在售、你的号码具体缺哪项交易条件、限制依据和同档替代方案。',
          sources:[
            {title:'【行业监管规范】工信部《关于进一步规范电信资费营销行为的通知》',href:'https://www.miit.gov.cn/jgsj/txs/wjfb/art/2020/art_bd3aef28a0b440699839c09ae1709968.html'}
          ]
        },
        {
          id:'appeal-deadline',
          tab:'申诉时限',
          status:'现行',
          type:'部门规章',
          authority:'工业和信息化部',
          effective:'2016-07-30',
          document:'《电信用户申诉处理办法》',
          title:'运营商 15 日未答复或处理不满意，可以申诉；收费争议别拖过 5 个月。',
          text:'经营者接到用户投诉后应在15日内答复。用户对处理结果不满意，或者15日内未答复，可以向申诉受理机构申诉。属于收费争议的，争议发生距申诉超过5个月，通常不予受理。',
          action:'第一次向运营商投诉就留工单号和日期。15日未答复或结果不满意及时申诉；涉及收费争议，不要把时间拖过5个月。',
          sources:[
            {title:'【部门规章】《电信用户申诉处理办法》',href:'https://wap.miit.gov.cn/zcfg/xxtxl/art/2016/art_d1b009428ab44a5a9465d9068e45fd66.html'}
          ]
        }
      ]
    },
    'internet-court-self-litigation':{
      rules:[
        {
          id:'jurisdiction',
          tab:'管辖',
          status:'现行',
          type:'司法解释',
          authority:'最高人民法院',
          effective:'2025-11-01',
          document:'《最高人民法院关于互联网法院案件管辖的规定》',
          title:'能网上立案，不等于案件归互联网法院管辖。',
          text:'2025年11月1日起，互联网法院集中管辖范围已经调整。普通法院案件同样可以在线办理，是否由互联网法院审理仍要看案由、地域联系、管辖约定和是否属于规定列明的网络纠纷。',
          action:'立案前先单独写清管辖依据：案由、被告住所地、合同履行地或侵权地、有效管辖约定，以及为什么这个法院有权受理。',
          sources:[
            {title:'【司法解释】互联网法院案件管辖规定',href:'https://www.court.gov.cn/fabu/xiangqing/478291.html'}
          ]
        },
        {
          id:'pleading-template',
          tab:'起诉文本',
          status:'现行',
          type:'诉讼服务规则',
          authority:'最高人民法院 · 司法部 · 全国律协',
          effective:'2025-07-14',
          document:'67类起诉状、答辩状示范文本',
          title:'第一次起诉，不必从零写一篇长诉状。',
          text:'67类常见案件起诉状、答辩状示范文本已在全国法院全面推广，采用要素式、勾选式结构，引导当事人把诉讼请求、事实、证据和争议焦点写完整。全国统一电子诉讼服务平台也已上线在线填写等功能。',
          action:'先按案由匹配现行示范文本，再填具体请求、核心事实和证据；没有必要复制网上“万能起诉状”堆无关法条。',
          sources:[
            {title:'【诉讼服务规则】67类起诉状答辩状示范文本',href:'https://www.court.gov.cn/fabu/xiangqing/468671.html'},
            {title:'【诉讼服务】全国法院统一电子诉讼服务平台公告',href:'https://www.court.gov.cn/zixun/xiangqing/482581.html'}
          ]
        },
        {
          id:'opponent-evidence',
          tab:'对方证据',
          status:'现行',
          type:'司法解释',
          authority:'最高人民法院',
          effective:'2020-05-01',
          document:'《最高人民法院关于民事诉讼证据的若干规定》',
          title:'关键书证在对方手里，不等于你只能认输。',
          text:'当事人可以申请法院责令对方提交由其控制的特定书证。申请需要说明书证名称或内容、要证明的事实、重要性、为什么判断由对方控制以及应当提交的理由。无正当理由拒不提交，可能产生不利的事实认定后果。',
          action:'把目标材料描述到可以定位，并直接连接待证事实，例如具体订单的后台审核记录、账簿或原始凭证；不要只写“请对方提交全部资料”。',
          sources:[
            {title:'【司法解释】《最高人民法院关于民事诉讼证据的若干规定》',href:'https://gongbao.court.gov.cn/Details/0c15319f2bdbabb8e398035f775385.html'}
          ]
        }
      ]
    },
    'alipay-advisor-cost':{
      rules:[
        {
          id:'fees',
          tab:'费用',
          status:'现行',
          type:'证监会规则',
          authority:'中国证监会',
          effective:'2026-01-01',
          document:'《公开募集证券投资基金销售费用管理规定》',
          title:'基金投顾不得双重收费。',
          text:'现行规定降低多类基金销售费用，并明确基金投顾业务不得双重收费；对投资者持有期限超过一年的基金份额，除货币市场基金外，不再收取销售服务费。',
          action:'买前把投顾费、底层基金运作费、认申购和赎回费用、销售服务费分层列出；疑似重复收费时，要求写清收费项目、计提基数、费率和规则依据。',
          sources:[
            {title:'【证监会规则】《公开募集证券投资基金销售费用管理规定》修订说明',href:'https://www.csrc.gov.cn/csrc/c101954/c7606091/7606091/files/%E9%99%84%E4%BB%B62%EF%BC%9A%E3%80%8A%E5%85%AC%E5%BC%80%E5%8B%9F%E9%9B%86%E8%AF%81%E5%88%B8%E6%8A%95%E8%B5%84%E5%9F%BA%E9%87%91%E9%94%80%E5%94%AE%E8%B4%B9%E7%94%A8%E7%AE%A1%E7%90%86%E8%A7%84%E5%AE%9A%E3%80%8B%E4%BF%AE%E8%AE%A2%E8%AF%B4%E6%98%8E.pdf'}
          ]
        },
        {
          id:'third-party-platform',
          tab:'第三方平台',
          status:'即将生效',
          type:'八部门联合办法',
          authority:'人民银行等八部门',
          effective:'2026-09-30',
          document:'《金融产品网络营销管理办法》',
          title:'第三方互联网平台将不能介入销售合同、资金划转和适当性测评。',
          text:'新办法自2026年9月30日起实施。第三方互联网平台不得违反规定介入或变相介入销售合同签订、资金划转、适当性测评等金融产品销售环节，也不得就金融产品与消费者进行互动咨询；购买环节应转到金融机构自营平台。',
          action:'从2026年9月30日起，看到第三方平台直接完成签约、资金划转、适当性测评或提供产品互动咨询时，先核对实际金融机构和购买入口，不要把平台品牌当成销售责任主体。',
          sources:[
            {title:'【即将生效】《金融产品网络营销管理办法》',href:'https://www.cac.gov.cn/2026-04/24/c_1778769008779432.htm'}
          ]
        }
      ]
    },
    'bank-wealth-not-guaranteed':{
      rules:[
        {
          id:'risk-assessment',
          tab:'风险测评',
          status:'现行',
          type:'部门规章',
          authority:'国家金融监督管理总局',
          effective:'2026-02-01',
          document:'《金融机构产品适当性管理办法》',
          title:'风险测评不是“过关考试”，销售人员不能教你把答案填高。',
          text:'现行办法禁止金融机构代替客户评估、进行不当提示、先销售后评估，或者通过其他方式影响评估结果真实性和有效性。风险测评是判断产品是否适合你的关键证据。',
          action:'自己填、如实填并保存结果。有人指导你把答案往激进方向改时，保存聊天、录音或现场经过，以及测评前后结果和产品风险等级。',
          sources:[
            {title:'【部门规章】《金融机构产品适当性管理办法》',href:'https://www.nfra.gov.cn/cn/view/pages/ItemDetail.html?docId=1217183&itemId=4214'}
          ]
        },
        {
          id:'product-match',
          tab:'产品匹配',
          status:'现行',
          type:'部门规章',
          authority:'国家金融监督管理总局',
          effective:'2026-02-01',
          document:'《金融机构产品适当性管理办法》',
          title:'产品风险高于你的风险承受能力，原则上属于不具备适当性。',
          text:'办法明确，产品风险等级高于客户风险承受能力，或者购买所需资金与客户财务支付水平明显不匹配等情形，应认定客户与产品不具备适当性；除规则明确的例外外，金融机构不得销售不具备适当性的产品。',
          action:'保存购买时的客户风险等级、产品风险等级和匹配结果。投诉时不要只说“亏了”，要指出当时具体哪里出现了风险等级或资金承受能力错配。',
          sources:[
            {title:'【部门规章】《金融机构产品适当性管理办法》第十二条',href:'https://www.nfra.gov.cn/cn/view/pages/ItemDetail.html?docId=1217183&itemId=4214'}
          ]
        },
        {
          id:'return-marketing',
          tab:'收益宣传',
          status:'现行',
          type:'部门规章',
          authority:'国家金融监督管理总局',
          effective:'2026-02-01',
          document:'《金融机构产品适当性管理办法》',
          title:'不能用保本承诺、夸大收益或误导性风险提示把理财卖成“稳稳赚”。',
          text:'办法禁止告知和风险提示中存在虚假、误导或重大遗漏，包括混淆存款、理财等产品，违规承诺保本保收益、夸大产品收益或保障范围。',
          action:'保存购买时首页收益展示、排行榜、短信微信和理财经理话术。争议时把具体表述与产品说明书、风险等级和实际销售记录逐项对照。',
          sources:[
            {title:'【部门规章】《金融机构产品适当性管理办法》第十三条',href:'https://www.nfra.gov.cn/cn/view/pages/ItemDetail.html?docId=1217183&itemId=4214'}
          ]
        }
      ]
    },
    'appliance-repair-trap':{
      rules:[
        {
          id:'repair-conduct',
          tab:'维修行为',
          status:'现行',
          type:'部门规章',
          authority:'商务部',
          effective:'2012-08-01',
          document:'《家电维修服务业管理办法》',
          title:'虚报故障、故意替换正常部件，明令禁止。',
          text:'第九条直接禁止虚列、夸大、伪造维修项目，虚报故障部件，故意替换性能正常的部件，以及冒用厂家商标或特约维修标识。A换完没修好又继续推B、C，不能仅凭这一点认定违法，但已经足以要求重新解释前一次诊断和后续追加项目的依据。',
          action:'第一次换件没有解决原故障，先暂停后续换件。要求说明A的故障依据、换件后的结果，以及B/C的诊断依据；旧件、报价和每次维修结果都要保存。',
          sources:[
            {title:'【部门规章】《家电维修服务业管理办法》',href:'https://www.mofcom.gov.cn/zfxxgk/fdzdgknr/ztfl/blgg/art/2012/art_7bab8b7cb4ae429798d74b2311c847f4.html'}
          ]
        },
        {
          id:'repair-pricing',
          tab:'明码标价',
          status:'现行',
          type:'价格规范',
          authority:'国家发展改革委',
          effective:'2006-01-01',
          document:'《家用电器维修服务明码标价规定》',
          title:'上门维修，价格应当在动手前说清。',
          text:'上门维修人员应在服务前主动出示价目表或价格手册；结算时应如实列明检查费、修理费、辅料费、零配件名称、数量、价格和上门费。',
          action:'动手前要价目表和报价。每增加一个项目都重新确认；付款前索要结算清单、维修凭证和发票，核对实际维修、配件和收费是否一致。',
          sources:[
            {title:'【价格规范】家用电器维修服务明码标价规定',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/jls/art/2023/art_bf08901ce1ed4df9a7b63330521a5c58.html'}
          ]
        },
        {
          id:'search-ad',
          tab:'搜索广告',
          status:'现行',
          type:'部门规章',
          authority:'市场监管总局',
          effective:'2023-05-01',
          document:'《互联网广告管理办法》',
          title:'竞价排名推广，应当显著标明“广告”。',
          text:'互联网广告应具有可识别性；竞价排名的商品或服务，应显著标明“广告”，并与自然搜索结果明显区分。即使标了广告，也不能证明它是品牌官方售后或授权网点。',
          action:'把搜索排名当线索，不当官方证明。先从品牌官网、官方App、说明书或官方公众号找售后入口，再核验搜索结果里的电话、公司和网点。',
          sources:[
            {title:'【部门规章】《互联网广告管理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2023/art_d93a579afd45413e8576e4623fab348f.html'}
          ]
        },
        {
          id:'complaint-2026',
          tab:'投诉举报',
          status:'现行',
          type:'部门规章',
          authority:'市场监管总局',
          effective:'2026-04-15',
          document:'《市场监督管理投诉举报处理办法》',
          title:'投诉和举报，可以在同一份材料里一起提。',
          text:'同一份材料同时包含消费投诉和违法举报内容时，市场监督管理部门应分别处理；调解过程中发现涉嫌违法线索，也应另行核查。',
          action:'材料按时间写清搜索、诊断、换件、报价、付款和复检结果。退费诉求写明争议金额；虚假宣传、未明码标价、虚报故障等违法线索同时列出。',
          sources:[
            {title:'【部门规章】《市场监督管理投诉举报处理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2026/art_e4d03a20c0fd49769e408c7bf3791ff5.html'}
          ]
        }
      ]
    },
    'rental-credit-card-first':{
      rules:[
        {
          id:'chargeback-review',
          tab:'调单核查',
          status:'现行',
          type:'监管规则',
          authority:'国家金融监督管理总局',
          effective:'2011-01-13',
          document:'《商业银行信用卡业务监督管理办法》',
          title:'出现可疑信用卡交易，可以要求发卡行进入核查和调单链路。',
          text:'发卡银行应建立交易授权和风险监测制度；对可疑交易，应及时采取联系确认等措施，并通过电话核实、联系收单银行、调单或实地走访等方式排查处理。',
          action:'发现异常预授权完成或请款时，立即向发卡行提出书面账务异议，明确要求核查交易、联系收单侧并调单，保留工单和处理结果。',
          sources:[
            {title:'【监管规则】《商业银行信用卡业务监督管理办法》第五十六条',href:'https://www.nfra.gov.cn/cn/view/pages/rulesDetail.html?docId=272670'}
          ]
        },
        {
          id:'authorization-proof',
          tab:'授权举证',
          status:'现行',
          type:'司法解释',
          authority:'最高人民法院',
          effective:'2021-05-25',
          document:'《关于审理银行卡民事纠纷案件若干问题的规定》',
          title:'你否认本人或授权交易时，对方主张“你授权过”，要拿出相应证据。',
          text:'最高法规定，发卡行、非银行支付机构主张争议交易属于持卡人本人交易或者授权交易的，应承担相应举证责任，可以提交交易单据、身份识别和验证信息等材料。该规则解决的是交易是否本人或授权，不替代车损责任和赔偿金额的证明。',
          action:'把异议写具体：我否认的是哪一笔交易、哪一项授权。要求提供交易单据、身份识别信息、验证信息和对应授权记录，不要只接受“系统显示已授权”。',
          sources:[
            {title:'【司法解释】最高法银行卡民事纠纷规定',href:'https://www.court.gov.cn/zixun/xiangqing/304771.html'}
          ]
        },
        {
          id:'platform-appeal',
          tab:'平台申诉',
          status:'现行',
          type:'部门规章 · 行政法规',
          authority:'市场监管总局 · 国家网信办 · 国务院',
          effective:'2026-02-01',
          document:'《网络交易平台规则监督管理办法》 + 《非银行支付机构监督管理条例》',
          title:'信用免押发生争议，平台和支付机构都不能只把你推回商户。',
          text:'平台依据规则作出不利处理时，应说明事实、理由和依据并提供申诉复核；支付机构还负有及时妥善处理用户争议、履行投诉处理主体责任的义务。',
          action:'要求平台给出规则条款、商户材料、审核依据和人工复核结果；同时要求支付机构受理支付争议并核查授权与交易记录。',
          sources:[
            {title:'【部门规章】《网络交易平台规则监督管理办法》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2026/art_85b474fc5a08494bb60ca6a280b98d7d.html'},
            {title:'【行政法规】《非银行支付机构监督管理条例》第三十五条',href:'https://www.pbc.gov.cn/tiaofasi/144941/144953/5174993/index.html'}
          ]
        }
      ]
    },
    'airport-sales-pitch':{
      rules:[
        {
          id:'identity-relationship',
          tab:'身份关系',
          status:'现行',
          type:'法律 · 行政法规',
          authority:'全国人大常委会 · 国务院',
          effective:'2025-10-15',
          document:'《中华人民共和国反不正当竞争法》 + 《中华人民共和国消费者权益保护法实施条例》',
          title:'销售人员不能靠“像官方”让你误以为他就是机场或航司的人。',
          text:'现行《反不正当竞争法》禁止足以引人误认为与他人存在特定联系的混淆行为；《消费者权益保护法实施条例》要求经营者真实、全面提供商品或服务信息，不得进行虚假或引人误解的宣传。具体是否违法要结合制服、标识、话术、摊位位置、合同主体等整体判断。',
          action:'要求销售人员说明公司全称、与机场 / 航司的真实关系和合同主体；对“机场工作人员”“航司合作方”“官方会员升级”等表述，用机场或航司官方渠道反向核验后再交易。',
          sources:[
            {title:'【法律】《中华人民共和国反不正当竞争法》（2025修订）',href:'https://www.npc.gov.cn/npc/c2/c30834/202506/t20250627_446247.html'},
            {title:'【行政法规】《中华人民共和国消费者权益保护法实施条例》',href:'https://www.gov.cn/zhengce/content/202403/content_6940158.htm'}
          ]
        },
        {
          id:'price-rights',
          tab:'价格与权益',
          status:'现行',
          type:'行政法规 · 部门规章',
          authority:'国务院 · 市场监管总局',
          effective:'2024-07-01',
          document:'《中华人民共和国消费者权益保护法实施条例》 + 《明码标价和禁止价格欺诈规定》',
          title:'“充值送多少”不够，实际能怎么用、多少钱，都要说清。',
          text:'经营者应真实、全面提供服务信息并显著标示服务项目、内容、价格和计价方法；价格规则还禁止利用虚假或使人误解的价格手段诱骗交易。对商旅卡、贵宾卡等产品，赠送金额、抵扣比例、适用范围、次数、有效期等限制会直接决定真实价值。',
          action:'付款前要求展示可保存的完整规则：实付金额、本金和赠送分别是什么、每次最多抵多少、适用机场 / 航司 / 日期、有效期、退款条件。宣传大字和完整规则对不上时，先不买。',
          sources:[
            {title:'【行政法规】《中华人民共和国消费者权益保护法实施条例》',href:'https://www.gov.cn/zhengce/content/202403/content_6940158.htm'},
            {title:'【部门规章】《明码标价和禁止价格欺诈规定》',href:'https://www.samr.gov.cn/cms_files/filemanager/samr/www/samrnew/samrgkml/nsjg/fgs/202204/W020220426552839095096.pdf'}
          ]
        }
      ]
    },
    'dating-safety':{
      rules:[
        {
          id:'fraud-stop',
          tab:'涉诈转账',
          status:'现行',
          type:'法律',
          authority:'全国人大常委会',
          effective:'2022-12-01',
          document:'《中华人民共和国反电信网络诈骗法》',
          title:'刚发现被骗，先抢止付和冻结窗口。',
          text:'反电信网络诈骗法第二十条明确建立涉案资金即时查询、紧急止付、快速冻结、及时解冻和资金返还制度；公安机关依法决定采取相关措施后，银行业金融机构和非银行支付机构应当配合。是否能够追回仍取决于资金状态、案件事实和办案进度。',
          action:'立即联系银行或支付平台登记争议并报警，准备收款账号、交易单号、时间、金额和关键聊天记录；向公安机关如实说明情况，由其依法判断是否启动紧急止付、冻结等措施。',
          sources:[
            {title:'【法律】《中华人民共和国反电信网络诈骗法》',href:'https://www.miit.gov.cn/jgsj/zfs/fl/art/2022/art_d30139b442a141f48f05775d8c0b3cee.html'}
          ]
        },
        {
          id:'forced-consumption',
          tab:'强制消费',
          status:'现行',
          type:'行政法规 · 部门规章',
          authority:'国务院 · 市场监管总局',
          effective:'2024-07-01',
          document:'《消费者权益保护法实施条例》 + 《明码标价和禁止价格欺诈规定》',
          title:'经营者不能靠胁迫、限制离开或不透明价格把你逼着买单。',
          text:'《消费者权益保护法实施条例》第十一条禁止经营者以暴力、胁迫、限制人身自由等方式强制或变相强制消费者购买商品或者接受服务；价格规则还要求服务项目、内容和价格或计价方法明示，不得在标价之外加价，或者利用虚假、使人误解的价格手段诱骗交易。',
          action:'先以安全离场为优先；能安全做到时保存菜单、账单、商户信息和付款记录。要求商户说明项目、价格和收费依据；无法协商可向 12315 投诉，存在暴力、威胁或限制人身自由时直接报警。',
          sources:[
            {title:'【行政法规】《中华人民共和国消费者权益保护法实施条例》',href:'https://www.gov.cn/zhengce/content/202403/content_6940158.htm'},
            {title:'【部门规章】《明码标价和禁止价格欺诈规定》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2023/art_9a1f82a007964950a1a0f6c056f2fedf.html'}
          ]
        }
      ]
    },
    'thailand-travel-safety':{
      rules:[
        {
          id:'jaguar-maesot',
          tab:'Jaguar',
          kind:'case',
          status:'近期',
          type:'网络爆料',
          authority:'Reddit · Mae Sot',
          verified:'2026-08-28',
          document:'2026-08 · 湄索 / 泰缅边境',
          title:'边境转运是明确的风险信号。',
          text:'2026年8月，一名自称长期居住在湄索、曾住在 Jaguar 旧厂区附近的 Reddit 用户发帖，称当地曾出现外国人被陌生车辆接走、限制行动并向泰缅边境转运的情况。帖子属于第一人称网络爆料，具体细节未全部获独立证实；但它与同期已确认案件共同指向“私人接送 → 长距离转运 → 边境”的高风险路径。',
          action:'陌生车辆带你远离原定路线，并持续向边境或非旅游区域移动。',
          sources:[
            {title:'【网络线索】Thailand’s Jaguar Kidnapping',href:'https://www.reddit.com/r/ThailandTourism/comments/1vwaq4v/tourists_kidnapped_and_sold_in_thailand/'}
          ]
        },
        {
          id:'bangkok-pickup',
          tab:'陌生接送',
          kind:'case',
          status:'近期',
          type:'已确认案件',
          authority:'中国驻泰使馆 · 泰国警方',
          verified:'2026-08-28',
          document:'2026-08-23 · 曼谷酒店 → 甘烹碧 → 湄索方向',
          title:'酒店门口的一次接送，也可能是风险起点。',
          text:'2026年8月23日，一名中国女游客在曼谷酒店通过手机联系所谓“导游”，随后乘上对方安排的车辆；途中被多人控制、捆绑并向湄索方向带走。她在甘烹碧附近遇到警方检查点后成功逃脱，泰国警方随后抓获嫌疑人。',
          action:'上车前核对司机和目的地；一旦临时改道、增加陌生乘客或拒绝停车，立即把它当作风险升级。',
          sources:[
            {title:'【案件确认】中国驻泰使馆确认中国公民在泰遭绑架',href:'https://www.news.cn/20260825/93ac0af9048640b3b89b0d0f231844c2/c.html'},
            {title:'【案件细节】Nation Thailand',href:'https://www.nationthailand.com/news/general/40070189'}
          ]
        },
        {
          id:'business-transfer',
          tab:'商务邀约',
          kind:'case',
          status:'近期',
          type:'已确认案件',
          authority:'Royal Thai Police · TAT',
          verified:'2026-08-28',
          document:'2026-05 · 曼谷 Lat Krabang → 湄索 → 缅甸',
          title:'前半程正常，不代表下一程安全。',
          text:'2026年5月，四名中国公民受一名中国熟人以“商务活动”为由邀请，合法入境泰国后先住在曼谷 Lat Krabang，随后被带往湄索并跨境进入缅甸。四人被强迫参与呼叫中心诈骗，后经多方协调获释。',
          action:'熟人、商务名义、合法入境都不能替代对下一辆车、下一站和最终目的地的独立核验。',
          sources:[
            {title:'【已确认案件】TAT / Royal Thai Police',href:'https://www.tatnews.org/2026/05/tat-joins-royal-thai-police-briefing-on-assistance-to-four-chinese-nationals/'}
          ]
        },
        {
          id:'virtual-kidnapping',
          tab:'断联控制',
          kind:'case',
          status:'近期',
          type:'已确认案件',
          authority:'Royal Thai Police · TAT',
          verified:'2026-08-28',
          document:'2026-06 · 香港 → 泰国北榄府',
          title:'没有现场绑匪，也能先把人“隔离”。',
          text:'2026年6月，一名21岁中国学生被冒充执法人员的诈骗者远程操控：对方要求她与家人断联、独自前往泰国并拍摄“被绑架”照片，再向家属索要赎金。泰国警方最终在北榄府找到她，确认她并未被现场绑匪扣押。',
          action:'“不要告诉家人 + 独自行动 + 按对方指令换地点”同时出现，就是严重异常。',
          sources:[
            {title:'【已确认案件】TAT / Royal Thai Police：Virtual Kidnapping',href:'https://www.tatnews.org/2026/06/tat-reaffirms-visitor-safety-after-chinese-student-found-unharmed-in-virtual-kidnapping-case/'}
          ]
        }
      ]
    },
    'layoff-compensation':{
      rules:[
        {
          id:'xingyu-layoff',
          tab:'星宇劝退',
          kind:'case',
          status:'近期',
          type:'网络热议 · 官方通报',
          authority:'常州市人社局 · 星宇股份',
          verified:'2026-08-28',
          document:'2026-08 · 常州 · 107名应届毕业生解除劳动合同',
          title:'“个人离职 / 流水线二选一”，先别替公司写解除理由。',
          text:'2026年8月，星宇股份应届生解约事件引发网络热议。常州市人社局通报，公司共招录2026届高校毕业生440人，与其中107人解除劳动合同；公开报道显示，部分新员工在沟通中曾面临“个人原因离职”或转至一线操作岗位的选择。人社部门介入后，公司公开致歉并提出额外求职生活补贴等方案。',
          action:'约谈录音、调岗内容、薪资变化、解除主体全部留证；公司后来给的额外补贴，不等于法定统一补偿标准。',
          sources:[
            {title:'【官方通报】常州市人社局关于星宇股份解聘应届毕业生情况',href:'https://js.news.cn/20260825/e59dbee2f7f945aaaed13cdd647877c7/c.html'},
            {title:'【事件进展】星宇股份致歉与补偿方案',href:'https://www.chinanews.com/sh/2026/08-27/10685053.shtml'}
          ]
        },
        {
          id:'ai-replacement',
          tab:'AI替岗',
          kind:'case',
          status:'近期',
          type:'典型案例',
          authority:'杭州中院',
          verified:'2026-08-28',
          document:'2026-04 · 杭州 · AI替岗降薪解约案',
          title:'AI能替岗，不等于公司可以直接降薪解约。',
          text:'杭州一家公司因引入AI调整岗位，拟将一名员工月薪从2.5万元降至1.5万元；员工拒绝降薪后，公司解除劳动合同。杭州两级法院认为，企业主动进行技术升级并不当然意味着劳动合同已经无法履行，最终认定公司违法解除。',
          action:'公司说“岗位被AI替代”时，先看解除依据、调岗是否合理、薪酬变化，以及是否真的到了合同无法履行。',
          sources:[
            {title:'【典型案例】“AI替岗”能否成辞退理由',href:'https://www.zj.news.cn/20260430/1f6a0708d647452fbe9a9f94a99f7421/c.html'}
          ]
        },
        {
          id:'department-closure',
          tab:'部门撤销',
          kind:'case',
          status:'近期',
          type:'生效裁判',
          authority:'北京三中院',
          verified:'2026-08-28',
          document:'2026-07 · 北京 · 撤销研发部门后解除员工',
          title:'部门没了，也不等于劳动合同当然可以解除。',
          text:'北京一家公司撤销研发部门后，以组织架构调整为由解除一名员工。北京三中院认为，部门撤销并不当然等于“客观情况发生重大变化”并导致劳动合同无法履行，最终判公司支付违法解除赔偿金差额、年终奖等共49万余元。',
          action:'遇到“组织优化 / 岗位取消”，要求公司说明为什么劳动合同已经无法继续履行，并提交相应事实和依据。',
          sources:[
            {title:'【生效裁判】撤销部门后解雇员工，一公司被判违法',href:'https://www.workercn.cn/c/2026-07-16/8848170.shtml'}
          ]
        },
        {
          id:'termination-proof',
          tab:'解除理由',
          status:'现行',
          type:'司法解释 · 指导性案例',
          authority:'最高人民法院',
          verified:'2026-08-27',
          document:'劳动争议司法解释（一）第四十四条 + 指导案例18号',
          title:'公司说“你不胜任”，不是你先证明自己没问题。',
          text:'因用人单位作出的辞退、解除劳动合同、减少劳动报酬、计算工作年限等决定发生劳动争议，用人单位承担相应举证责任。最高法指导案例18号进一步明确，绩效考核排名末位不等同于“不能胜任工作”，公司仍要证明符合法定解除条件。',
          action:'要求公司把解除理由固定成书面：具体事实、适用制度或法定条款、考核数据，以及培训或调岗记录（如适用）。不要只接受“组织优化”“绩效不佳”这种结论词。',
          sources:[
            {title:'【司法解释】最高法劳动争议司法解释（一）',href:'https://www.court.gov.cn/fabu/xiangqing/282121.html'},
            {title:'【指导性案例】指导案例18号',href:'https://www.court.gov.cn/shenpan/xiangqing/6002.html'}
          ]
        },
        {
          id:'job-transfer',
          tab:'调岗边界',
          status:'现行',
          type:'法律 · 生效裁判',
          authority:'全国人大常委会 · 人民法院',
          verified:'2026-08-27',
          document:'《劳动合同法》第三十五条 + 2026年公布生效调岗裁判',
          title:'调岗不是“公司一句话，你只能服从”。',
          text:'劳动合同约定内容原则上应协商变更；即使合同约定公司在一定条件下有调岗权，司法实践仍会审查必要性、合理性和正当性。2026年公布的一起生效案件中，工程师被调去流水线操作工，因岗位内容、模式、工时等差异显著，员工书面反对并继续出勤后被以旷工解除，法院认定违法解除。',
          action:'书面提出异议并要求说明岗位职责、地点、工时、薪酬、期限、考核和调整依据，同时持续表达愿意正常提供劳动；不要因为不同意调岗就自行停止出勤。',
          sources:[
            {title:'【法律】《中华人民共和国劳动合同法》',href:'https://www.mohrss.gov.cn/xxgk2020/fdzdgknr/zcfg/fl/202011/t20201102_394622.html'},
            {title:'【生效裁判】工程师拒绝调岗生产流水线被解雇案',href:'https://www.hncourt.gov.cn/public/detail.php?id=202850'}
          ]
        },
        {
          id:'economic-layoff',
          tab:'批量裁员',
          status:'现行',
          type:'法律',
          authority:'全国人大常委会',
          effective:'2008-01-01',
          verified:'2026-08-27',
          document:'《中华人民共和国劳动合同法》第四十一至四十二条',
          title:'达到经济性裁员门槛，事由、程序和留用规则都不能省。',
          text:'裁减20人以上，或者不足20人但占企业职工总数10%以上时，经济性裁员必须落到法定事由，并履行提前30日向工会或全体职工说明、听取意见、将方案向劳动行政部门报告等程序；法律同时规定优先留用人员和部分不得依第四十、四十一条解除的保护情形。',
          action:'要求公司说明本轮裁员人数和职工总数、采用的法定事由、职工说明和报告程序、你的筛选依据；属于优先留用或法定保护情形的，立即书面提出并附证明。',
          sources:[
            {title:'【法律】《中华人民共和国劳动合同法》第四十一至四十二条',href:'https://www.mohrss.gov.cn/xxgk2020/fdzdgknr/zcfg/fl/202011/t20201102_394622.html'}
          ]
        },
        {
          id:'compensation-formula',
          tab:'补偿计算',
          status:'现行',
          type:'法律 · 行政法规',
          authority:'全国人大常委会 · 国务院',
          verified:'2026-08-27',
          document:'《劳动合同法》第四十六至四十八条、第八十七条 + 《劳动合同法实施条例》',
          title:'N、N+1、2N要按解除路径计算，不能混着算。',
          text:'N通常指第四十七条经济补偿：每满一年一个月工资，六个月以上不满一年按一年，不满六个月按半个月；“+1”主要是用人单位依第四十条解除时，以额外一个月工资替代提前30日书面通知，并非所有裁员都自动有；违法解除或终止的赔偿金按经济补偿标准二倍计算，依法支付赔偿金后不再另叠一份经济补偿。',
          action:'要求公司写明解除依据，再分别计算工龄、经济补偿月工资基数和通知方式。要求公司给出逐项结算表，不接受只有“N+1”“0.5N”结论、没有计算路径的方案。',
          sources:[
            {title:'【法律】《中华人民共和国劳动合同法》',href:'https://www.mohrss.gov.cn/xxgk2020/fdzdgknr/zcfg/fl/202011/t20201102_394622.html'},
            {title:'【行政法规】《中华人民共和国劳动合同法实施条例》',href:'https://www.beijing.gov.cn/zhengce/gwywj/201105/t20110506_780976.html'}
          ]
        }
      ]
    },
    'qingdao-travel':{
      rules:[
        {
          id:'pricing-unit',
          tab:'明码标价',
          status:'现行',
          type:'部门规章',
          authority:'市场监管总局',
          effective:'2022-07-01',
          verified:'2026-08-29',
          document:'《明码标价和禁止价格欺诈规定》',
          title:'标价必须说清计价单位，未标明的加工费不得收取。',
          text:'经营者标示价格必须真实明确，标明品名、计价单位、计价方法；不得使用欺骗性、误导性的标价方式，严禁低价诱骗后高价结算。餐饮未显著标明单列加工费、茶位费的，不得强行加收。',
          action:'点单时要求在单据上写清“单价 + 计价单位（按斤还是按只）+ 实际重量 + 加工费”，算清总价再通知后厨。未标明或未经确认的费用坚决拒付。',
          sources:[
            {title:'【部门规章】《明码标价和禁止价格欺诈规定》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/fgs/art/2023/art_9a1f82a007964950a1a0f6c056f2fedf.html'}
          ]
        },
        {
          id:'driver-kickback',
          tab:'商业贿赂',
          status:'现行',
          type:'法律 · 部门规章',
          authority:'全国人大常委会 · 交通运输部',
          effective:'2019-04-23',
          verified:'2026-08-29',
          document:'《反不正当竞争法》第八条 + 《巡游出租汽车经营服务管理规定》',
          title:'司机拉客吃高额回扣，属于违法商业贿赂与违规营运。',
          text:'经营者不得采用财物或者其他手段贿赂交易相对方以谋取交易机会。出租车、网约车利用营运便利向游客推销特定高价排档并收取“人头费/返点”，既违反营运规范，也涉嫌不正当竞争。',
          action:'坚决拒绝司机主动推荐的餐馆与特产店。如被诱导或强行拉至合作排档，保存行车录音、订单号与车牌，向 12328 和 12345 举报。',
          sources:[
            {title:'【法律】《反不正当竞争法》第八条',href:'https://www.npc.gov.cn/npc/c2/c12435/201904/t20190424_254884.html'},
            {title:'【部门规章】《巡游出租汽车经营服务管理规定》',href:'https://xxgk.mot.gov.cn/2020/jigou/fgs/202108/t20210825_3616611.html'}
          ]
        },
        {
          id:'forced-addon',
          tab:'强制消费',
          status:'现行',
          type:'行政法规',
          authority:'国务院',
          effective:'2024-07-01',
          verified:'2026-08-29',
          document:'《消费者权益保护法实施条例》第十条',
          title:'不得强制搭售保险或装备，未经确认不得擅自增加收费。',
          text:'《消保条例》明确禁止经营者强制或者变相强制消费者购买商品或者接受服务；提供服务时未经消费者确认不得增加收费。游艇出海强制加收救生衣费、开蚌未经同意擅自打孔加工，均属违法。',
          action:'出海与体验前核对全包明细并保留价目表。未明示同意前制止商家破坏性加工；遇中途强制加价当场留存视频并向 12345 举报。',
          sources:[
            {title:'【行政法规】《消费者权益保护法实施条例》',href:'https://www.samr.gov.cn/zw/zfxxgk/fdzdgknr/bgt/art/2024/art_0aea188276a44f0baf940ab95ee00e0a.html'}
          ]
        },
        {
          id:'lodging-breach',
          tab:'违约赔偿',
          status:'现行',
          type:'法律',
          authority:'全国人大常委会',
          effective:'2021-01-01',
          verified:'2026-08-29',
          document:'《中华人民共和国民法典》第五百七十七条、第五百八十四条',
          title:'旺季民宿单方毁约加价，消费者可依法主张替代房源差价损失。',
          text:'预订成功即合同成立。房东单方借故退单转头高价重挂属于故意违约，不仅应全额退款，还应赔偿消费者另行预订同级房源产生的合理差价损失。消费者不应被诱导点击“主动取消”。',
          action:'遇退单要求绝不在平台主动取消；要求平台按违约保障提供同品质替代房源并垫付差价，保留沟通记录及另行订房差价发票。',
          sources:[
            {title:'【法律】《中华人民共和国民法典》合同编',href:'https://www.npc.gov.cn/npc/c2/c30834/202006/t20200601_306450.html'}
          ]
        },
        {
          id:'public-photography',
          tab:'景区拍照',
          status:'现行',
          type:'法律 · 警方通报',
          authority:'全国人大常委会 · 青岛公安',
          effective:'2013-01-01',
          verified:'2026-08-29',
          document:'《治安管理处罚法》第四十二条 + 海之恋公园行政处罚案例',
          title:'公园步道正常拍照合法；借故辱骂围堵涉嫌治安违法。',
          text:'文旅部门明确并未禁止在公园步道正常拍照。在公共场所借故挑衅、公然侮辱、恐吓他人或限制人身自由，属于治安违法行为。健康状况须经法定司法鉴定，不能作为违法免责的现场借口。',
          action:'遇无理纠缠不自证、不过度道歉；保持安全距离并全程录像留证，立即拨打 110 报警要求出警处置并追究法律责任。',
          sources:[
            {title:'【法律】《中华人民共和国治安管理处罚法》',href:'https://www.gov.cn/flfg/2012-10/26/content_2252115.htm'},
            {title:'【官方通报】青岛市公安局崂山分局：海之恋公园案情通报',href:'https://weibo.com/'}
          ]
        }
      ]
    },
    'transport-platform-layered-fees':{
      rules:[
        {
          id:'ride-hailing-ledger',
          tab:'网约车账单',
          status:'现行',
          type:'部门政策文件',
          authority:'交通运输部等八部门',
          verified:'2026-09-02',
          document:'《关于加强交通运输新业态从业人员权益保障工作的意见》',
          title:'网约车一单结束后，司机端应同时看到乘客支付、司机报酬和本单抽成。',
          text:'现行政策要求网约车平台公告计价和收入分配规则；每次订单完成后，司机端应同时列明乘客支付总金额、司机劳动报酬，并显示两者差额占乘客支付总金额的比例。聚合平台还应展示合作网约车平台、许可和投诉渠道。',
          action:'把乘客端支付截图与司机端同一订单的三项数据放在一起。金额对不上时，要求入口、流转和实际承运平台逐层说明订单去向、收费金额和计费依据。',
          sources:[
            {title:'【部门政策文件】八部门《关于加强交通运输新业态从业人员权益保障工作的意见》',href:'https://xxgk.mot.gov.cn/2020/jigou/ysfws/202111/t20211130_3628783.html'},
            {title:'【部门政策文件】五部门《关于切实做好网约车聚合平台规范管理有关工作的通知》',href:'https://xxgk.mot.gov.cn/jigou/ysfws/202304/t20230426_3811942.html'}
          ]
        },
        {
          id:'freight-bidding',
          tab:'货运竞价',
          status:'现行',
          type:'部门政策文件 · 监管整改',
          authority:'交通运输部等部门 · 市场监管总局',
          verified:'2026-09-02',
          document:'货车司机权益保障意见 + 货拉拉反垄断合规整改',
          title:'平台不能靠竞价和算法把司机持续推向恶性低价竞争。',
          text:'交通运输部等部门要求互联网道路货运平台合理确定并公示计价、竞价和派单规则，不得诱导货主不合理压价或司机恶性低价竞争。2026年市场监管总局又明确要求货拉拉停止利用算法不合理压低货运价格，公平合理运用调价算法，并公示计价规则和运价涨降理由。',
          action:'同路线、车型和时段连续调价时，保存每次报价与时间。要求平台提供当时适用的计价规则版本、调价理由和本单价格调整记录；出现明显压价且无法解释时，向12328和属地市场监管部门提交完整记录。',
          sources:[
            {title:'【部门政策文件】《关于加强货车司机权益保障工作的意见》',href:'https://xxgk.mot.gov.cn/2020/jigou/ysfws/202111/t20211103_3624340.html'},
            {title:'【监管整改】市场监管总局：督导货拉拉落实反垄断合规整改',href:'https://www.samr.gov.cn/zt/ndzt/2025n/zhzznjsjzwhgpjzsczx/zjbs/art/2026/art_4a37633a95ec4927a3898be3a8bd96dc.html'}
          ]
        }
      ]
    }
  };

  const esc=value=>String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');
  const link=source=>source?`<a href="${esc(source.href)}" target="_blank" rel="noopener">${esc(source.title)} →</a>`:'';
  const ruleSources=rule=>rule.sources||[];
  const normalizeRules=item=>item&&Array.isArray(item.rules)?item.rules:[];
  const isCaseRule=rule=>rule&&rule.kind==='case';
  const ruleVerified=rule=>rule&&rule.verified?rule.verified:VERIFIED;
  const itemVerified=item=>normalizeRules(item).reduce((latest,rule)=>ruleVerified(rule)>latest?ruleVerified(rule):latest,VERIFIED);

  function allSources(item){
    const seen=new Set();
    return normalizeRules(item).flatMap(ruleSources).filter(source=>{
      if(!source||!source.href||seen.has(source.href)) return false;
      seen.add(source.href);
      return true;
    });
  }

  function getActiveCase(){
    const name=document.getElementById('caseName')?.textContent?.trim();
    return (window.BUCHIKUI_CASES||[]).find(item=>item.name===name)||null;
  }

  function ensureHost(){
    let host=document.getElementById('rightsPulse');
    if(host) return host;
    host=document.createElement('section');
    host.id='rightsPulse';
    const hero=document.querySelector('.hero');
    if(hero) hero.insertAdjacentElement('afterend',host);
    return host;
  }

  function ruleBasis(rule){
    return [rule.type,rule.authority].filter(Boolean).join(' · ');
  }

  function metaHtml(rule,count){
    return `
      <span class="rights-pulse-label">${isCaseRule(rule)?'案例参考':'权利校验'}</span>
      <strong>${esc(rule.status||'现行')}</strong>
      ${ruleBasis(rule)?`<span>${esc(ruleBasis(rule))}</span>`:''}
      ${rule.effective?`<span>实施 ${esc(rule.effective)}</span>`:''}
      ${count>1?`<span>${count} 项关键参考</span>`:''}
      <span>核验 ${esc(ruleVerified(rule))}</span>`;
  }

  function panelHtml(rule){
    const sources=ruleSources(rule).map(link).join('<span aria-hidden="true"> · </span>');
    return `
      ${rule.document?`<div class="rights-pulse-document">${esc(rule.document)}</div>`:''}
      <h2>${esc(rule.title)}</h2>
      <p>${esc(rule.text)}</p>
      <div class="rights-pulse-action"><span>${isCaseRule(rule)?'关键提取':'你现在可以要求'}</span><strong>${esc(rule.action)}</strong></div>
      ${sources?`<div class="rights-pulse-sources">${sources}</div>`:''}`;
  }

  function syncSources(item){
    const list=document.getElementById('sourceList');
    if(!list) return;
    const sources=allSources(item);
    const verified=itemVerified(item);
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
      li.append(a,document.createTextNode(` — 本页参考来源；资料核验 ${verified}。`));
      list.appendChild(li);
      existing.add(normalized);
    });
    const title=document.getElementById('sourcesTitle');
    if(title&&!title.textContent.includes('资料核验')) title.textContent+=` · 资料核验 ${verified}`;
  }

  function bindRuleTabs(host,rules){
    const buttons=[...host.querySelectorAll('[data-rights-rule]')];
    if(buttons.length<2) return;

    const meta=host.querySelector('.rights-pulse-meta');
    const panel=host.querySelector('.rights-pulse-panel');

    function select(index,focus){
      const rule=rules[index];
      if(!rule) return;
      buttons.forEach((button,buttonIndex)=>{
        const selected=buttonIndex===index;
        button.setAttribute('aria-selected',selected?'true':'false');
        button.tabIndex=selected?0:-1;
      });
      meta.innerHTML=metaHtml(rule,rules.length);
      panel.innerHTML=panelHtml(rule);
      panel.setAttribute('aria-labelledby',buttons[index].id);
      if(focus) buttons[index].focus();
    }

    buttons.forEach((button,index)=>{
      button.addEventListener('click',()=>select(index,false));
      button.addEventListener('keydown',event=>{
        let next=null;
        if(event.key==='ArrowRight') next=(index+1)%buttons.length;
        if(event.key==='ArrowLeft') next=(index-1+buttons.length)%buttons.length;
        if(event.key==='Home') next=0;
        if(event.key==='End') next=buttons.length-1;
        if(next===null) return;
        event.preventDefault();
        select(next,true);
      });
    });
  }

  function render(){
    const host=ensureHost();
    const active=getActiveCase();
    const item=active&&updates[active.slug];
    const rules=normalizeRules(item);
    if(!rules.length){
      host.hidden=true;
      host.innerHTML='';
      return;
    }

    const first=rules[0];
    host.setAttribute('aria-label',rules.some(isCaseRule)?'关键规则与案例参考':'当前法律状态与消费者权利');
    const tabs=rules.length>1?`<div class="rights-pulse-tabs" role="tablist" aria-label="切换关键参考">${rules.map((rule,index)=>`<button class="rights-pulse-tab" type="button" role="tab" id="rightsRuleTab-${index}" aria-controls="rightsPulsePanel" aria-selected="${index===0?'true':'false'}" tabindex="${index===0?'0':'-1'}" data-rights-rule="${index}">${esc(rule.tab)}</button>`).join('')}</div>`:'';

    host.hidden=false;
    host.innerHTML=`<div class="wrap"><div class="rights-pulse">
      <div class="rights-pulse-meta">${metaHtml(first,rules.length)}</div>
      <div class="rights-pulse-content">
        ${tabs}
        <div class="rights-pulse-panel" id="rightsPulsePanel" role="tabpanel"${rules.length>1?' aria-labelledby="rightsRuleTab-0"':''}>${panelHtml(first)}</div>
      </div>
    </div></div>`;
    syncSources(item);
    bindRuleTabs(host,rules);
  }

  window.addEventListener('DOMContentLoaded',()=>{
    render();
    const name=document.getElementById('caseName');
    if(name) new MutationObserver(render).observe(name,{childList:true,subtree:true,characterData:true});
  });
})();