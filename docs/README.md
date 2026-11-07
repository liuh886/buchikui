# Buchikui 文档索引

> 更新：2026-10-24
> 本文件是 `docs/` 的**唯一文档索引**。改内容前先在这里确认哪份文档是现行规范。

## 现行规范（Normative）

产品与内容权威，按以下顺序阅读：

| 文档 | 作用 |
| --- | --- |
| `product-experience-spec.md` | 产品定义、首页与 CASE 结构、视觉与移动端底线 |
| `survey-standard.md` | 统一经历问法、YES/NO/跳过、回答保存、个人画像与实际答卷统计口径 |
| `case-content-standard.md` | 单个 CASE 的写作结构、来源纪律、删除规则、语气 |
| `legal-freshness-standard.md` | 权威依据层的准入、来源权重、核验日期与复核节奏 |
| `corpus-standard.md` | 语料层 `corpus/` 的记录类型、字段、枚举与版本纪律 |
| `design-system.md` | 设计令牌、字号、组件、响应式与生成物 |
| `consumer-feedback.md` | 反馈数据合同、机器人防护与 Agent 处理（Reader 入口已下线） |
| `content-database.md` | 内容数据库、案例导入、审核、公开接口与前端快照的现行流程 |
| `agent-feedback-workflow.md` | Agent 从在线反馈到 canonical 内容的处理流程 |

## 内容评审

- `../tasks/consumer-portrait/library-improvement-plan.md`：2026-10-25三库完善计划；六角色认领与传播、小批案例/题目质量门槛、依赖顺序及真人验收，执行待开始。
- `../tasks/consumer-portrait/closeout-review-2026-10-25.md`：上轮三项收尾复核通过，91项测试与独立错误配置构建验证通过；真实设备和受访者验收仍待执行。
- `consumer-portrait-prd.md`：2026-10-24用户确认的需求基线；可爱消费者经历角色、两类用户收益、结果体验、生产闭环及验收。首版已本地实现，真实用户和设备验收待执行。
- `consumer-portrait-architecture.md`：架构师对上述需求的技术评审、数据与版本合同、模块边界及落地方案。
- `consumer-portrait-question-review.md`：首轮八题覆盖与理解评审底稿，包含内容生产记录模板；不是已完成的用户测试。
- `../tasks/consumer-portrait/implementation-plan.md`：依赖有序的开发任务、交付物与验收清单。
- `../tasks/consumer-portrait/delivery.md`：首版本地开发交付、87项测试、浏览器证据、素材来源与未完成的人工验收。
- `consumer-portrait-pm-assessment.md`：2026-10-24本轮产品经理完成度验收；区分工程交付、核心价值与发布条件，附新采集截图和整改标准。
- `../tasks/consumer-portrait/iteration-2-plan.md`：第二轮产品与开发计划，包含画像校准、12项任务和四阶段门槛；工程已推进，实际通过范围以交付记录及独立复核为准，真人/真机验收待执行。
- `../tasks/consumer-portrait/iteration-2-independent-review.md`：第二轮改动的独立复核，确认短屏/首屏提醒/重审改善，并记录机制覆盖、并列推荐、配置准入和验收状态的待修问题。
- `../tasks/consumer-portrait/rectification-recheck-2026-10-25.md`：整改后的独立回查；90项测试与6561组合参考验证通过，记录原问题关闭情况、少量配置/文案边界及真实验收待办。

- `scenario-editorial-review.md`：当前六题的事实边界、原文、改编性质与旧题撤下原因。
- `scenario-candidates.md`：首轮真实争议候选及边界的研究记录；当前入库与题目状态以 `content-database.md` 为准。

## 设计文档（Design）

| 文档 | 作用 |
| --- | --- |
| `prototype-design.md` | 历史游戏原型，已被消费经历问卷取代；现行交互以产品规范和survey-standard为准 |
| `prototype-flow-review.md` | 完整静态流程评审：判断与反馈、继续与结束、邀请入口、资料库与依据返回、桌面与手势约定 |
| `information-architecture.md` | 结构设计：可读目录、文档清理，以及多维筛选（A）、主题互链（B）、术语表（C）、置信标记（D）的规格 |
| `content-index.md` | 全部 CASE 的编辑目录（**生成文件**，由 `scripts/build-content-index.mjs` 产出） |
| `release-acceptance.md` | 当前八题及历史版本的真实触摸、读屏、系统分享和用户试玩验收；待执行项目不冒称通过 |

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
- `tasks/todo.md`：当前待办与已知内容缺口；
- `design-qa.md`：首轮实际浏览器与设计对照报告，不替代发布前的真实设备与读屏检查；
- `scripts/check-frontend-contract.mjs`：前端契约与生成物防漂移。
