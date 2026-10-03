#!/usr/bin/env node
// 把发布产物准备到目标目录：白名单静态文件 + 预渲染 CASE 页 + sitemap + 404。
// 本地预览（scripts/serve.mjs）与 GitHub Pages 部署共用这一个入口，
// 避免「本地能过、线上缺文件」这类只在 CI 才暴露的问题。
import { mkdir, copyFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prerender, prerenderNotFound, buildSitemap } from './prerender-cases.mjs';
import { SITE_FILES, GENERATED_FILES, SITE_DIRS, FORBIDDEN_IN_ARTIFACT } from './lib/site-manifest.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function prepareSite(target) {
  const site = path.resolve(target);
  await mkdir(site, { recursive: true });

  for (const file of [...SITE_FILES, ...GENERATED_FILES]) {
    await copyFile(path.join(root, file), path.join(site, file));
  }
  await mkdir(path.join(site, 'icons'), { recursive: true });
  for (const dir of SITE_DIRS) {
    const from = path.join(root, dir);
    for (const name of await readdir(from)) {
      if ((await stat(path.join(from, name))).isFile()) {
        await copyFile(path.join(from, name), path.join(site, dir, name));
      }
    }
  }

  const outputs = await prerender(site);
  await prerenderNotFound(site);
  await writeFile(path.join(site, 'sitemap.xml'), await buildSitemap(), 'utf8');

  // 自检：内部源目录不得进入产物
  for (const name of FORBIDDEN_IN_ARTIFACT) {
    try {
      await stat(path.join(site, name));
      throw new Error(`发布产物里出现了内部目录：${name}`);
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }
  }

  return { site, casePages: outputs.length };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { site, casePages } = await prepareSite(process.argv[2] || path.join(root, '_site'));
  console.log(`站点产物已生成：${site}（静态文件 ${SITE_FILES.length + GENERATED_FILES.length + SITE_DIRS.length} 项，CASE 页 ${casePages} 个，sitemap + 404）`);
}
