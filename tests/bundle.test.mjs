// 首页产物的运行时护栏。
//
// 事故记录：bundle 曾经拼接 editorial/cases/*.js 的源码，而那些文件都是
// `window.BUCHIKUI_CASES.push(...)` 片段。Node 沙箱里 loadSandbox 会初始化数组，
// 浏览器里没人初始化，于是 cases-data.js 抛 TypeError，app.js 的
// Array.isArray 兜底成空数组——首页空白，而 CI 全绿：
// 结构校验、生成物防漂移、字节预算全部通过，因为它们只看文件，不执行产物。
//
// 所以这里必须**执行**产物：在一个 window 为空的沙箱里跑一遍，
// 就像浏览器首次加载那样。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
import { buildBundle, BUNDLE_FILE } from '../scripts/bundle-cases.mjs';
import { SITE } from '../scripts/prerender-cases.mjs';

async function runBundleInBareWindow(code) {
  // 刻意不给 BUCHIKUI_CASES / BUCHIKUI_FACETS 任何初始值：浏览器首次加载就是这样。
  const window = { addEventListener() {}, removeEventListener() {} };
  const sandbox = { window, console, URL, URLSearchParams };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: BUNDLE_FILE });
  return window;
}

test('产物在空 window 里执行后，CASE 数组确实被建立', async () => {
  const window = await runBundleInBareWindow(await buildBundle());
  assert.ok(Array.isArray(window.BUCHIKUI_CASES), 'BUCHIKUI_CASES 未被建立——首页会渲染成空白');
  assert.ok(window.BUCHIKUI_CASES.length >= 16, `CASE 数量异常：${window.BUCHIKUI_CASES.length}`);
});

test('筛选维度也在同一次执行里建立', async () => {
  const window = await runBundleInBareWindow(await buildBundle());
  assert.ok(window.BUCHIKUI_FACETS && typeof window.BUCHIKUI_FACETS === 'object');
  for (const item of window.BUCHIKUI_CASES) {
    assert.ok(window.BUCHIKUI_FACETS[item.slug], `${item.slug} 缺少筛选维度`);
  }
});

test('首页读到的来源已由语料层解析，不是 sourceId', async () => {
  const window = await runBundleInBareWindow(await buildBundle());
  let checked = 0;
  for (const item of window.BUCHIKUI_CASES) {
    for (const source of item.sources || []) {
      assert.ok(!source.sourceId, `${item.slug} 的首页来源仍是未解析的 sourceId：${source.sourceId}`);
      assert.ok(source.title && source.title.length, `${item.slug} 有来源没有可显示的标题`);
      assert.match(source.href, /^https?:\/\//, `${item.slug} 的来源链接不可打开：${source.href}`);
      checked++;
    }
  }
  assert.ok(checked > 100, `检查的来源过少：${checked}`);
});

test('产物里的每个 slug 都能当路径用', async () => {
  const window = await runBundleInBareWindow(await buildBundle());
  const base = new URL(SITE).pathname.replace(/\/$/, '');
  for (const item of window.BUCHIKUI_CASES) {
    assert.match(item.slug, /^[a-z0-9][a-z0-9-]*$/, `slug 不能直接当路径：${item.slug}`);
    assert.ok(`${base}/c/${item.slug}/`, `CASE 页路径不可用：${item.slug}`);
  }
});

test('仓库里的 cases-data.js 与当前源文件同步', async () => {
  const onDisk = await readFile(new URL(`../${BUNDLE_FILE}`, import.meta.url), 'utf8');
  assert.equal(onDisk, await buildBundle(), 'cases-data.js 已过期，请运行 npm run build');
});
