(()=>{
  'use strict';

  if(!('serviceWorker' in navigator)) return;

  // 站点根推导：/c/<slug>/ 下的 ./sw.js 会误解析到 /c/ 内，必须指回站点根；
  // 独立域名根部署（base 为空）时保持 ./ 行为不变。
  const base=location.pathname.replace(/\/c\/[a-z0-9][a-z0-9-]*\/?$/,'').replace(/\/$/,'');
  const swUrl=base?`${base}/sw.js`:'./sw.js';

  window.addEventListener('load',()=>{
    navigator.serviceWorker.register(swUrl).catch(error=>{
      console.warn('PWA service worker registration failed',error);
    });
  });
})();
