# Buchikui — Information Architecture

> 状态：Design  
> 更新：2026-09-22  
> 性质：结构设计文档。定义信息架构改进，不改变产品定位。产品规范仍以
> `docs/product-experience-spec.md`、`docs/case-content-standard.md`、
> `docs/legal-freshness-standard.md`、`docs/design-system.md` 为准。

## 0. 目的

把「不吃亏」从**一组写得很好的孤立 CASE**，升级为**可检索、可互链、可维护的消费场景资料库**，
同时不改变它的定位：现实交易场景 → 权威依据 → 关键事实 → 现实提醒。

本文档参考 `https://eternity4719.github.io/HowToLiveBetter` 的信息架构优点，
只迁移「结构」，不迁移版式，也不迁移与法律无关的证据分级体系。

已落地：**A 多维筛选**、**B 主题互链**（见 §3、§4），**E 可读目录文档**、**F 文档清理**（见 §5、§6）。  
记录备查：**C 术语表**、**D 效力/置信标记**（见 §7）。

---

## 1. 参考站结构剖析

HowToLiveBetter 的「清晰」来自五个信息架构决定，而不是视觉设计。

### 1.1 单一纯文本源

- `README.md` 是目录 + 阅读说明 + 证据分级 + 术语表 + 章节清单；
- 正文是 `book/01-*.md` … `book/33-*.md`；
- `index.html` 运行时直接读取这些 Markdown。

结果：内容是人类可读、可 diff、非技术人可编辑的；网站只是内容的一个视图，
不存在第二份需要同步的数据结构。

### 1.2 统一的条目微格式

每个条目固定回答两个问题：**花掉什么，换回什么**。字段为：

`成本 / 说人话 / 收益 / 证据等级 / 来源 / 备注`

因此所有条目可扫读、可比较、可被脚本聚合。

### 1.3 两条正交的评级轴，且诚实分离

- **证据等级 A/B/C**：回答「这个数字可不可信」；
- **性价比 极高/高/一般**：回答「这件事值不值得做」，并明确声明这是作者判断、不是证据；
- 另有 `争议`、`待核实` 两个不确定标记。

即：把「可信度」和「值不值」分开，并坦白哪一档是主观的。

### 1.4 按读者处境组织与筛选

- 组织维度是「换回什么」四口径（寿命 / 时间精力 / 金钱 / 人身自由），不是学科分类；
- 筛选维度直接对应读者的真实约束：`花钱 / 花时间 / 要毅力 × 证据等级 × 章节 × 关键词`；
- 组内多选是「或」，跨组是「且」。

### 1.5 互链、就地查看、诚实框架

- 「见第 X 节第 Y 条」带虚线，点开就地预览，不必跳转；
- 术语带虚线，悬停或点击即解释；
- 明确写「不用全做：这是按性价比排好的备选单，不是任务清单」——反游戏化。

### 1.6 可迁移 / 不可迁移

| 机制 | 是否迁移到 Buchikui | 原因 |
| --- | --- | --- |
| 统一条目微格式 | 已有 | Buchikui 已用 `关键事实 + 现实提醒`，保留 |
| 按读者处境筛选 | 迁移（A） | 对齐 `product-experience-spec` 的「可搜索主题资料库」 |
| 条目互链 / 就地预览 | 迁移（B） | CASE 不应是孤岛 |
| 术语表虚线解释 | 备查（C） | 法律术语多，价值高，后续做 |
| 显式效力/置信档 + 争议标记 | 备查（D） | 法律已有法源权重，需落成用户可见维度 |
| 纯 Markdown 单一源 | 暂不迁移 | 现有 JS 数据模型 + 前端契约稳定，迁移成本高 |
| 章节编号 / 书体系 | 不迁移 | Buchikui 以 CASE 为单位，不引入第二套编号 |
| 健康类 A/B/C 证据分级 | 不迁移 | 法律效力层级由 `legal-freshness-standard.md` 定义 |

---

## 2. Buchikui 现状与差距

### 2.1 现有强项（必须保留）

