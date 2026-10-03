# 不吃亏 — 当前待办

> 更新：2026-10-03（完成修复整理 + 定位修订为「决策指南」后的真实状态）
> 门禁：`node scripts/check-frontend-contract.mjs` 必须通过。
> **注意**：规范已改为决策指南形态，但代码尚未实现；契约脚本目前仍按旧结构断言，
> 改动情景卡时必须同批更新契约脚本，否则 CI 会红。

## 已完成（2026-10 修复与整理）

- [x] 删除泰国 CASE 的 Reddit 网络爆料 Tab，把「持续向边境移动」并入已确认案件的动作
- [x] 青岛「景区拍照」依据换成可打开的警方通报报道（央视网 / 新京报），修正法律条文引用
      （第十三条、第二十六条、第三十条），去掉无法追溯的文旅局与地方规章链接
- [x] 「AI替岗」「撤销部门」等媒体来源的裁判重新标注为裁判报道；星宇事件从「裁判参考」改为
      权威依据层的「监管通报」
- [x] 权威层来源并入 CASE「原文」段（浏览器与预渲染同一套 HTML），删除失效的 `syncSources`
- [x] 预渲染富文本改为白名单序列化，与浏览器渲染一致
- [x] 清理遗留兼容路径（`.hero`、`#caseName`）与 12 个 CASE 里不渲染的 `panic.items`
- [x] `ruleId` 场景级跨链铺满（86 条现实提醒中 70 条有明确依据）
- [x] `docs/content-index.md` 改为脚本生成并接入契约校验；「现实问题」存入 `meta.question`
- [x] 契约脚本新增：法源来源不得为裸域名、媒体爆料不得作依据、`ruleId` 不得指向不存在的依据、
      移动端触摸目标 44px、目录防漂移、核验覆盖度报告
- [x] 文档术语统一（「权利校验」→「权威依据」）、核验日期纪律与复核节奏、反馈文档与实现对齐

## Phase A — 语料层（已完成）

三层架构落地：`corpus/`（事实）→ `editorial/`（翻译 + 渲染）→ 生成物。

- [x] `docs/corpus-standard.md`：四类记录（law / case / portal / reference）+ 术语表 + 11 条硬约束
- [x] `scripts/lib/corpus.mjs` + `scripts/check-corpus.mjs`：语料层门禁，带棘轮
      （`needsReview` / `待核验` / 缺 `verified` 的记录缺字段只警告；补齐后删标记即变成错误）
- [x] `editorial/rules.js`：50 条依据改为 `sourceIds` 引用，`type` / `authority` / `effective` /
      `verified` 全部删除，改由 corpus 派生；契约脚本禁止编辑层再写这些字段
- [x] `editorial/authority-runtime.js`：渲染代码独立成文件
- [x] `scripts/build-authority.mjs`：corpus + editorial → 生成 `legal-updates.js`，生成即校验语法
- [x] `corpus/` 迁移 **135 条**：law 82 · case 27 · reference 15 · portal 11；合并 URL 变体为 `aliasUrls`
- [x] 门禁接入 `check-frontend-contract.mjs`：**未登记的链接直接失败**，指向 `已取代`/`已废止`
      法源的引用直接失败；`legal-updates.js` 与源文件不同步直接失败
- [x] 重新分类 21 条错放记录（裁判被当成法源、基金费率页被当成法源）· 合并 3 条重复 · 删除 1 条孤儿
- [x] 修掉三个真实错误：《反不正当竞争法》2019 修正版被当成现行依据引用（规则层 + CASE 层各一处）、
      泰国 CASE 的 sources 里残留的 Reddit 网络爆料链接
- [x] `corpus/terms.json`：27 条术语（IA §7 的 C）
- [x] 等价性验证：16 页预渲染对比基线，0 处标题变化，链接差异全部是预期修复

## Phase B — 判例与术语（已完成主体）

- [x] 11 条 case 记录的 `holding` 取自编辑层规则的一句话判断（已有编辑背书）
- [ ] 16 条 case 记录补 `court` / `date`（现在只有 weight + holding）

## Phase C — 自动化（已完成）

- [x] `scripts/check-links.mjs` + `.github/workflows/corpus-link-check.yml`：每天体检，
      **只对 HTTP 报错开 issue**，连不上只统计（境外 runner 常见，避免每天误报）
- [x] 引用计数与零引用数进 CI 输出（复利健康度可见）

## A3 剩余：核验待核验记录

`node scripts/check-corpus.mjs` → 待核验 51 · needsReview 88 · 零引用 11。
其中 **14 条被规则引用**（会在页面上显示施行日期与类型），优先级最高：

| 记录 | 缺什么 |
| --- | --- |
| `law-auction-1996` 拍卖法（2 条规则引用） | effective · verified |
| `law-auction-supervision-2023` 拍卖监督管理办法 | effective · verified |
| `law-taxi-2019` 巡游出租汽车经营服务管理规定 | effective · verified |
| `law-labor-contract-reg-2008` 劳动合同法实施条例 | effective · verified |
| `law-financial-product-marketing-2026` 金融产品网络营销管理办法 | effective · issuer |
| `law-五部门关于切实做好网约车聚合平台规范管理有关工作的通知` | effective · verified |
| `policy-truck-driver-rights-2021` 货车司机权益保障意见 | effective · verified |
| 其余 7 条 | 同上 |

