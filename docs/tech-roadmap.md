# 不吃亏 — 技术路线

> 版本：v2.0 | 更新日期：2026-08-14
> 技术选型原则：简单、可持续、易部署、低成本。

---

## 一、技术选型总览

| 层级 | 技术 | 版本 | 理由 |
|-----|------|------|------|
| **框架** | Astro | ^4.x | 静态站生成、内容驱动、SEO 友好、支持组件化 |
| **样式** | Tailwind CSS | ^3.x | 快速开发、设计系统一致、无需手写大量 CSS |
| **交互** | Alpine.js | ^3.x | 轻量、无需引入 React/Vue 等重框架 |
| **内容** | Markdown / MDX | - | 易维护、支持 Git 版本控制、非技术人员可贡献 |
| **部署** | GitHub Pages / Cloudflare Pages | - | 免费、稳定、与 GitHub 仓库无缝集成 |
| **域名** | TBD | - | 建议 `.cn` 或 `.com` |
| **分析** | Plausible / Umami | - | 隐私友好的网站分析（可选） |

### 为什么选 Astro？

1. **内容驱动**：Astro 天生适合内容型网站，Markdown/MDX 是一等公民
2. **性能优秀**：默认输出静态 HTML，无需客户端 JS 也能正常工作
3. **渐进增强**：需要交互的地方可以用「岛屿」（Islands）架构局部引入 JS
4. **SEO 友好**：服务端渲染 + 静态生成，搜索引擎可完整抓取
5. **学习曲线低**：类似 HTML 的组件语法，上手快
6. **生态成熟**：丰富的集成（Tailwind、MDX、Sitemap 等）

### 为什么不用 Next.js / Nuxt？

- 不需要服务端渲染（SSR）或 API 路由
- 不需要复杂的客户端状态管理
- 静态站生成（SSG）已足够，且部署更简单
- 构建速度更快，维护成本更低

### 为什么选 Tailwind CSS？

1. **快速开发**：实用优先的 CSS 框架，无需手写大量 CSS
2. **设计系统一致**：通过配置文件统一颜色、字体、间距
3. **响应式简单**：内置响应式工具类
4. **体积小**：生产环境自动 purge 未使用的样式

---

## 二、项目结构

```
buchikui/
├── astro.config.mjs          # Astro 配置
├── tailwind.config.mjs       # Tailwind 配置
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
│
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions 部署配置
│
├── public/                   # 静态资源
│   ├── favicon.svg
│   ├── fonts/
│   │   ├── NotoSansSC-Regular.woff2
│   │   └── Inter-Regular.woff2
│   ├── images/
│   │   ├── og-image.png          # 社交分享图片
│   │   └── logo.svg
│   └── robots.txt
│
├── src/
│   ├── layouts/
│   │   ├── BaseLayout.astro      # 基础布局（导航 + 页脚）
│   │   └── TopicLayout.astro     # 专题页布局（含目录、上一篇/下一篇）
│   │
│   ├── components/
│   │   ├── Navbar.astro          # 顶部导航（含案例下拉菜单）
│   │   ├── Footer.astro          # 页脚（含免责声明）
│   │   ├── PrincipleSlide.astro  # 首页单屏原则组件
│   │   ├── ProgressIndicator.astro # 首页进度指示器
│   │   ├── ChecklistItem.astro   # 检查清单项
│   │   ├── TemplateCard.astro    # 话术模板卡片
│   │   ├── CaseCard.astro        # 案例卡片
│   │   ├── FeedbackForm.astro    # 用户反馈表单
│   │   └── SEO.astro             # SEO meta 标签组件
│   │
│   ├── pages/
│   │   ├── index.astro           # 首页（十条原则 PPT）
│   │   ├── about.astro           # 关于页
│   │   ├── tools/
│   │   │   ├── index.astro       # 工具首页
│   │   │   ├── path-planner.astro    # 维权路径规划器
│   │   │   ├── template-generator.astro # 话术生成器
│   │   │   └── checklist.astro   # 证据清单生成器
│   │   └── cases/
│   │       └── [...slug].astro   # 专题页（动态路由）
│   │
│   ├── content/
│   │   ├── config.ts             # Astro Content Collections 配置
│   │   └── cases/                # 专题内容（Markdown）
│   │       ├── car-rental.md     # 租车维权专题
│   │       ├── gym.md            # 健身房维权专题
│   │       ├── education.md      # 教育培训维权专题
│   │       └── ...               # 其他专题
│   │
│   ├── data/
│   │   ├── principles.ts         # 十条原则数据
│   │   ├── categories.ts         # 案例分类数据
│   │   └── templates.ts          # 话术模板数据
│   │
│   ├── styles/
│   │   └── global.css            # 全局样式（Tailwind 导入 + 自定义样式）
│   │
│   └── utils/
│       ├── helpers.ts            # 工具函数
│       └── seo.ts                # SEO 相关函数
│
├── docs/                       # 项目文档
│   ├── product-concept.md        # 产品构想
│   ├── tech-roadmap.md           # 技术路线（本文档）
│   ├── content-plan.md           # 内容规划
│   ├── design-system.md          # 设计规范
│   ├── operations.md             # 运营策略
│   └── roadmap.md                # 里程碑计划
│
└── scripts/                    # 构建脚本
    └── generate-og-images.js     # 生成社交分享图片（可选）
```

