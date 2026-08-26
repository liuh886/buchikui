window.BUCHIKUI_CASES.push({
  id:'006',
  slug:'alipay-advisor-cost',
  name:'支付宝投顾：这层费用值不值',
  label:'INVESTMENT ADVISORY',
  layout:'compact',
  updated:'2026-08-26',
  meta:{
    title:'不吃亏｜支付宝投顾：这层费用值不值',
    description:'先看底层基金费用，再看额外投顾费。用 IQQ 和国内纳指 ETF 做参照，理解支付宝投顾真正多收了什么。',
    ogTitle:'支付宝投顾值不值？先看多付的这层钱。',
    ogDescription:'投顾不是一种新的资产，而是在底层基金之上再加一层服务和一层费用。'
  },
  shareText:'支付宝投顾不是一种新的资产，而是在底层基金之上再加一层服务。值不值，关键看多付的这层费用到底换来了什么。',
  hero:{
    title:'支付宝投顾值不值？<br>先看它比自己买基金<br><em>多收了什么。</em>',
    copy:'投顾不是一种新的资产，而是在基金之上加了一层服务。<strong>底层基金自己的费用照收，再加投顾费。</strong> 所以判断值不值，不要先看收益曲线，先把这层费用看懂。'
  },
  panic:{
    title:'买之前，<br>只问这 4 件事。',
    items:[
      {title:'底层买的是什么',text:'先知道组合真正持有什么基金。'},
      {title:'底层基金本身多少钱',text:'管理费、托管费等不会因为买了投顾就消失。'},
      {title:'投顾再收多少',text:'投顾服务费是额外加上去的一层。'},
      {title:'多付的钱买到了什么',text:'资产配置、再平衡、风险控制和帮助你少犯错，才是这层服务真正要证明的价值。'}
    ]
  },
  route:{
    kicker:'案例算账',
    navLabel:'案例算账',
    title:'先看底层，<br>再看投顾这一层。',
    intro:'这个 CASE 只讲一个逻辑：同样是投资基金，自己买只承担产品层费用；通过投顾，还要再付一层服务费。',
    steps:[
      {title:'自己买低费率 ETF',text:'以 IQQ 为参照，当前净费用率约 0.10%/年。它说明一件事：获取一个成熟指数暴露，本身可以很便宜。',href:'https://www.ishares.com/us/products/351653/ishares-nasdaq-100-etf',link:'查看 IQQ 官方费用 →'},
      {title:'国内同类 ETF',text:'国内纳指100 ETF 的管理费 + 托管费常见约 0.60%–1.00%/年。底层工具之间，本来就存在明显费用差。',href:'#route',link:'看国内费率区间 →'},
      {title:'支付宝投顾再加一层',text:'此前案例记录的投顾服务费约 0.50%/年。关键点不是“0.50%贵不贵”，而是它会叠加在底层基金费用之上。',href:'#route',link:'看费用怎么叠加 →'},
      {title:'最后只问一个问题',text:'这层投顾服务，能不能通过资产配置、再平衡、风险控制和行为管理，创造超过这层额外成本的价值？如果不能，便宜的底层工具就更占优势。',href:'#route',link:'回到核心判断 →'}
    ],
    note:'<strong>把结构看成三层就够了：</strong><br><br><code>自己买 IQQ        约 0.10%</code><br><code>自己买国内纳指 ETF 约 0.60%–1.00%</code><br><code>支付宝投顾        底层基金费用 + 约 0.50% 投顾费</code><br><br><strong>这张表真正有用的地方，不是告诉你哪只 ETF 排第几。</strong>它只是证明：底层产品本身就有费用差，而投顾费是在这个基础上继续往上加。<br><br><strong>所以主线很简单：</strong>投顾不是“更高级的基金”，而是“基金 + 服务”。多付的钱是否值得，取决于这层服务能否让你获得更好的配置、少承担不必要的风险，或者少犯足以吞掉费用差的错误。<br><br><span style="display:none">IQQ        █           0.10% 易方达159696 ██████      0.60% 广发159941  ██████████  1.00% 投顾服务费约 0.50%/年只是新增的一层</span>'
  },
  takeaway:'先看底层基金多少钱，再看投顾多收了什么。投顾值不值，最终看这层服务是否真的创造了超过费用的价值。',
  sources:[
    {title:'iShares Nasdaq 100 ETF（IQQ）官方费用页',href:'https://www.ishares.com/us/products/351653/ishares-nasdaq-100-etf',note:'当前官方 Expense Ratio 0.12%，费率减免后的 Net Expense Ratio 为 0.10%。'},
    {title:'易方达纳斯达克100ETF（QDII）产品资料概要',href:'https://cdn.efunds.com.cn/owch/data/bulletin/20260519/%E6%98%93%E6%96%B9%E8%BE%BE%E7%BA%B3%E6%96%AF%E8%BE%BE%E5%85%8B100%E4%BA%A4%E6%98%93%E5%9E%8B%E5%BC%80%E6%94%BE%E5%BC%8F%E6%8C%87%E6%95%B0%E8%AF%81%E5%88%B8%E6%8A%95%E8%B5%84%E5%9F%BA%E9%87%91%EF%BC%88QDII%EF%BC%89%E5%9F%BA%E9%87%91%E4%BA%A7%E5%93%81%E8%B5%84%E6%96%99%E6%A6%82%E8%A6%81%E6%9B%B4%E6%96%B0.pdf?from=person',note:'159696：管理费 0.50%/年，托管费 0.10%/年。'},
    {title:'招商纳斯达克100ETF（QDII）官方产品页',href:'https://www.cmfchina.com/web/fundDetail/159659/index.html',note:'159659：管理费 0.50%/年，托管费 0.15%/年。'},
    {title:'国泰纳斯达克100ETF 官方产品页',href:'https://e.gtfund.com/etrade/Jijin/view/id/513100',note:'513100：管理费 0.60%/年，托管费 0.20%/年。'},
    {title:'广发基金关于 159941 费率调整的官方公告',href:'https://www.gffunds.com.cn/jjgg/zdsj/202501/P020250127531384860496.pdf',note:'159941：管理费 0.80%/年，托管费调整后为 0.20%/年。'}
  ],
  legal:'免责声明：本案例用于解释投资费用结构，不构成投资建议。IQQ 与国内 QDII ETF 只作为费用量级参照，不代表与支付宝投顾拥有相同资产配置或风险收益特征。实际费率以当时有效的投顾协议、基金资料和收费页面为准。'
});
