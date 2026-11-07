(function(root){
  'use strict';
  // 阅读顺序与短章名；正文、法源和搜索内容仍来自原 CASE 数据。
  const volumes=[
    {title:'把钱要回来',chapters:[['rental','租车'],['rental-credit-card-first','信用免押'],['beauty-hair','预付消费'],['bank-small-account-fee','银行账户收费'],['bank-wealth-not-guaranteed','银行理财'],['alipay-advisor-cost','投顾费用'],['alibaba-auction-trap','拍卖']]},
    {title:'平台与商家',chapters:[['mobile-plan-cost','话费套餐'],['appliance-repair-trap','家电维修'],['after-sales','售后与退订'],['airport-sales-pitch','机场推销'],['transport-platform-layered-fees','出行平台收费']]},
    {title:'人生转折',chapters:[['layoff-compensation','被裁与补偿'],['dating-safety','相亲安全']]},
    {title:'远行与境外',chapters:[['travel-booking','客房预订'],['thailand-travel-safety','泰国旅行'],['qingdao-travel','青岛旅游']]},
    {title:'自己去打',chapters:[['internet-court-self-litigation','第一次自己打官司']]}
  ];
  const numerals=['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五','十六','十七','十八'];
  const chapters=volumes.flatMap((volume,volumeIndex)=>volume.chapters.map(([slug,title])=>({slug,title,volume:volume.title,volumeIndex})));
  chapters.forEach((chapter,index)=>{chapter.index=index;chapter.label=`第${numerals[index]}章`;});
  root.BuchikuiBook={volumes,chapters,number:index=>numerals[index]||String(index+1),chapter:slug=>chapters.find(chapter=>chapter.slug===slug)};
})(typeof window!=='undefined'?window:globalThis);