---

## 三、核心功能实现方案

### 3.1 首页：十条原则 HTML PPT

**技术方案**：

- 使用 CSS `scroll-snap` 实现整屏滚动
- 每屏是一个 `section` 元素，高度 `100vh`
- 使用 Intersection Observer API 检测当前屏，更新导航指示器
- 支持键盘方向键翻页
- URL 锚点定位：`#principle-1` 到 `#principle-10`
- 支持触摸滑动（移动端）

**数据定义**：

```typescript
// src/data/principles.ts
export interface Principle {
  number: number;
  title: string;
  subtitle: string;
  traps: string[];
  actions: string[];
  caseLink: string;
  caseText: string;
  color: string;
}

export const principles: Principle[] = [
  {
    number: 1,
    title: '先看规则，再付钱',
    subtitle: '所有口头承诺，都要落到文字里',
    traps: [
      '销售口头承诺「随时可退」',
      '合同里写着「概不退款」',
      '付款后才发现有隐藏条款',
    ],
    actions: [
      '付款前看清合同条款',
      '重要承诺要求书面确认',
      '截图保存宣传页面',
    ],
    caseLink: '/cases/general',
    caseText: '查看通用维权指南',
    color: 'from-purple-600 to-indigo-700',
  },
  {
    number: 2,
    title: '低价有条件，就不叫低价',
    subtitle: '把「起步价」换算成「最终总价」',
    traps: [
      '广告价只是「起步价」',
      '隐藏费用（服务费、保险费、手续费）',
      '「到店另议」的价格陷阱',
    ],
    actions: [
      '要求商家列明所有费用明细',
      '计算最终总价再比较',
      '警惕「低价引流」套路',
    ],
    caseLink: '/cases/general',
    caseText: '查看价格陷阱案例',
    color: 'from-indigo-600 to-blue-700',
  },
  // ... 其他 8 条
];
```

**首页组件**：

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import PrincipleSlide from '../components/PrincipleSlide.astro';
import ProgressIndicator from '../components/ProgressIndicator.astro';
import { principles } from '../data/principles';
---

<BaseLayout title="不吃亏 - 消费前多看一眼，消费后少走弯路">
  <main class="snap-container">
    {principles.map((p) => (
      <section
        id={`principle-${p.number}`}
        class={`snap-section min-h-screen flex items-center justify-center bg-gradient-to-br ${p.color}`}
      >
        <PrincipleSlide {...p} />
      </section>
    ))}
  </main>

  <ProgressIndicator total={principles.length} />
