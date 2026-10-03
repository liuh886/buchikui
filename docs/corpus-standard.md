# Corpus Standard — 语料层规范

> 状态：Normative
> 更新：2026-10-03
> 作用：定义 `corpus/` 的记录类型、字段、枚举与版本纪律。
> 关系：语料层存**事实**，编辑层存**翻译**，呈现层由构建生成。三层单向：corpus → payload。
> 语料层不知道前端存在；前端改版不得要求修改语料层。

## 1. 为什么要有这一层

在语料层出现之前，`type / issuer / document / effective / verified / status` 挂在**规则**上，
而它们描述的是**法源**。后果是：一份法源被 N 条规则引用，就有 N 份手抄元数据，
没有任何东西保证它们一致，也没有字段能表达「这条依据基于哪个版本、该版本是否现行」。

已经发生过的真实错误：《反不正当竞争法》2025-06-27 第二次修订、2025-10-15 施行，
项目里同时存在 2025 修订版链接与 2019 修正版链接，而规则标着 `status: 现行`。
读者点开会落到一部已被取代的文本。

## 2. 四类记录

| kind | 是什么 | 关键字段 |
| --- | --- | --- |
| `law` | 法律、行政法规、司法解释、部门规章、规范性文件、政策文件 | `type` `issuer` `status` `effective` `revision` |
| `case` | 裁判、指导案例、典型案例、监管处罚案例、监管通报 | `weight` `court` `date` |
| `portal` | 办事入口：12315、网上立案、12378、运营商营业厅 | `operator` |
| `reference` | 商业机构公开信息：平台协议、银行规则、基金费率页、境外官方提示 | `publisher` |

四分法不是分类洁癖，它把 `legal-freshness-standard.md` §5 的**来源权重落到数据层**：
`law` 与 `portal` 可以直接支撑依据；`case` 只能按 `weight` 分档；
`reference` 只能说明合同机制或费用事实，**不能替代法定义务**。

## 3. 字段

### 所有记录共有

```json
{
  "id": "law-aucl-2025",
  "kind": "law",
  "title": "中华人民共和国反不正当竞争法（2025 年修订）",
  "url": "https://www.npc.gov.cn/…",
  "verified": "2026-10-03",
  "note": "可选。适用边界、争议、与其它法规的关系。"
}
```

- `id` 必须等于文件名（不含 `.json`），全小写，`-` 连接，跨仓库唯一，一经使用**不得改名**；
- `url` 必须是 `https`，且路径不得为空（裸域名不是原文；`portal` 是例外，入口本身就是站点根）；
- `aliasUrls`：同一法源的等价官方链接。引用它们等价于引用本记录，用于把多个官方地址收敛成一条；
- `verified` 是这一条被复核的日期，不许留空，不许写未来日期。

### `law`

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `type` | ✓ | 枚举见 §4 |
| `issuer` | ✓ | 发布机关全称 |
| `status` | ✓ | `现行` / `即将生效` / `已取代` / `已废止` / `待核验` |
| `effective` | `现行` 必填 | 施行日期 `YYYY-MM-DD` |
| `revision` | 否 | 版本说明，如「2025-06-27 第二次修订」 |
| `supersedes` / `supersededBy` | 版本关系必填其一 | 指向另一条 `law` 的 `id` |
| `articles` | 否 | `[{ "no": "第八条", "topic": "商业贿赂" }]`，只记条款号与主题 |

**不存法条全文。** 全文会立刻变成过期负债，且有转录错误风险；官方链接才是权威。
要的是「能定位到具体条款」，不是「复制一份」。

### `待核验` 是合法状态，而且是默认状态

`status: 待核验` 表示：**已采集，但尚未核对效力状态与施行日期**。它意味着

- 页面**不显示**施行日期与「现行」字样，只作为一条来源链接出现；
- 它**不能**作为一条规则的唯一支撑；
- 校验脚本把它计入待办数量并打印。

为什么要有这个状态：把凭记忆填的施行日期写进语料层，等于把「看起来准确」当成「已核验」，
那正是本项目要消灭的毛病。**宁可显式标注未核验，也不要猜。**