- 唯一规范路径 `/c/<slug>/`；
- **权威依据 / 裁判参考** 与 **Buchikui 现实翻译** 明确分离；
- `关键事实 + 现实提醒` 微格式；
- 证据与处理路径**按需出现**，不是产品主角；
- 来源权重纪律（法源分层、普通裁判不泛化）；
- 反 dashboard、反游戏化、编辑型纸张感。

### 2.2 差距

| 代号 | 缺口 | 现状 | 参考站做法 |
| --- | --- | --- | --- |
| A | 查找 | 首页只有关键词搜索 + 分类列表 | 多维筛选：分类 × 依据类型 × 处境 × 强度 × 争议状态 |
| B | 主题互链 | 16 个 CASE 是孤岛 | 条目互链、可就地查看 |
| C | 术语表 | 无，法言法语散落各 CASE | 共享术语表，虚线即解释 |
| D | 置信/效力标记 | 只有来源 `【】` 前缀与 `现行/即将生效` | 显式效力档 + `争议/待核实`，可筛选 |
| E | 可读目录 | 无 TOC 文档，目录由 JS 生成 | README 目录＝编辑索引 + SEO |
| F | 文档卫生 | 多份文档仍描述已废弃的紫色 PPT + 工具产品 | 单一权威文档集 |

---

## 3. 设计 A — 多维筛选

> 状态：已实现。首页仍不加载 `legal-updates.js`。

### 3.1 位置与形态

位置：首页「全部消费场景」段落内的**编辑式多选组**，不是 dashboard 指标。

形态遵循 `design-system.md`：标题、细线、列表；不做彩色卡片墙、仪表盘、百分比进度。

### 3.2 维度

1. **消费场景分类**：复用 `render-cases.js` 的 `CATEGORIES`，无需新数据。
2. **你现在处于哪一步**：`pre` 下单 / 付款前、`during` 履约中、`dispute` 已产生纠纷。
   处境是编辑判断，集中维护在 `case-facets.js`。
3. **依据类型**：归并为 `法律 / 行政法规 / 司法解释 / 部门规章·监管文件 / 典型案例·裁判 / 其他`
   六档，由 `legal-updates.js` 的规则 `type` 在构建期映射。
4. （依赖 D，暂缓）**依据强度**与**争议状态**。

### 3.3 组合逻辑

- 组内多选 = 「或」，跨组 = 「且」；
- 与关键词搜索叠加：先按关键词命中，再按 facet 过滤；
- 结果计数用 `aria-live="polite"` 播报。

### 3.4 数据机制（保持现有模型）

- 处境集中在 `case-facets.js`（`window.BUCHIKUI_FACET_STAGE`），已加入 `DATA_FILES`；
- 依据类型与相关主题在构建时由 `scripts/facets.mjs` 的 `buildFacets()` 从
  `legal-updates.js`（按 slug）与 `CATEGORIES` 派生；
- `scripts/bundle-cases.mjs` 把结果写成 `cases-data.js` 末尾的
  `window.BUCHIKUI_FACETS`；首页只加载打包后的 `cases-data.js`，**不加载** `legal-updates.js`；
- `scripts/check-frontend-contract.mjs` 增加 facet / 互链必需串，防止漂移。

### 3.5 移动端

- 390px 无横向溢出；
- facet 分组纵向堆叠；
- 触摸目标 ≥ 44px；
- 不以按钮感放大视觉噪音。

### 3.6 预算

- `app.js` 8.6 / 30 KB，`styles.css` 12 / 24 KB，`render-cases.js` 7.9 / 12 KB，均有空间；
- 新增 facet 索引需关注 `cases-data.js` 体积（当前 296 KB）。

---

## 4. 设计 B — 主题互链

> 状态：已实现。CASE 内以可选 `ruleId` 互链，CASE 间以构建期派生的 `related` 互链。

### 4.1 CASE 内：现实提醒 → 权威依据锚点

