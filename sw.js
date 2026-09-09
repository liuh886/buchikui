// PWA 版本规则：CORE_ASSETS 增删任何一项，必须同步 bump CACHE_NAME（v9→v10…），
// 并同步更新 scripts/check-frontend-contract.mjs 中的版本断言；否则旧缓存阴影新文件。
const CACHE_NAME='buchikui-pwa-v9';
const CORE_ASSETS=[
  './',
  './index.html',
  './styles.css',
  './case-library.css',
  './rights-pulse.css',
  './feedback.css',
  './cases.js',
  './compact-cases.js',
  './mobile-plan-case.js',
  './court-case.js',
  './investment-advisor-case.js',
  './bank-wealth-case.js',
  './rental-payment-case.js',
  './appliance-repair-case.js',
  './airport-sales-case.js',
  './dating-safety-case.js',
  './thailand-travel-safety-case.js',
  './layoff-compensation-case.js',
  './alibaba-auction-case.js',
  './qingdao-travel-case.js',
  './transport-platform-case.js',
  './app.js',
  './legal-updates.js',
  './membership-config.js',
  './feedback.js',
  './pwa.js',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache=>cache.addAll(CORE_ASSETS))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function networkFirst(request,fallbackUrl=''){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request);
    if(response.ok) cache.put(request,response.clone());
    return response;
  }catch(error){
    const cached=await cache.match(request);
    if(cached) return cached;
    if(fallbackUrl){
      const fallback=await cache.match(fallbackUrl);
      if(fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request);
  if(cached) return cached;
  const response=await fetch(request);
  if(response.ok) cache.put(request,response.clone());
  return response;
}

self.addEventListener('fetch',event=>{
  const {request}=event;
  if(request.method!=='GET') return;

  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;

  if(request.mode==='navigate'){
    event.respondWith(networkFirst(request,'./index.html'));
    return;
  }

  if(request.destination==='script'||request.destination==='style'){
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});