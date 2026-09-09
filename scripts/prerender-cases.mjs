#!/usr/bin/env node
// 预渲染：一 CASE 一静态页（<outDir>/c/<slug>/index.html），解决单页多 CASE 共用同一 URL 导致搜索引擎不可发现的问题。
// 策略：克隆 index.html，按 CASE 改写 head（title/description/og/canonical），本地资源引用改写为 ../ 相对路径（不硬编码部署子路径）。
// ?case= 继续兼容（老分享链接与回退）；/c/<slug>/ 为规范地址（canonical + 分享 + sitemap 均指向它）。
// 运行：node scripts/prerender-cases.mjs <outDir>（部署流在 rsync 之后、analytics 注入之前执行，仓库本身不提交生成物）。

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE = 'https://liuh886.github.io/buchikui';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const DATA_FILES = [
  'cases.js',
  'compact-cases.js',
  'mobile-plan-case.js',
  'court-case.js',
  'investment-advisor-case.js',
  'bank-wealth-case.js',
  'rental-payment-case.js',
  'appliance-repair-case.js',
  'airport-sales-case.js',
  'dating-safety-case.js',
  'thailand-travel-safety-case.js',
  'alibaba-auction-case.js',
  'layoff-compensation-case.js',
  'qingdao-travel-case.js',
  'transport-platform-case.js',
];

export async function loadCases() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of DATA_FILES) {
    const code = await readFile(path.join(root, file), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }
  return sandbox.window.BUCHIKUI_CASES;
}

const escAttr = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/"/g, '&quot;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

export async function prerender(outDir) {
  const cases = await loadCases();
  const shell = await readFile(path.join(root, 'index.html'), 'utf8');
  const outputs = [];
  for (const c of cases) {
    const canonical = `${SITE}/c/${c.slug}/`;
    const page = shell
      .replace(/<title>.*?<\/title>/, `<title>${escAttr(c.meta.title)}</title>`)
      .replace(/(<meta name="description" content=")[^"]*(")/, `$1${escAttr(c.meta.description)}$2`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${escAttr(c.meta.ogTitle)}$2`)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${escAttr(c.meta.ogDescription)}$2`)
      .replace(
        /(<meta property="og:locale" content="zh_CN">)/,
        `$1\n  <link rel="canonical" href="${canonical}">\n  <meta property="og:url" content="${canonical}">`,
      )
      // 本地资源改写为 ../（外部 https、页内 # 锚点不动；品牌首页链接 ./ 因此回到站点根）
      .replace(/((?:src|href)=")(?!https?:|#|\/)([^"]+)"/g, '$1../$2"')
      .replace(/"(\.\.\/)+\.?\/"/g, '"../"');
    const dir = path.join(outDir, 'c', c.slug);
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, 'index.html');
    await writeFile(file, page, 'utf8');
    outputs.push({ slug: c.slug, file });
  }
  return outputs;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const outArg = process.argv[2];
  if (!outArg) throw new Error('Usage: node scripts/prerender-cases.mjs <output-directory>');
  const outputs = await prerender(path.resolve(outArg));
  console.log(`Prerendered ${outputs.length} case pages into ${path.resolve(outArg)}/c/`);
}