### `case`

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `weight` | ✓ | 枚举见 §4。决定它在页面上算不算依据 |
| `court` / `issuer` | ✓ | 法院或作出机关全称 |
| `date` | ✓ | 裁判或通报日期 |
| `holding` | ✓ | 一句话裁判要点 |
| `facts` | 否 | 决定能否类比的事实边界 |

媒体披露的案件（如 `weight: 媒体披露`）**不得**单独支撑一条依据；
若它只是发现问题，应登记为 `reference` 而非 `case`。

### `portal` / `reference`

只需 `title` + `url` + `operator` 或 `publisher` + `verified`。

## 4. 枚举

```text
law.type      法律 | 行政法规 | 司法解释 | 部门规章 | 规范性文件 | 政策文件 |
              地方规章 | 监管规范性文件
case.weight   指导性案例 | 典型案例 | 生效裁判 | 监管处罚案例 | 监管通报 | 媒体披露
law.status    现行 | 即将生效 | 已取代 | 已废止 | 待核验
```

## 5. 硬约束（由 `scripts/check-corpus.mjs` 强制）

1. `id` 与文件名一致；`kind` 合法；`url` 为 https 且路径非空；`verified` 是合法日期。
2. `law` 必有 `type` / `issuer` / `status`；`status: 现行` 必有 `effective`；
   `已取代` 必有 `supersededBy`；`已废止` 必有 `supersededBy` 或 `note`。
3. `case` 必有 `weight` / `court`（或 `issuer`）/ `date` / `holding`。
4. `law` 与 `case` 的 `url` 不得指向社交平台（`weibo` / `xiaohongshu` / `reddit` / `zhihu`）。
5. **任何 `law` 的身份不得重复**：同一 `title` + `issuer` 只能有一条 `现行` 记录。
6. **编辑层引用的每个 `sourceId` 必须存在**。
7. **编辑层不得引用 `status` 为 `已取代` / `已废止` 的法源**——这是《反不正当竞争法》
   那类错误的守门人。
8. 标记 `needsReview: true` 的记录**不算失败**，但会在 CI 输出里点名，直到人工补齐并删除标记。

## 6. 复利：这份语料层能换来什么

| 机制 | 兑现方式 |
| --- | --- |
| 一次采集多处复用 | 一部法源入库后，所有引用的元数据、链接、核验日期、facets 归类一次正确 |
| 引用计数 | `check-corpus.mjs` 输出每条记录的被引用次数。0 引用 = 采集沉没成本，可删；被多处引用 = 高价值，值得再投入复核 |
| 链接体检 | `url` 是结构化字段，因此可以定时 HEAD 全部链接，坏了自动开 issue（Phase C） |
| 变更影响可枚举 | 一部法规改 `status`，校验脚本能列出所有受影响的规则与题目 |
| 类型不再靠猜 | `facets` 的六档归类直接读 `law.type`，不再用正则猜 `type` 字符串 |

## 7. 与新鲜度的关系

`verified` 是**这一条**的复核日期，页面上显示为「核验 YYYY-MM-DD」。
`legal-updates.js` 里的模块级 `VERIFIED` 是整批核验日期，显示为「本批核验 YYYY-MM-DD」，
只作为没有逐条 `verified` 时的诚实降级，不再伪装成逐条核验。

复核节奏见 `legal-freshness-standard.md` §11。

## 8. Agent 维护约定

- 新增一条法源：建 `corpus/law/<id>.json`，只填 §3 的字段。**不要顺手写消费者建议。**
- 修订一条法源：先改 corpus，再改引用它的规则；不要在规则里改元数据。
- 语料层里出现「所以消费者应该…」「建议…」这类句子，即为跑偏，评审应直接驳回。
- 经历与用户反馈**不进仓库**。它们在 Supabase 队列里，Agent 按
  `docs/agent-feedback-workflow.md` 复核；复核后的产物才写进编辑层或登记为 `case`。

## 9. 三层怎么接起来

```
corpus/law|cases|reference + portals.json + terms.json   事实
editorial/rules.js                                         翻译（只写 sourceIds）
editorial/authority-runtime.js                             渲染代码
        │  scripts/build-authority.mjs
        ▼
legal-updates.js                                           浏览器载荷（生成物，勿手改）
```

