const CACHE_PREFIX='buchikui-pwa-';
const CACHE_NAME='buchikui-pwa-v23';
// PORTRAIT_ASSETS_START
const PORTRAIT_ASSETS=["./portraits/otter.b7dc9be5e27f.webp","./portraits/otter-thumb.4c05d7735936.webp","./portraits/capybara.0b5dd52ab8a2.webp","./portraits/capybara-thumb.3c55dce197b6.webp","./portraits/raccoon.3cd672a6ff76.webp","./portraits/raccoon-thumb.4fea7c428062.webp","./portraits/fox.a3f3899c8731.webp","./portraits/fox-thumb.df6fc8815e65.webp","./portraits/bird.94b4aa4d0f2a.webp","./portraits/bird-thumb.3754341f3ede.webp","./portraits/cloud.17f24d058575.webp","./portraits/cloud-thumb.5269bf4b0c3f.webp"];
// PORTRAIT_ASSETS_END
const CORE_ASSETS=[
  './','./index.html','./styles.css','./rights-pulse.css','./survey-analysis.css','./survey-portrait.css',
  './render-cases.js','./book-order.js','./content-data.js','./survey-portrait.js','./survey-state.js','./survey-portrait-share.js','./survey-ui.js','./cases-data.js','./app.js','./legal-updates.js','./pwa.js','./manifest.webmanifest',
  './icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/og-cover.png'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll([...CORE_ASSETS,...PORTRAIT_ASSETS])).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
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
    if(fallbackUrl){const fallback=await cache.match(fallbackUrl);if(fallback) return fallback;}
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
async function versionedAsset(request,asset){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(new URL(asset,self.location.href).href);
  // Core files change together only after a complete SW install. Never write a
  // successful individual network update into the active version's bundle.
  return cached||fetch(request);
}
self.addEventListener('fetch',event=>{
  const {request}=event;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;
  if(url.pathname.includes('/api/')) return;
  const asset=[...CORE_ASSETS,...PORTRAIT_ASSETS].find(asset=>new URL(asset,self.location.href).pathname===url.pathname);
  if(asset){event.respondWith(versionedAsset(request,asset));return;}
  if(request.mode==='navigate'){event.respondWith(networkFirst(request,'./index.html'));return;}
  if(request.destination==='script'||request.destination==='style'){event.respondWith(networkFirst(request));return;}
  event.respondWith(cacheFirst(request));
});
