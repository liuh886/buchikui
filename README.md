# 不吃亏 / Buchikui

> 从真实规则和裁判里，找到消费时最容易忽略的那件事。

**不吃亏**是一个消费普法平台。内容从裁判文书、法律法规、司法解释、部门规章、管理办法、监管文件、典型案例等公开材料出发，把难读的制度信息翻译成现实交易提醒。

它不是 AI 纠纷诊断工具，也不是法律百科。

## 产品结构

首页 `/` 是一张情景判断卡：先做一个具体选择，再看正解与权威依据。`rental` 等主题仍以可搜索的资料库形式存在，从导航进入。

每个主题使用唯一规范地址：

```text
/c/<slug>/
```

CASE 默认阅读顺序：

```text
现实问题
→ 权威依据 / 裁判参考
→ 现实交易提醒
→ 必要时的证据与处理路径
→ 原文来源
```

## 内容权威

三层，单向：语料层（`corpus/`）存事实 → 编辑层（`legal-updates.js` + 各 CASE 文件）存翻译 → 呈现层由构建生成。
法源、判例与办事入口的登记、版本关系和核验状态只在 `corpus/` 维护一次。

完整文档索引见 `docs/README.md`。来源优先级和更新纪律见：

- `docs/corpus-standard.md`（语料层）
- `docs/legal-freshness-standard.md`
- `docs/case-content-standard.md`

产品和视觉规范：

- `docs/product-experience-spec.md`
- `docs/design-system.md`

结构设计与 CASE 目录：

- `docs/information-architecture.md`
- `docs/content-index.md`（生成文件，勿手改）

描述已废弃 Astro + 工具产品方向的旧文档已移入 `docs/archive/`，不再作为规范。

## 本地校验

```bash
npm run build     # 重建三个生成物：legal-updates.js / cases-data.js / docs/content-index.md
npm run test      # 纯逻辑行为测试（node --test，零依赖）
npm run check     # 语料层 + 前端契约门禁
npm run verify    # build && test && check，改完提交前跑这个
npm run site      # 生成 _site 并起本地预览
```

单项目标：

```bash
npm run build:authority      # 改 corpus/ 或 editorial/rules.js 后
npm run build:cases          # 改 editorial/cases/ 后
npm run check:corpus         # 语料层门禁（加 --orphans 看零引用记录）
npm run check:links          # 链接体检（加 --only=<id 子串> 缩小范围）
npm run check:frontend       # 主门禁
```

三层是单向的：`corpus/`（事实）→ `editorial/`（翻译与渲染）→ 生成物。
`legal-updates.js`、`cases-data.js`、`docs/content-index.md` 都是生成物，改源文件后必须重建；
CI 会重新生成后 `git diff --exit-code`，防漂移。

**编辑层不允许复述事实。** CASE 只写 `sources: [{ sourceId }]`，法源名称与链接一律由 `corpus/`
在渲染时解析，所以编辑层既抄不了也漂移不了。来源的显示口径（谁加书名号、谁带
`【类型】` 前缀）只有一份实现，在 `scripts/lib/corpus.mjs` 的 `sourceTitle()`，
权威层与 CASE 层共用。

`scripts/check-corpus.mjs` 管 `corpus/`：法源、判例、办事入口与术语的登记、版本关系与核验状态。
它会拒绝未登记的链接、指向已取代法源的引用，以及把社交平台当作法源。

`scripts/check-links.mjs` 每天由 `.github/workflows/corpus-link-check.yml` 跑，
只对**真正的 HTTP 报错**开 issue；连不上（境外网络 / TLS 限制）只统计。

`scripts/check-frontend-contract.mjs` 是主门禁：它校验前端契约、退役 UI 黑名单、体积预算、
生成物防漂移、依据来源可打开性、`ruleId` 是否指向真实依据，并调用
`scripts/lib/case-schema.mjs` 校验 CASE 编辑层结构。语料层的枚举与筛选维度映射
（`scripts/facets.mjs`）必须一一对应，漏映射会直接让门禁失败。

模板结构在 `render-cases.js`，浏览器渲染与预渲染共用；首页只加载打包后的 `cases-data.js` 和 `render-cases.js`，`legal-updates.js` 只在 CASE 页加载。

发布产物走 `scripts/prepare-site.mjs`：显式白名单（`scripts/lib/site-manifest.mjs`）只发站点真正
需要的文件，`corpus/`、`editorial/`、`docs/` 这些内部源目录不会作为静态文件公开。本地预览
（`scripts/serve.mjs`）与 GitHub Pages 部署共用这个入口，避免「本地能过、线上缺文件」。

部署由 `.github/workflows/deploy-pages.yml` 完成，发布阶段生成每个 CASE 的静态页 `/c/<slug>/index.html`、`404.html` 和 `sitemap.xml`。
