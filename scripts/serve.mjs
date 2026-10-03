#!/usr/bin/env node
// 本地预览：把预渲染产物当静态站伺服起来，供人工过一遍发布 bar 里机器查不了的三项
// （390px 横向溢出、读屏行为、链接可达性）。
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareSite } from './prepare-site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const site = path.join(root, '_site');
const port = Number(process.env.PORT || 4173);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml'
};

async function resolve(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const candidates = clean.endsWith('/')
    ? [path.join(site, clean, 'index.html')]
    : [path.join(site, clean), path.join(site, clean, 'index.html'), path.join(site, `${clean}.html`)];
  for (const file of candidates) {
    if (!file.startsWith(site)) continue;
    if (existsSync(file) && (await stat(file)).isFile()) return file;
  }
  return null;
}

// 预览必须和部署走同一个产物构建入口，否则「本地能过、线上缺文件」。
if (!existsSync(path.join(site, 'index.html'))) {
  console.log('预渲染产物不存在，正在生成…');
  const { casePages } = await prepareSite(site);
  console.log(`已生成 ${casePages} 个 CASE 页 + 静态文件 + sitemap + 404`);
}

createServer(async (req, res) => {
  const file = await resolve(req.url || '/');
  // 找不到就回落到 404 壳，但**状态码必须是 404**：软 404 会让人工做的
  // 「链接可达性」检查误判通过，而这正是发布 bar 里机器查不了的那一项。
  if (!file) {
    try {
      const body = await readFile(path.join(site, '404.html'));
      res.writeHead(404, { 'content-type': MIME['.html'], 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('not found');
    }
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found');
  }
}).listen(port, () => {
  console.log(`预览地址  http://localhost:${port}/`);
  console.log(`案例页    http://localhost:${port}/c/rental/`);
  console.log('Ctrl+C 停止。移动端检查建议用浏览器设备模拟切到 390px。');
});