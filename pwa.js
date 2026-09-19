(()=>{
  'use strict';

  if(!('serviceWorker' in navigator)) return;

  // 站点根推导：以本脚本自身的 URL 为准，兼容 /c/<slug>/ 与任意 404 路径；
  // 独立域名根部署时 new URL('.') 为 '/'，行为不变。
  const script=document.currentScript;
  let base='./';
  if(script&&script.src){
    try{ base=new URL('.',script.src).pathname||'./'; }catch(error){ base='./'; }
  }

  window.addEventListener('load',()=>{
    navigator.serviceWorker.register(`${base}sw.js`).catch(error=>{
      console.warn('PWA service worker registration failed',error);
    });
  });
})();
