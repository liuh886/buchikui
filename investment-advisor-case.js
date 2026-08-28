window.BUCHIKUI_CASES.push({
  id:'006',
  slug:'alipay-advisor-cost',
  name:'支付宝投顾的真实损耗',
  label:'INVESTMENT ADVISORY',
  layout:'compact',
  updated:'2026-08-28',
  meta:{
    title:'不吃亏｜支付宝投顾的真实损耗',
    description:'把交易手续费、底层运作费和投顾管理费放在同一张图里，再和 IQQ、国内纳指 ETF 做费用对比。',
    ogTitle:'支付宝投顾的真实损耗。',
    ogDescription:'页面上最显眼的投顾管理费只是冰山一角。真正要看的是交易手续费、底层基金运作费和投顾管理费叠加后的成本。'
  },
  shareText:'支付宝投顾的真实交易成本犹如冰山：交易手续费、底层运作费和投顾管理费要一起看。',
  hero:{
    title:'支付宝投顾的<br><em>真实损耗。</em>',
    copy:'投顾不是一种新的资产，而是在基金之上加了一层服务。<strong>底层基金自己的费用照收，再加投顾费。</strong> 所以判断值不值，不要先看收益曲线，先把这座“费用冰山”看完整。'
  },
  panic:{
    title:'买之前，<br>只问这 4 件事。',
    items:[
      {title:'底层买的是什么',text:'先知道组合真正持有什么基金。'},
      {title:'底层基金本身多少钱',text:'管理费、托管费等不会因为买了投顾就消失。'},
      {title:'交易还要花多少钱',text:'申购、赎回、调仓等交易摩擦也会进入真实成本。'},
      {title:'投顾再收多少',text:'投顾管理费是额外加上去的一层，必须单独判断值不值。'}
    ]
  },
  route:{
    kicker:'案例算账',
    navLabel:'案例算账',
    title:'支付宝投顾的真实交易成本<br>犹如冰山。',
    intro:'页面最显眼的投顾管理费，只是露出水面的那一角。真正的成本还包括底层组合的运作费和交易手续费。',
    steps:[
      {title:'露出水面的：投顾管理费',text:'本案例样本约 0.50%/年。单看这个数字并不夸张，但它不是总成本。',href:'#route',link:'继续看冰山下面 →'},
      {title:'水下的大头：底层运作费',text:'本案例样本约 1.00%/年。投顾不会替代底层基金费用，这一层仍然持续存在。',href:'#route',link:'看底层费用 →'},
      {title:'每次动作还有交易成本',text:'本案例样本把申购、退出等交易手续费合计按约 0.22% 作示意。调仓越频繁，交易摩擦越值得留意。',href:'#route',link:'看完整费用 →'},
      {title:'然后再和 ETF 放在一起',text:'IQQ 产品费用约 0.10%；国内纳指100 ETF 的管理费 + 托管费常见约 0.60%–1.00%。把这些放在同一张图里，费用层级差异会非常直观。',href:'https://www.ishares.com/us/products/351653/ishares-nasdaq-100-etf',link:'查看 IQQ 官方费用 →'}
    ],
    comparison:{
      title:'把所有费用放在同一张图里',
      intro:'柱子越长，已知费用越高。ETF 的交易佣金由券商和账户决定，因此单独标注；支付宝投顾则按本案例样本，把交易手续费、运作费和投顾管理费放在同一行。',
      max:1.72,
      legend:[
        {kind:'product',label:'管理 / 运作费'},
        {kind:'custody',label:'托管费'},
        {kind:'trading',label:'交易手续费'},
        {kind:'advisor',label:'投顾管理费'}
      ],
      rows:[
        {label:'IQQ',totalLabel:'0.10% + 交易费',extra:'交易费按券商 / 账户实际',segments:[{kind:'product',value:0.10}]},
        {label:'嘉实 159501',totalLabel:'0.60% + 交易费',extra:'管理费 0.50% + 托管费 0.10%',segments:[{kind:'product',value:0.50},{kind:'custody',value:0.10}]},
        {label:'易方达 159696',totalLabel:'0.60% + 交易费',extra:'管理费 0.50% + 托管费 0.10%',segments:[{kind:'product',value:0.50},{kind:'custody',value:0.10}]},
        {label:'招商 159659',totalLabel:'0.65% + 交易费',extra:'管理费 0.50% + 托管费 0.15%',segments:[{kind:'product',value:0.50},{kind:'custody',value:0.15}]},
        {label:'博时 513390',totalLabel:'0.65% + 交易费',extra:'管理费 0.50% + 托管费 0.15%',segments:[{kind:'product',value:0.50},{kind:'custody',value:0.15}]},
        {label:'国泰 513100',totalLabel:'0.80% + 交易费',extra:'管理费 0.60% + 托管费 0.20%',segments:[{kind:'product',value:0.60},{kind:'custody',value:0.20}]},
        {label:'华夏 513300',totalLabel:'0.80% + 交易费',extra:'管理费 0.60% + 托管费 0.20%',segments:[{kind:'product',value:0.60},{kind:'custody',value:0.20}]},
        {label:'华安 159632',totalLabel:'0.80% + 交易费',extra:'管理费 0.60% + 托管费 0.20%',segments:[{kind:'product',value:0.60},{kind:'custody',value:0.20}]},
        {label:'广发 159941',totalLabel:'1.00% + 交易费',extra:'管理费 0.80% + 托管费 0.20%',segments:[{kind:'product',value:0.80},{kind:'custody',value:0.20}]},
        {label:'大成 159513',totalLabel:'1.00% + 交易费',extra:'管理费 0.80% + 托管费 0.20%',segments:[{kind:'product',value:0.80},{kind:'custody',value:0.20}]},
        {label:'华泰柏瑞 513110',totalLabel:'1.00% + 交易费',extra:'管理费 0.80% + 托管费 0.20%',segments:[{kind:'product',value:0.80},{kind:'custody',value:0.20}]},
        {label:'支付宝投顾',totalLabel:'约 1.72%',extra:'交易手续费约 0.22% + 运作费约 1.00% + 投顾管理费约 0.50%',highlight:true,segments:[{kind:'trading',value:0.22},{kind:'product',value:1.00},{kind:'advisor',value:0.50}]}
      ],
      footnote:'ETF 的管理费、托管费是持续费用；交易佣金随券商和账户变化，不硬填统一数字。支付宝的 0.22% + 1.00% + 0.50% 为本案例费用样本，用来说明费用结构，不代表所有账户、所有时期都完全一致。'
    },
    note:'<strong>真正要记住：</strong>看到“投顾管理费约 0.50%”时，不要把它误当成总成本。这个案例里，交易手续费约 0.22%、底层运作费约 1.00%、投顾管理费约 0.50%，合在一起才构成完整的费用冰山。'
  },
  takeaway:'支付宝投顾最容易被低估的，不是某一个费率，而是费用会叠层：交易手续费 + 底层运作费 + 投顾管理费。',
  sources:[
    {title:'iShares Nasdaq 100 ETF（IQQ）官方费用页',href:'https://www.ishares.com/us/products/351653/ishares-nasdaq-100-etf',note:'当前官方 Expense Ratio 0.12%，费率减免后的 Net Expense Ratio 为 0.10%。'},
    {title:'易方达纳斯达克100ETF（QDII）产品资料概要',href:'https://cdn.efunds.com.cn/owch/data/bulletin/20260519/%E6%98%93%E6%96%B9%E8%BE%BE%E7%BA%B3%E6%96%AF%E8%BE%BE%E5%85%8B100%E4%BA%A4%E6%98%93%E5%9E%8B%E5%BC%80%E6%94%BE%E5%BC%8F%E6%8C%87%E6%95%B0%E8%AF%81%E5%88%B8%E6%8A%95%E8%B5%84%E5%9F%BA%E9%87%91%EF%BC%88QDII%EF%BC%89%E5%9F%BA%E9%87%91%E4%BA%A7%E5%93%81%E8%B5%84%E6%96%99%E6%A6%82%E8%A6%81%E6%9B%B4%E6%96%B0.pdf?from=person',note:'159696：管理费 0.50%/年，托管费 0.10%/年。'},
    {title:'招商纳斯达克100ETF（QDII）官方产品页',href:'https://www.cmfchina.com/web/fundDetail/159659/index.html',note:'159659：管理费 0.50%/年，托管费 0.15%/年。'},
    {title:'国泰纳斯达克100ETF 官方产品页',href:'https://e.gtfund.com/etrade/Jijin/view/id/513100',note:'513100：管理费 0.60%/年，托管费 0.20%/年。'},
    {title:'广发基金关于 159941 费率调整的官方公告',href:'https://www.gffunds.com.cn/jjgg/zdsj/202501/P020250127531384860496.pdf',note:'159941：管理费 0.80%/年，托管费调整后为 0.20%/年。'}
  ],
  legal:'免责声明：本案例用于解释投资费用结构，不构成投资建议。IQQ 与国内 QDII ETF 只作为费用量级参照，不代表与支付宝投顾拥有相同资产配置或风险收益特征。支付宝 0.22% 交易手续费、1.00% 运作费、0.50% 投顾管理费为本案例费用样本，具体以实际签约页面、底层基金资料和交易记录为准。'
});
