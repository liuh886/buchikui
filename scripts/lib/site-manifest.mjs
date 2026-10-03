// 发布产物清单：站点真正需要什么，就只发什么。
//
// 之前部署用 rsync 排除法把整个仓库搬进 _site，结果 corpus/、editorial/、docs/、
// supabase/ 这些内部源目录也作为静态文件被公开，且产物随仓库结构漂移。
// 改成显式白名单后，预览与生产走同一条路径，产物也不再随目录结构变化。
export const SITE_FILES = [
  'index.html',
  'app.js',
  'render-cases.js',
  'rights-pulse.css',
  'styles.css',
  'pwa.js',
  'sw.js',
  'case-facets.js',
  'manifest.webmanifest',
  'robots.txt'
];

// 这些由 npm run build 生成，不从仓库复制，但必须随产物一起发布——
// index.html 直接引用 cases-data.js，缺了首页就是空壳。
export const GENERATED_FILES = ['cases-data.js', 'legal-updates.js'];

// 整目录拷入的静态资源。
export const SITE_DIRS = ['icons'];

/** 这些绝不该出现在发布产物里；作为 prepare-site 的自检。 */
export const FORBIDDEN_IN_ARTIFACT = ['corpus', 'editorial', 'docs', 'scripts', 'tasks', 'supabase', '.github', 'node_modules', 'package.json'];