</BaseLayout>

<style>
  .snap-container {
    scroll-snap-type: y mandatory;
    overflow-y: scroll;
    height: 100vh;
  }

  .snap-section {
    scroll-snap-align: start;
  }

  /* 隐藏滚动条但保留功能 */
  .snap-container::-webkit-scrollbar {
    display: none;
  }

  .snap-container {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
</style>

<script>
  // 键盘导航
  document.addEventListener('keydown', (e) => {
    const sections = document.querySelectorAll('.snap-section');
    const current = Array.from(sections).findIndex((s) => {
      const rect = s.getBoundingClientRect();
      return rect.top >= 0 && rect.top < window.innerHeight;
    });

    if (e.key === 'ArrowDown' && current < sections.length - 1) {
      sections[current + 1].scrollIntoView({ behavior: 'smooth' });
    } else if (e.key === 'ArrowUp' && current > 0) {
      sections[current - 1].scrollIntoView({ behavior: 'smooth' });
    }
  });

  // 更新 URL hash
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          history.replaceState(null, '', `#${id}`);
        }
      });
    },
    { threshold: 0.5 }
  );

  document.querySelectorAll('.snap-section').forEach((s) => observer.observe(s));
</script>
```

**PrincipleSlide 组件**：

```astro
---
// src/components/PrincipleSlide.astro
interface Props {
  number: number;
  title: string;
  subtitle: string;
  traps: string[];
  actions: string[];
  caseLink: string;
  caseText: string;
}

const { number, title, subtitle, traps, actions, caseLink, caseText } = Astro.props;
---

