# Buchikui 文档索引

> 更新：2026-09-22  
> 本文件是 `docs/` 的**唯一文档索引**。改内容前先在这里确认哪份文档是现行规范。

## 现行规范（Normative）

产品与内容权威，按以下顺序阅读：

| 文档 | 作用 |
| --- | --- |
| `product-experience-spec.md` | 产品定义、首页与 CASE 结构、视觉与移动端底线 |
| `case-content-standard.md` | 单个 CASE 的写作结构、来源纪律、删除规则、语气 |
| `legal-freshness-standard.md` | 权威材料层（`legal-updates.js`）的准入、来源权重与更新纪律 |
| `design-system.md` | 设计令牌、字号、组件、响应式与生成物 |
| `consumer-feedback.md` | 段落级消费者反馈闭环与数据合同 |
| `agent-feedback-workflow.md` | Agent 从在线反馈到 canonical 内容的处理流程 |

## 设计文档（Design）

| 文档 | 作用 |
| --- | --- |
| `information-architecture.md` | 结构设计：可读目录、文档清理，以及多维筛选（A）、主题互链（B）、术语表（C）、置信标记（D）的规格 |
| `content-index.md` | 全部 CASE 的编辑可读目录 |

设计文档描述**如何组织信息**，不覆盖上述产品与内容规范。

## 归档（Archived）

`archive/` 内的文档描述的是已废弃的 Astro + 紫色 PPT + 工具产品方向，
**不再作为规范**，仅保留作历史参考：

- `archive/product-concept.md`
- `archive/content-plan.md`
- `archive/tech-roadmap.md`
- `archive/roadmap.md`
- `archive/operations.md`

规则：新文档、`README.md`、`AGENTS.md` 一律引用现行文档，不引用归档文档。

## 仓库其他权威位置

- `AGENTS.md`：Agent 行为总纲与产品权威顺序；
- `README.md`：仓库与本地校验入口；
- `scripts/check-frontend-contract.mjs`：前端契约与生成物防漂移。
