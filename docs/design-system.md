# Buchikui Design System

> 更新：2026-09-19

## 方向

Buchikui 的视觉目标是**可信的编辑型普法资料库**，不是 SaaS Dashboard 或 AI 工具。

## 基础

- 背景：暖白纸张色；
- 正文：接近黑色；
- 强调色：克制的深红，仅用于来源类型、关键提醒和交互焦点；
- 标题：中文衬线（宋体系），形成出版物感；
- 正文和元信息：系统无衬线；
- 分隔：细线优先于卡片边框和阴影。

## 设计令牌

`styles.css :root` 是唯一来源：

| 令牌 | 值 | 用途 |
| --- | --- | --- |
| `--paper` | `#f7f5ef` | 页面底色 |
| `--paper-strong` | `#fffdfa` | 权威依据区块底色 |
| `--paper-sunken` | `#efebe2` | 页脚底色 |
| `--ink` | `#161616` | 标题与正文 |
| `--ink-soft` | `#43413c` | 次级正文 |
| `--muted` | `#6b665d` | 元信息（在三种底色上均 ≥ 4.7:1） |
| `--line` / `--line-strong` | `#ddd8cd` / `#a9a398` | 细线与徽标描边 |
| `--accent` | `#9d201f` | 来源类型、关键提醒、焦点 |
| `--accent-soft` | `#f0e2df` | 选中文本底色 |
| `--font-serif` | Georgia → Songti SC → Source Han Serif SC → STSong → SimSun | 标题、要点句 |
| `--font-sans` | system-ui → PingFang SC → Microsoft YaHei | 正文、元信息 |
| `--max` | `1120px` | 桌面正文宽度 |

字体栈按「拉丁用 Georgia、中文逐级回退到思源宋体 / 宋体」排列，不使用 Web Font，避免额外请求与 FOUT。

## 字号阶梯

- 展示标题（首页 h1）：`clamp(44px, 6.6vw, 84px)`；
- CASE 标题：`clamp(40px, 5.6vw, 72px)`；
- 小节标题：`clamp(28px, 3.6vw, 42px)`；
- 依据标题（权威依据内的规则标题）：`clamp(21px, 2.2vw, 29px)`，必须小于小节标题；
- 要点句 / 导语：`clamp(18px, 2.1vw, 26px)`；
- 正文与长段落：15px / 行高 1.75；
- 次级与元信息：12–13px；
- 眉标（eyebrow）：11px，字距 `.14em`。

移动端整数降档，390px 下标题必须整词折行（不得把「避免」拆成「避 / 免」）。

## 组件

默认组件只有：

- Header；
- Search；
- Topic row；
- Authority block（权威依据 / 裁判参考）；
- Reminder row；
- Evidence list；
- Route list；
- Source list；
- Footer。

避免新增 Dashboard、Badge 墙、Progress、Toast 型奖励、固定底栏双 CTA、复杂弹窗。

## 卡片原则

不为每一条信息做卡片。能用排版和分隔线表达，就不用容器。

## 交互规则

- 全局 `:focus-visible` 用深红描边，鼠标点击不显示轮廓；
- 锚点跳转留出 sticky header 高度（`html{scroll-padding-top:80px}`）；
- 触摸目标 ≥ 44px；
- 结果类文本变化（搜索计数、复制成功）用 `aria-live="polite"` 播报；
- 选中文本用 `--accent-soft`。

## 响应式

桌面最大正文宽度约 1120px；移动端左右边距 14px。390px 无横向溢出。双栏元信息在移动端自然变单栏。移动端关闭 header 的 `backdrop-filter` 以减少滚动合成开销。

## 动效

只保留浏览器原生滚动和必要的焦点状态。默认不做页面切换动画、随机过渡或装饰动效。

## 生成物

前端有三处构建产物，改动源文件后必须重新生成，`node scripts/check-frontend-contract.mjs` 会拦截漂移：

- `cases-data.js`：由 `scripts/bundle-cases.mjs` 拼接各 CASE 源文件；首页只加载这一个数据脚本；
- `_site/c/<slug>/` 与 `_site/404.html`：由 `scripts/prerender-cases.mjs` 生成，含静态正文、canonical、og/twitter 与 `Article` 结构化数据；
- `sitemap.xml`：由 CASE 数据生成，不再手写。

模板结构由 `render-cases.js` 提供（无 DOM 依赖），浏览器与预渲染共用同一套 HTML；`legal-updates.js` 只在 CASE 页加载。
