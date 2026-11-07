> 当前本地版本为消费经历问卷与可爱经历角色：YES有过、NO没有过直接继续。已实现六角色与两则案例回报，真实设备、读屏和受访者偏好待验收，未发布。

# Buchikui Design System

> 更新：2026-10-24

## 方向

Buchikui 是**消费经历调研问卷**。单张主牌承载实际经历提问与YES/NO记录；书式资料库承接查证，沿用可信的出版物视觉语言。

结果页以六种统一圆润角色插画、名称和可核对理由开头，再给两则案例回报；真实记录和聚合折叠在后。角色同等精致，不使用正误样式、得分、能力等级或人格诊断。已交付正式AI插画，不把资源存在当作用户认为可爱的证明；需求见[消费者画像PRD](consumer-portrait-prd.md)。

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

- 情境行动（首页 h1）：手机31px、桌面43px；统一开头使用较小字号；
- 情境事实：手机 20px、桌面 26px；较矮桌面降为 20px，保证判断按钮可达；
- 资料库标题：手机 36px、桌面 44px；
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
- Survey card（唯一主牌，含遭遇问句、等权选择与可选案例入口）；
- Portrait result（角色、依据、两则短读、折叠记录）；
- Portrait share preview（用户主动生成的角色卡预览）；
- Book directory（五卷十八章，搜索与折叠筛选）；
- Search；
- Topic row；
- Authority block（权威依据 / 裁判参考）；
- Reminder row；
- Evidence list；
- Route list；
- Source list；
- Footer。

避免新增 Dashboard、徽章墙、游戏进度条、奖励Toast、固定底栏双CTA；轻量题号仅说明整卷工作量。案例解析和角色卡预览使用原生dialog，不层叠复杂弹窗。

## 卡片原则

不为每一条信息做卡片。能用排版和分隔线表达，就不用容器。

问卷入口使用一张可拖动主牌与克制的牌边；资料库仍以排版和分隔线组织。圆形NO/YES等色等权，附清楚的没有过/有过标签；深红仅用于强调与焦点，不表示正解。按钮使用系统无衬线，不重复长句题面。

拖动时浮章显示有过/没有过，向右YES、向左NO，松手才提交，短拖可取消。题面完整描述实际遭遇，不用“你会这样做吗”。读屏标签为“NO，没有过”和“YES，有过”，方向键仅在卡片聚焦时操作。

## 交互规则

- 全局 `:focus-visible` 用深红描边，鼠标点击不显示轮廓；
- 锚点跳转预留 128px，覆盖窄屏章节导航换行后的 sticky header；
- 触摸目标 ≥ 44px；
- 结果类文本变化（搜索计数、复制成功）用 `aria-live="polite"` 播报；
- 选中文本用 `--accent-soft`。

## 响应式

桌面最大正文宽度约 1120px；移动端左右边距 14px。390px 无横向溢出。双栏元信息在移动端自然变单栏。移动端关闭 header 的 `backdrop-filter` 以减少滚动合成开销。

## 动效

保留浏览器原生滚动和焦点状态。问卷卡允许跟手预览、松手提交、必要回弹及短暂离场；选择后直接继续，不加判定动画。其他页面不增加装饰动效。`prefers-reduced-motion` 下直接切换，不做3D翻面。

## 生成物

改动源文件后必须重新生成，`node scripts/check-frontend-contract.mjs` 会拦截漂移：

- `cases-data.js`：由 `scripts/bundle-cases.mjs` 拼接各 CASE 源文件；首页只加载这一个数据脚本；
- `_site/c/<slug>/` 与 `_site/404.html`：由 `scripts/prerender-cases.mjs` 生成，含静态正文、canonical、og/twitter 与 `Article` 结构化数据；
- `sitemap.xml`：由 CASE 数据生成，不再手写；
- `docs/content-index.md`：由 `scripts/build-content-index.mjs` 生成，不再手写。

模板结构由 `render-cases.js` 提供（无 DOM 依赖），浏览器与预渲染共用同一套 HTML；
预渲染的富文本走 `prerender-cases.mjs` 的 `richStatic()` 白名单序列化，与 `app.js`
的 `sanitizeRichHtml` 保持同一口径，因此静态正文与浏览器渲染一致。
`legal-updates.js`继续提供CASE权威解释，首页不以它判分。题目、角色与短读从内容库导出为`content-data.js`；状态在`survey-state.js`，计算在`survey-portrait.js`，交互在`survey-ui.js`，导出在`survey-portrait-share.js`，卷章编排在`book-order.js`。`survey-portrait.css`独立承载结果样式，发布白名单与SW均需包含它。

## 当前问卷卡片补充

标题只写单一具体场景（如酒店订房、跟团旅游），不拼接分组和阶段。统一前缀为“你是否遭遇过：”；主牌不再显示回想选择的提示句。NO／没有过与YES／有过保持等权。

## 自选案例解析（2026-10-24）

每题卡片底部右侧仅放12px“案例解析”小字，点击区域至少44px高。主动打开居中阅读面板，展示来源案例、处理结果、适用边界与解释。面板可滚动，关闭、Escape或背景点击返回当前题；关闭后焦点回入口。文字与纸张风格沿用现有设计，不自动展开。

## 可爱角色与结果（2026-10-24）

六角色统一圆润绘本质感与柔和辅色：海獭、水豚、浣熊、狐狸、团雀、小云朵。没有高低等级或罕见奖励，未报告与不足信息状态也交付完整角色。角色居中、留白均衡；文字与来源不缩小为装饰。

正式素材为六张512×512和六张128×128透明WebP，共326404字节（约318.8KiB），每全图/缩略图预算60/12KiB。素材来自内置ImageGen，提示和原始生成记录保留在editorial/portrait-assets/generation.json，仅公开审核后的哈希资源。结果使用当前角色全图，固定宽高避免跳动；失败显示角色文字与替代形状。

结果优先展示角色、描述、依据和案例回报，题项计数不作为成绩。短读首层保留结果及必要边界，原文可直接打开。未匹配案例采用中性文案，不暗示skip用户没遇到。

角色卡先预览后手动保存/系统分享；Canvas输出1080×1440 PNG，预览随屏幕缩放。不上传图片，不把实际回答或标识画入卡片。图片失败可导出明确标注的文字版；不支持分享或下载时提供打开大图与复制入口。

当前headless Edge已验证390px六角色、320px、1365px桌面、200%CSS zoom及键盘等场景；真实触摸、系统大字、VoiceOver/TalkBack与可爱偏好仍见[人工验收清单](release-acceptance.md)待执行项。