- `legal-updates.js` 的 `type` / `authority` / `effective` / `verified` / 来源链接**全部由 corpus 派生**，
  编辑层写这些字段会被契约脚本拦下；
- `document`（本规则用到哪些条款 + 个案说明）、`title`（一句消费者判断）、`text`、`action` 留在编辑层；
- 改完 `corpus/` 或 `editorial/` 必须运行：

```bash
node scripts/build-authority.mjs
node scripts/bundle-cases.mjs
node scripts/build-content-index.mjs
node scripts/check-frontend-contract.mjs
```

## 10. `terms.json`

术语表（IA §7 的 C）。只收消费者在权威依据与原文段落里会遇到、且容易读错的词。
每条：`term` / `alias` / `meaning`（日常说法）/ `why`（为什么与判断结果有关）。
不给法条原文。字段含义：

| 字段 | 说明 |
| --- | --- |
| `term` | 术语本体，页面标注用 |
| `alias` | 同义写法，检索与虚线提示都要能命中 |
| `meaning` | 日常说法，不带法言法语 |
| `why` | 这个词会怎样改变读者的判断或动作 |

## 11. 链接体检（Phase C）

`scripts/check-links.mjs` 跑遍全部 `url` 与 `aliasUrls`，由
`.github/workflows/corpus-link-check.yml` 每天调度。

结果分三类，**不能混**：

| 类别 | 判定 | 处置 |
| --- | --- | --- |
| 可达 | HTTP 200/301/403/405… | 无 |
| HTTP 报错 | 拿到 404/500 等状态 | **开 issue**，这是真的坏链 |
| 连不上 | TLS 握手失败、超时、DNS | 只统计不开 issue——境外 runner 常见，不代表链接坏了 |

混为一谈会导致每天误报，issue 很快被忽略，体检就失去意义。
## 12. 编辑层只引用，不复述

`editorial/` 负责「怎么说」，`corpus/` 负责「是什么」。这个分工靠一条硬规则维持：

> **CASE 与依据规则只写 `sourceId`，不写来源名称与链接。**

```js
// 对
sources: [{ sourceId: 'law-consumer-regulations' }]
// 错：抄下来的名称和链接会与语料层漂移，且无法被门禁发现
sources: [{ title: '《消费者权益保护法实施条例》', href: 'https://...' }]
```

名称与链接在渲染时由 `corpus/` 解析，因此编辑层**抄不了也漂移不了**。
`scripts/lib/case-schema.mjs` 把内联 `title` / `href` 判为 error。

来源的显示口径只有一份实现，在 `scripts/lib/corpus.mjs` 的 `sourceTitle()`，
`build-authority`（权威层来源行）与 CASE 页的来源解析共用它：

| 语料 kind | 书名号 | 标签前缀 |
| --- | --- | --- |
| `law` | 加 | `type`，如 `【法律】` |
| `case` | **不加**——给案件名套《》是错的 | 权重不进标题，由页面另行标注 |
| `reference` | **不加**——那是媒体报道或平台协议 | 无 |
| `portal` | **不加** | 无 |

`type` / `weight` 缺失时**不编造标签**。曾经把缺 `type` 的待核验记录一律标成「规则」，
一部民诉法因此被显示成「规则」，这是必须避免的降级。

## 13. CASE 结构校验

`scripts/lib/case-schema.mjs` 给编辑层一份和 corpus 同等级的契约，
由 `scripts/check-frontend-contract.mjs` 调用。

原则：**结构问题一律 error，事实问题交给语料层门禁。** 编辑层没有「待核验」这种状态——
写错字段就是写错了，不该带着不确定性发布。

被拦下的典型问题：缺 `slug` / `name` / `meta.description` / `hero.title`；
`updated` 不是 `YYYY-MM-DD` 或是未来日期；slug 重复；没有任何现实提醒（`scenarios` 与
`panic.items` 都为空）；正文用了白名单外的标签或含可执行内容；`case-facets.js` 缺该 slug 的
处境映射（筛选会静默失效）；处境映射里有指向不存在 CASE 的键。

CI 同时跑 `npm test`（`node --test`，零依赖），覆盖来源显示口径、编辑层 schema 与筛选维度
映射——显示口径那组断言就是 §12 表格的事故护栏。