**核验方法**：打开官方页面确认施行日期与发布机关 → 写进记录 → 删 `needsReview` → 跑
`node scripts/check-corpus.mjs`。禁止凭记忆填日期。
37 条仅作链接的记录不影响页面显示，可按 `--orphans` 与引用次数排序后处理。

## 内容缺口（有据可查，尚未补）

这些不是 bug，是权威层还没有对应规则的现实问题。补的时候必须先找到一手依据，
挂不上的宁可留空（契约脚本会拒绝错挂）。

- [ ] `rental`：最重要的 `deposit`（押金退还）没有任何场景指向它，缺「押金不退 / 退还条件」
      场景
- [ ] `rental`：S4 强制搭售、S5 提灯验损、S9 待处理费仍无依据（消保条例第十条、
      停车位与验损规范）
- [ ] `mobile-plan-cost`：`appeal-deadline`（15 日答复 / 5 个月收费争议）无场景指向
- [ ] `alipay-advisor-cost`：`third-party-platform`（第三方平台即将禁止）无场景指向，
      需要一个「在第三方平台买投顾」的现实问题
- [ ] `rental-credit-card-first`：`platform-appeal` 无场景指向
- [ ] `layoff-compensation`：`ai-replacement`、`department-closure` 无场景指向
- [ ] `alibaba-auction-trap`：`platform-preservation` 只被一条 panic 之外的内容覆盖；
      估值纪律与悔拍责任（《拍卖法》违约、保证金、差价）整块没有依据
- [ ] `internet-court-self-litigation`：S1 是否值得起诉、S6 证据目录、S8 追加当事人、S10 开庭
      无依据
- [ ] `dating-safety`：S1 身份核验、S2 场所安全无依据
- [ ] `bank-wealth-not-guaranteed`：S6 市场风险与销售责任拆分无单一依据
- [ ] `beauty-hair`：S4 过敏 / 灼伤 / 断发损伤无依据
- [ ] `transport-platform-layered-fees`：S4 依赖《互联网平台价格行为规则》（2026-04-10 施行），
      但该规章没有进入权威层，需要补官方链接

## 待决策（需要人来定）

- [x] **CASE 形态**：保留 `/c/<slug>/` 地址、改变页面形态（书的一章），不合并页面
- [x] **按钮语义**：跳过 = 不判定直接翻面；换一题 = 换随机卡；查看答案 = 翻面
- [x] **题目反馈落点**：GitHub issue（预填题号）；消费者经历仍走 Supabase
- [ ] **卷序**：spec §4 给出了 5 卷初始方案，待确认后写进 `case-facets.js` 一类的数据文件
- [ ] **核验日期覆盖**：50 条依据里只有 5 个主题有逐条 `verified`，其余显示「本批核验」。
      是否安排一轮 90 天复核把日期补齐？
- [ ] **内容新鲜度**：全站最近更新停在 2026-09-02。是否按 `legal-freshness-standard.md` §11
      启动季度复核？

## 下一步开发计划（2026-10-03 定位修订后）

按依赖顺序，每一步都能独立发布、独立回滚：

1. **题目数据与规范落地**
   - 新增 `scenario-checks.js`（首批 12–15 题，只做单选）
   - `legal-freshness-standard.md` 增加「题目纪律」小节，与 spec §6 对齐
   - 契约脚本新增守卫：每题必须有 `ruleId` 与 `exception`、`ruleId` 必须存在、
     题面/选项/解析字数上限、选项措辞平行
2. **首页情景卡**
   - `render-cases.js` 增加卡片渲染（DOM-free，浏览器与预渲染共用）
   - `app.js` 接入随机、判定、翻面、键盘可达、aria-live 播报
   - 导航 bar：随机情景 / 搜索主题 / 目录 / 反馈
   - `styles.css` 情景卡样式；`rights-pulse.css` 不动
3. **目录页与章节化 CASE**
   - `book-order` 数据 + 目录页 `/toc/`
   - CASE 页加章序、目录入口、上一章 / 下一章（prerender 同步）
   - 契约脚本：断言章序与目录页存在，且 `/c/<slug>/` 仍是唯一规范路径
4. **契约脚本同步**
   - 移除 `feedback.js` / `feedback.css` 退役断言（题目反馈走 issue，不需要前端反馈脚本）
   - 把「首页 = 搜索库」的结构断言换成「首页 = 情景卡」的结构断言
   - **注意：这一步必须与第 2 步同批提交，否则 CI 会红**

## 规划中（IA §7 备查，尚未批准）

- [ ] C 术语表：共享术语数据 + 虚线解释
- [ ] D 效力 / 置信标记：`争议 / 待核实` 标记并接入筛选