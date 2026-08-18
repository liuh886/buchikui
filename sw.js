const CACHE_NAME='buchikui-pwa-v2';
const CORE_ASSETS=[
  './',
  './index.html',
  './styles.css',
  './case-visual.css',
  './account-integration.css',
  './feedback.css',
  './pwa.css',
  './library.css',
  './cases.js',
  './compact-cases.js',
  './mobile-plan-case.js',
  './court-case.js',
  './investment-advisor-case.js',
  './bank-wealth-case.js',
  './app.js',
  './library.js',
  './case-visual.js',
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
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE_ASSETS)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE_NAME).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING') self.skipWaiting();
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