- `legal-updates.js` 的每条规则有 `id`（如 `deposit`、`platform-appeal`）；
- 场景新增可选 `ruleId`；渲染时在「现实提醒」旁给出「对应依据 →」，链接到 `#rule-<id>`；
- rights-pulse 已为每个规则输出 `id="rule-<id>"`，并支持按 hash 选中对应 Tab 并滚动；
- 试点：`rental`、`beauty-hair`。其余 CASE 可逐步补 `ruleId`。

效果：把「权威依据 → 关键事实 → 现实提醒」三段的对应关系显式化，
而不是让读者自行在两段之间来回比对。

### 4.2 CASE 间：相关主题

- 构建期由 `buildFacets()` 派生：按**同分类 + 共享依据来源**排序（共享来源权重更高），上限 3 条；
- 在 `takeaway` 前渲染「相关主题」；
- 无相关项时不渲染该区块；
- 只展示 CASE 名，不新建卡片体系。

### 4.3 预算与契约

- `render-cases.js` 预算 7.9 / 12 KB，加入互链渲染后需留意；
- 若超预算，把派生逻辑放到构建期，运行时只读结果。

---

## 5. E — 可读目录文档（已落地）

文件：`docs/content-index.md`。

内容：全部 CASE 的编辑目录，列为
`分类 · 现实问题（一句话） · slug · 依据类型 · 最近更新`。

用途：

- 编辑索引：改内容时先看它，避免遗漏；
- 贡献者 / Agent 上下文：一份人类可读的 CASE 全景；
- SEO 辅助与外部可读目录。

漂移控制：

- 现为按 CASE 数据手写的初版；
- 待办：`scripts/build-content-index.mjs` 从 `loadCases()` + `BuchikuiAuthority.getRules()`
  生成，并加入 `check-frontend-contract.mjs` 或独立校验，防止与 CASE 数据漂移。

---

## 6. F — 文档清理（已落地）

### 6.1 分类

**Normative（现行，权威）**

- `product-experience-spec.md`
- `case-content-standard.md`
- `legal-freshness-standard.md`
- `design-system.md`
- `consumer-feedback.md`
- `agent-feedback-workflow.md`
- `information-architecture.md`（本文，Design）
- `content-index.md`（目录）

**Archived（归档，仅历史参考）**

- `archive/product-concept.md`
- `archive/content-plan.md`
- `archive/tech-roadmap.md`
- `archive/roadmap.md`
- `archive/operations.md`

### 6.2 规则

- 归档文档描述的是已废弃的 Astro + 紫色 PPT + 工具产品，**不再作为规范**；
- 新文档、README、AGENTS 一律引用现行文档；
- `docs/README.md` 是唯一文档索引。

### 6.3 引用修复

- `README.md` 规范清单改指 `docs/README.md` 与现行规范；
- `docs/agent-feedback-workflow.md` §6 过时的 CASE 文件列表改为指向
  `scripts/prerender-cases.mjs` 的 `DATA_FILES`（实际 15 个源文件、16 个 CASE）；
- 归档文档内的交叉引用随归档更新。

---

## 7. 备查 — C 术语表 / D 效力与置信标记

### 7.1 C 术语表

- 单一数据文件（如 `glossary.js`）保存术语 → 解释；
- 正文用 `<span class="term" data-term="…">` 标注；
- 悬停（桌面）/ 点击（移动）弹出解释，并提供一个「术语表」页面；
- 只在需要时加载，保持首页体积。

### 7.2 D 效力 / 置信标记

- 统一定义用户可见的法源效力档，例如：
  `法律 > 行政法规 > 司法解释 > 部门规章/监管文件 > 指导/典型案例 > 普通裁判 > 平台协议`；
- 新增 `争议`、`待核实` 标记，用于普通裁判、平台协议、存在不同裁判的口径；
- 标记需可筛选（接 A），且不把主观判断伪装成规则。

---

## 8. 定义完成（DoD）

- A/B 实现后，`node scripts/check-frontend-contract.mjs` 通过；
- 390px 无横向溢出，首页首屏可见定位与搜索；
- 权威依据与 Buchikui 翻译仍可见分离；
- 一手来源仍可直接打开；
- 新增字段均为**可选**，不破坏现有 CASE；
- 首页仍不加载 `legal-updates.js`。
