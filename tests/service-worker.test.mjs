import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('PWA 激活只删除本项目旧缓存，保留当前缓存和同源其他应用缓存', async () => {
  const handlers = {};
  const deleted = [];
  let activeName;
  const current = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const context = vm.createContext({
    self: { addEventListener(type, handler) { handlers[type] = handler; }, clients: { async claim() {} } },
    caches: {
      async keys() { return ['buchikui-pwa-v15', 'buchikui-pwa-v17', activeName, 'hao-account-assets-v2', 'another-pwa', 'buchikui-other-data']; },
      async delete(key) { deleted.push(key); return true; },
    },
  });
  vm.runInContext(current, context);
  activeName = vm.runInContext('CACHE_NAME', context);
  assert.match(activeName, /^buchikui-pwa-v\d+$/);
  let activation;
  handlers.activate({ waitUntil(promise) { activation = promise; } });
  await activation;
  assert.deepEqual(deleted, ['buchikui-pwa-v15', 'buchikui-pwa-v17']);
});

test('本地内容接口不进入PWA缓存，避免恢复过期数据库响应',async()=>{
  const handlers={};
  const context=vm.createContext({self:{addEventListener(type,handler){handlers[type]=handler;},location:{origin:'http://localhost:4188'}},URL});
  vm.runInContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),context);
  let cached=false;
  handlers.fetch({request:{method:'GET',url:'http://localhost:4188/api/content'},respondWith(){cached=true;}});
  assert.equal(cached,false);
});

test('预缓存数据/状态/样式始终取同一发布包，部分网络更新不能污染旧缓存',async()=>{
  const handlers={},stored=new Map(),writes=[];
  const origin='https://example.test/buchikui/';
  stored.set(origin,'old:home');
  for(const name of ['content-data.js','survey-state.js','survey-portrait.css','index.html'])stored.set(origin+name,`old:${name}`);
  const context=vm.createContext({URL,self:{location:{origin:'https://example.test',href:origin+'sw.js'},addEventListener(t,h){handlers[t]=h;}},
    caches:{async open(){return {async match(key){return stored.get(key);},async put(...args){writes.push(args);}};},},
    async fetch(request){if(request.url.endsWith('survey-state.js'))throw new Error('offline');return 'new-content-schema';}
  });
  vm.runInContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),context);
  for(const name of ['content-data.js','survey-state.js','survey-portrait.css']){
    let response;handlers.fetch({request:{method:'GET',url:origin+name,destination:name.endsWith('.css')?'style':'script'},respondWith(p){response=p;}});
    assert.equal(await response,`old:${name}`);
  }
  let home;handlers.fetch({request:{method:'GET',url:origin+'?question=old',mode:'navigate'},respondWith(p){home=p;}});
  assert.equal(await home,'old:home');
  assert.equal(writes.length,0);
  assert.equal(vm.runInContext("CORE_ASSETS.includes('./survey-portrait.css')",context),true);
});

test('新发布包预缓存失败时不激活，也不宣布完成',async()=>{
  const handlers={};let skipped=false;
  const context=vm.createContext({self:{addEventListener(t,h){handlers[t]=h;},skipWaiting(){skipped=true;}},caches:{async open(){return {async addAll(){throw new Error('one asset failed');}};}}});
  vm.runInContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),context);
  let install;handlers.install({waitUntil(p){install=p;}});await assert.rejects(install,/one asset failed/);assert.equal(skipped,false);
});
