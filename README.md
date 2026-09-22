# 不吃亏 / Buchikui

> 从真实规则和裁判里，找到消费时最容易忽略的那件事。

**不吃亏**是一个消费普法平台。内容从裁判文书、法律法规、司法解释、部门规章、管理办法、监管文件、典型案例等公开材料出发，把难读的制度信息翻译成现实交易提醒。

它不是 AI 纠纷诊断工具，也不是法律百科。

## 产品结构

首页 `/` 是可搜索的主题资料库。

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

`legal-updates.js` 是权威材料层的唯一数据源。CASE 数据文件负责现实场景、证据和处理路径，不重复维护另一套法规新闻列表。

完整文档索引见 `docs/README.md`。来源优先级和更新纪律见：

- `docs/legal-freshness-standard.md`
- `docs/case-content-standard.md`

产品和视觉规范：

- `docs/product-experience-spec.md`
- `docs/design-system.md`

结构设计与 CASE 目录：

- `docs/information-architecture.md`
- `docs/content-index.md`

描述已废弃 Astro + 工具产品方向的旧文档已移入 `docs/archive/`，不再作为规范。

## 本地校验

```bash
node --check app.js
node --check render-cases.js
node --check legal-updates.js
node scripts/bundle-cases.mjs        # 修改 CASE 源文件后重建 cases-data.js
node scripts/check-frontend-contract.mjs
```

模板结构在 `render-cases.js`，浏览器渲染与预渲染共用；首页只加载打包后的 `cases-data.js` 和 `render-cases.js`，`legal-updates.js` 只在 CASE 页加载。

部署由 `.github/workflows/deploy-pages.yml` 完成，发布阶段生成每个 CASE 的静态页 `/c/<slug>/index.html`、`404.html` 和 `sitemap.xml`。