<div class="max-w-4xl mx-auto text-white px-6 md:px-8 py-16">
  <!-- 进度指示 -->
  <div class="text-sm md:text-base opacity-70 mb-6 font-mono">
    {String(number).padStart(2, '0')} / 10
  </div>

  <!-- 标题 -->
  <h1 class="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
    {title}
  </h1>

  <!-- 副标题 -->
  <p class="text-xl md:text-2xl lg:text-3xl opacity-90 mb-12 md:mb-16">
    {subtitle}
  </p>

  <!-- 内容区 -->
  <div class="grid md:grid-cols-2 gap-8 md:gap-12 mb-12">
    <!-- 常见套路 -->
    <div>
      <h3 class="text-sm md:text-base uppercase tracking-wider opacity-70 mb-4 flex items-center">
        <span class="mr-2">⚠️</span> 常见套路
      </h3>
      <ul class="space-y-3">
        {traps.map((t) => (
          <li class="flex items-start text-base md:text-lg">
            <span class="mr-3 mt-1 opacity-70">·</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>

    <!-- 行动要点 -->
    <div>
      <h3 class="text-sm md:text-base uppercase tracking-wider opacity-70 mb-4 flex items-center">
        <span class="mr-2">✓</span> 行动要点
      </h3>
      <ul class="space-y-3">
        {actions.map((a) => (
          <li class="flex items-start text-base md:text-lg">
            <span class="mr-3 mt-1 opacity-70">·</span>
            <span>{a}</span>
          </li>
        ))}
      </ul>
    </div>
  </div>

  <!-- 查看专题链接 -->
  <a
    href={caseLink}
    class="inline-flex items-center text-base md:text-lg underline opacity-80 hover:opacity-100 transition-opacity"
  >
    {caseText}
    <svg class="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  </a>
</div>
```

### 3.2 导航栏：案例下拉菜单

**技术方案**：

- 使用纯 CSS hover 实现下拉（无需 JS）
- 移动端使用汉堡菜单 + 手风琴展开
- 菜单项从配置文件读取，方便新增专题
- 支持键盘导航（Tab + Enter）

**数据定义**：

```typescript
// src/data/categories.ts
export interface CaseCategory {
  name: string;
  slug: string;
  cases: CaseItem[];
}

export interface CaseItem {
  name: string;
  slug: string;
  description: string;
}

export const categories: CaseCategory[] = [
  {
    name: '交通出行',
    slug: 'transportation',
    cases: [
      {
        name: '如何租车维权',
        slug: 'car-rental',
        description: '租车押金被扣？还车时被索赔？',
      },
      {
        name: '如何网约车维权',
        slug: 'ride-hailing',
        description: '网约车纠纷、费用争议？',
      },
    ],
  },
  {
    name: '预付消费',
    slug: 'prepaid',
    cases: [
      {
        name: '如何健身房维权',
        slug: 'gym',
        description: '健身房跑路、退费难？',
      },
      {
        name: '如何美发店维权',
        slug: 'hair-salon',
        description: '预付卡退费、服务质量问题？',
      },
      {
        name: '如何教育培训维权',
        slug: 'education',
        description: '培训退费、虚假宣传？',
      },
    ],
  },
  // ... 其他分类
];
```

**Navbar 组件**：

```astro
---
// src/components/Navbar.astro
import { categories } from '../data/categories';
---

<nav class="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <!-- Logo -->
      <a href="/" class="flex items-center space-x-2">
        <span class="text-2xl font-bold text-purple-700">不吃亏</span>
      </a>

      <!-- 桌面端导航 -->
      <ul class="hidden md:flex items-center space-x-8">
        <!-- 案例下拉菜单 -->
        <li class="relative group">
          <button
            class="text-gray-700 hover:text-purple-700 font-medium transition-colors flex items-center"
            aria-haspopup="true"
          >
            案例
            <svg class="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- 下拉菜单 -->
          <div class="absolute left-0 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <div class="bg-white shadow-lg rounded-lg py-4 min-w-[600px] border border-gray-200">
              <div class="grid grid-cols-2 gap-6 px-6">
                {categories.map((cat) => (
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 mb-3">{cat.name}</h3>
                    <ul class="space-y-2">
                      {cat.cases.map((c) => (
                        <li>
                          <a
                            href={`/cases/${c.slug}`}
                            class="block text-sm text-gray-700 hover:text-purple-700 hover:bg-purple-50 rounded px-2 py-1 transition-colors"
                          >
                            <div class="font-medium">{c.name}</div>
                            <div class="text-xs text-gray-500 mt-0.5">{c.description}</div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </li>

        <!-- 其他导航项 -->
        <li><a href="/tools" class="text-gray-700 hover:text-purple-700 font-medium transition-colors">工具</a></li>
        <li><a href="/about" class="text-gray-700 hover:text-purple-700 font-medium transition-colors">关于</a></li>
      </ul>

      <!-- 移动端汉堡菜单按钮 -->
      <button
        id="mobile-menu-btn"
        class="md:hidden p-2 rounded-md text-gray-700 hover:text-purple-700 hover:bg-gray-100"
        aria-label="打开菜单"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>

  <!-- 移动端菜单 -->
  <div id="mobile-menu" class="hidden md:hidden border-t border-gray-200">
    <div class="px-4 py-4 space-y-4">
      <!-- 案例分类 -->
      <div>
        <h3 class="text-sm font-semibold text-gray-900 mb-2">案例</h3>
        {categories.map((cat) => (
          <details class="mb-2">
            <summary class="text-sm text-gray-700 cursor-pointer hover:text-purple-700 py-1">
              {cat.name}
            </summary>
            <ul class="ml-4 mt-2 space-y-1">
              {cat.cases.map((c) => (
                <li>
                  <a href={`/cases/${c.slug}`} class="text-sm text-gray-600 hover:text-purple-700 block py-1">
                    {c.name}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </div>

      <!-- 其他导航项 -->
      <div class="pt-4 border-t border-gray-200 space-y-2">
        <a href="/tools" class="block text-gray-700 hover:text-purple-700 py-1">工具</a>
        <a href="/about" class="block text-gray-700 hover:text-purple-700 py-1">关于</a>
      </div>
    </div>
  </div>
</nav>

<script>
  // 移动端菜单切换
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');

  btn?.addEventListener('click', () => {
    menu?.classList.toggle('hidden');
  });
</script>
```

### 3.3 专题页：Markdown 内容管理

**技术方案**：

- 使用 Astro Content Collections 管理 Markdown 内容
- 每个专题一个 `.md` 文件，frontmatter 定义元数据
- 自动生成目录、上一篇/下一篇导航
- 支持 MDX（可在 Markdown 中嵌入组件）

**Content Collection 配置**：

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const cases = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    order: z.number(),
    updated: z.string(),
    relatedPrinciples: z.array(z.number()).optional(),
  }),
});

export const collections = { cases };
```

**专题页动态路由**：

```astro
---
// src/pages/cases/[...slug].astro
import { getCollection } from 'astro:content';
import TopicLayout from '../../layouts/TopicLayout.astro';

export async function getStaticPaths() {
  const cases = await getCollection('cases');
  return cases.map((entry) => ({
    params: { slug: entry.slug },
    props: { entry },
  }));
}

const { entry } = Astro.props;
const { Content } = await entry.render();

// 获取上一篇/下一篇
const allCases = await getCollection('cases');
const sortedCases = allCases.sort((a, b) => a.data.order - b.data.order);
const currentIndex = sortedCases.findIndex((c) => c.slug === entry.slug);
const prevCase = currentIndex > 0 ? sortedCases[currentIndex - 1] : null;
const nextCase = currentIndex < sortedCases.length - 1 ? sortedCases[currentIndex + 1] : null;
---

<TopicLayout
  title={entry.data.title}
  description={entry.data.description}
  updated={entry.data.updated}
  prevCase={prevCase}
  nextCase={nextCase}
>
  <Content />
</TopicLayout>
```

**TopicLayout 组件**：

```astro
---
// src/layouts/TopicLayout.astro
import BaseLayout from './BaseLayout.astro';

interface Props {
  title: string;
  description: string;
  updated: string;
  prevCase?: any;
  nextCase?: any;
}

const { title, description, updated, prevCase, nextCase } = Astro.props;
---

<BaseLayout title={`${title} - 不吃亏`} description={description}>
  <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <!-- 标题 -->
    <header class="mb-8">
      <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{title}</h1>
      <p class="text-xl text-gray-600 mb-4">{description}</p>
      <p class="text-sm text-gray-500">最后更新：{updated}</p>
    </header>

    <!-- 正文 -->
    <div class="prose prose-lg max-w-none">
      <slot />
    </div>

    <!-- 上一篇/下一篇导航 -->
    <nav class="mt-12 pt-8 border-t border-gray-200 flex justify-between">
      {prevCase ? (
        <a href={`/cases/${prevCase.slug}`} class="text-purple-700 hover:underline">
          ← {prevCase.data.title}
        </a>
      ) : <span />}

      {nextCase ? (
        <a href={`/cases/${nextCase.slug}`} class="text-purple-700 hover:underline">
          {nextCase.data.title} →
        </a>
      ) : <span />}
    </nav>

    <!-- 反馈表单 -->
    <div class="mt-12 pt-8 border-t border-gray-200">
      <h3 class="text-lg font-semibold mb-4">这个页面对你有帮助吗？</h3>
      <!-- 反馈表单组件 -->
    </div>
  </article>
</BaseLayout>
```

### 3.4 工具功能实现

#### 工具 1：维权路径规划器

**技术方案**：

- 纯前端实现，使用 Alpine.js 管理表单状态
- 预设决策树逻辑，根据用户选择输出推荐路径
- 结果可复制或导出为文本

**实现代码**：

```astro
---
// src/pages/tools/path-planner.astro
import BaseLayout from '../../layouts/BaseLayout.astro';
---

<BaseLayout title="维权路径规划器 - 不吃亏">
  <div class="max-w-3xl mx-auto px-4 py-12" x-data="pathPlanner()">
    <h1 class="text-3xl font-bold mb-8">维权路径规划器</h1>

    <!-- 问题 1 -->
    <div class="mb-6" x-show="step === 1">
      <label class="block text-lg font-medium mb-3">你遇到的问题类型？</label>
      <div class="space-y-2">
        <button @click="answers.type = 'refund'; step = 2" class="block w-full text-left px-4 py-3 border rounded-lg hover:bg-purple-50">
          退款/退费
        </button>
        <button @click="answers.type = 'quality'; step = 2" class="block w-full text-left px-4 py-3 border rounded-lg hover:bg-purple-50">
          质量问题
        </button>
        <button @click="answers.type = 'fraud'; step = 2" class="block w-full text-left px-4 py-3 border rounded-lg hover:bg-purple-50">
          虚假宣传
        </button>
      </div>
    </div>

    <!-- 问题 2 -->
    <div class="mb-6" x-show="step === 2">
      <label class="block text-lg font-medium mb-3">涉及金额？</label>
      <div class="space-y-2">
        <button @click="answers.amount = 'small'; generateResult()" class="block w-full text-left px-4 py-3 border rounded-lg hover:bg-purple-50">
          500 元以下
        </button>
        <button @click="answers.amount = 'medium'; generateResult()" class="block w-full text-left px-4 py-3 border rounded-lg hover:bg-purple-50">
          500 - 5000 元
        </button>
        <button @click="answers.amount = 'large'; generateResult()" class="block w-full text-left px-4 py-3 border rounded-lg hover:bg-purple-50">
          5000 元以上
        </button>
      </div>
    </div>

    <!-- 结果 -->
    <div x-show="step === 3" class="mt-8">
      <h2 class="text-2xl font-bold mb-4">推荐维权路径</h2>
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-6" x-html="result"></div>
      <button @click="reset()" class="mt-4 text-purple-700 hover:underline">重新开始</button>
    </div>
  </div>

  <script>
    function pathPlanner() {
      return {
        step: 1,
        answers: {},
        result: '',
        generateResult() {
          // 根据 answers 生成推荐路径
          this.result = this.getRecommendation();
          this.step = 3;
        },
        getRecommendation() {
          // 决策树逻辑
          if (this.answers.amount === 'small') {
            return '<p><strong>首选：</strong>平台客服投诉</p><p>金额较小，建议先通过平台客服解决。</p>';
          } else if (this.answers.amount === 'medium') {
            return '<p><strong>首选：</strong>12315 投诉</p><p>金额适中，建议通过 12315 平台投诉。</p>';
          } else {
            return '<p><strong>建议：</strong>考虑法院诉讼</p><p>金额较大，如协商无果可考虑诉讼。</p>';
          }
        },
        reset() {
          this.step = 1;
          this.answers = {};
          this.result = '';
        },
      };
    }
  </script>
</BaseLayout>
```

#### 工具 2：沟通话术生成器

**技术方案**：

- 预设话术模板，使用变量占位符
- 用户填写表单，实时替换变量生成最终文本
- 支持一键复制

**模板数据**：

```typescript
// src/data/templates.ts
export interface Template {
  id: string;
  name: string;
  fields: Field[];
  template: string;
}

export interface Field {
  name: string;
  label: string;
  type: 'text' | 'date' | 'number' | 'textarea';
  placeholder?: string;
}

export const templates: Template[] = [
  {
    id: 'deposit-refund',
    name: '押金退还沟通',
    fields: [
      { name: 'date', label: '租车日期', type: 'date' },
      { name: 'orderId', label: '订单号', type: 'text', placeholder: 'ABC123456' },
      { name: 'amount', label: '押金金额', type: 'number', placeholder: '2000' },
      { name: 'returnDate', label: '还车日期', type: 'date' },
      { name: 'deductDate', label: '扣款日期', type: 'date' },
      { name: 'deductAmount', label: '扣款金额', type: 'number', placeholder: '1500' },
    ],
    template: `本人于 {{date}} 在贵平台租车（订单号：{{orderId}}），支付押金 {{amount}} 元。本人已按约定于 {{returnDate}} 还车，还车时贵方未提出异议。

现贵方于 {{deductDate}} 扣款 {{deductAmount}} 元，但未提供扣款合同依据、验车记录、维修发票及费用明细。

请于收到本通知后 3 个工作日内提供以下材料：
1. 扣款的合同条款依据
2. 验车记录（含照片/视频）
3. 维修明细和正规发票
4. 费用计算方式

如未妥善处理，本人将向 12315 投诉并保留进一步维权的权利。`,
  },
  // ... 其他模板
];
```

---

## 四、部署方案

### 4.1 GitHub Pages（推荐起步）

**优势**：
- 免费
- 与 GitHub 仓库无缝集成
- 自动部署

**配置步骤**：

1. 仓库设置 → Pages → Source 选择 GitHub Actions

2. 添加 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

3. 访问 `https://liuh886.github.io/buchikui/`

### 4.2 Cloudflare Pages（推荐正式版）

**优势**：
- 全球 CDN 加速
- 支持自定义域名 + 免费 SSL
- 无带宽限制
- 更好的国内访问速度

**配置步骤**：

1. Cloudflare Dashboard → Pages → 连接 GitHub 仓库
2. 构建设置：
   - 构建命令：`npm run build`
   - 输出目录：`dist`
   - Node 版本：20
3. 绑定自定义域名（如 `buchikui.cn`）
4. 配置 SSL/TLS（自动）

### 4.3 域名建议

**首选**：
- `buchikui.cn`（国内访问快）
- `buchikui.com`（国际通用）

**备选**：
- `bck.cn`（短域名）
- `buchikui.org`（公益性质）

---

## 五、开发路线图

### Phase 1：MVP（Week 1-2）

**目标**：首页十条原则 HTML PPT + 1 个租车维权专题

**任务清单**：

- [ ] 初始化 Astro + Tailwind 项目
- [ ] 配置 Tailwind 设计系统（颜色、字体、间距）
- [ ] 实现 BaseLayout（导航 + 页脚）
- [ ] 实现 Navbar 案例下拉菜单
- [ ] 实现首页十条原则 PPT（含滚动交互）
- [ ] 实现 ProgressIndicator 组件
- [ ] 编写租车维权专题内容（Markdown）
- [ ] 实现 TopicLayout 和专题页动态路由
- [ ] 配置 GitHub Pages 部署
- [ ] 基础 SEO 配置（title、description、OG tags）
- [ ] 添加 favicon 和 og-image

**验收标准**：

- 首页十条原则可正常滚动浏览
- 导航栏案例下拉菜单正常工作
- 租车维权专题页可正常访问
- 网站可通过 GitHub Pages 访问
- Lighthouse 性能分数 > 90

### Phase 2：V1.0（Week 3-4）

**目标**：3 个核心专题 + 完整导航

**任务清单**：

- [ ] 编写健身房维权专题
- [ ] 编写教育培训维权专题
- [ ] 优化移动端导航体验
- [ ] 添加页面加载动画
- [ ] 实现基础搜索功能（可选）
- [ ] 配置自定义域名
- [ ] 添加 Google Analytics 或 Plausible
- [ ] 优化 SEO（结构化数据、sitemap）

**验收标准**：

- 3 个核心专题全部上线
- 移动端体验良好
- 自定义域名可访问
- SEO 基础优化完成

### Phase 3：V1.5（Week 5-8）

**目标**：工具栏目上线

**任务清单**：

- [ ] 实现维权路径规划器
- [ ] 实现沟通话术生成器
- [ ] 实现证据清单生成器
- [ ] 添加用户反馈表单
- [ ] 实现文书模板库
- [ ] 优化工具页面 SEO

**验收标准**：

- 3 个工具全部上线并可正常使用
- 用户反馈表单可正常提交
- 工具页面有良好的用户体验

### Phase 4：V2.0（Week 9-12）

**目标**：10 个专题覆盖 + 社区运营

**任务清单**：

- [ ] 编写剩余专题（美发、电商、旅行、医美等）
- [ ] SEO 深度优化（结构化数据、sitemap）
- [ ] 开放内容贡献指南（CONTRIBUTING.md）
- [ ] 建立内容审核流程
- [ ] 实现相关专题推荐
- [ ] 添加专题目录导航
- [ ] 优化页面性能（图片懒加载、代码分割）

**验收标准**：

- 10 个专题全部上线
- SEO 优化完成，搜索引擎可正常收录
- 社区贡献流程建立

---

## 六、技术依赖

### 6.1 核心依赖

```json
{
  "dependencies": {
    "astro": "^4.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "@astrojs/mdx": "^2.0.0",
    "@astrojs/sitemap": "^3.0.0",
    "tailwindcss": "^3.4.0",
    "alpinejs": "^3.13.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "prettier": "^3.0.0",
    "prettier-plugin-astro": "^0.12.0",
    "typescript": "^5.3.0"
  }
}
```

### 6.2 Astro 配置

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://buchikui.cn', // 或 GitHub Pages URL
  integrations: [
    tailwind(),
    mdx(),
    sitemap(),
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
```

### 6.3 Tailwind 配置

```javascript
// tailwind.config.mjs
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
      },
      fontFamily: {
        sans: ['Noto Sans SC', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
```

---

## 七、性能优化

### 7.1 图片优化

- 使用 Astro 的 `<Image />` 组件自动优化图片
- 使用 WebP 格式
- 实现图片懒加载
- 使用适当的图片尺寸（响应式图片）

### 7.2 代码分割

- Astro 默认支持组件级代码分割
- 使用动态导入加载非关键组件
- 最小化客户端 JavaScript

### 7.3 缓存策略

- 静态资源设置长期缓存（1 年）
- HTML 文件设置短期缓存（1 小时）
- 使用 CDN 缓存

### 7.4 SEO 优化

- 每个页面设置唯一的 title 和 description
- 使用结构化数据（Schema.org）
- 生成 sitemap.xml
- 添加 robots.txt
- 优化页面加载速度（Core Web Vitals）

---

## 八、测试策略

### 8.1 手动测试

- 跨浏览器测试（Chrome、Firefox、Safari、Edge）
- 响应式测试（手机、平板、桌面）
- 无障碍测试（键盘导航、屏幕阅读器）

### 8.2 自动化测试（可选）

- 使用 Playwright 进行端到端测试
- 使用 Lighthouse CI 进行性能测试

---

## 九、内容贡献指南（预告）

后续会添加 `CONTRIBUTING.md`，包括：

- 如何提交新专题建议（GitHub Issues）
- 专题内容模板和写作规范
- 案例匿名化处理要求
- 内容审核流程
- 代码贡献指南

---

## 十、风险与应对

| 风险 | 影响 | 应对 |
|-----|------|------|
| 内容涉及法律建议边界 | 可能被误解为法律服务 | 页面显著位置声明「仅供参考，不构成法律意见」 |
| 案例涉及具体商家 | 可能引发名誉权纠纷 | 所有案例必须匿名化，不出现商家名称 |
| 用户期望过高 | 认为网站能「保证维权成功」 | 明确说明「维权结果取决于具体事实和证据」 |
| 内容过时 | 法规更新导致建议失效 | 每个专题标注更新日期，定期审核 |
| 技术栈过时 | Astro/Tailwind 版本更新 | 定期更新依赖，关注官方文档 |
| 部署平台限制 | GitHub Pages 功能限制 | 准备 Cloudflare Pages 作为备选方案 |

---

*本文档版本：v2.0 | 更新日期：2026-08-14*
