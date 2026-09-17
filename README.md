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

来源优先级和更新纪律见：

- `docs/legal-freshness-standard.md`
- `docs/case-content-standard.md`

产品和视觉规范：

- `docs/product-experience-spec.md`
- `docs/design-system.md`

## 本地校验

```bash
node --check app.js
node --check legal-updates.js
node scripts/check-frontend-contract.mjs
```

部署由 `.github/workflows/deploy-pages.yml` 完成，并在发布阶段为每个 CASE 生成 `/c/<slug>/index.html`。
