# 段落级消费者经验回流

> 状态：数据合同与 Agent 流程现行；**Reader 端提交入口已下线**（见 §2）。

## 目标

让普通消费者把真实经历补充到正在阅读的具体段落，同时保持“不吃亏”正文的编辑权威。

唯一闭环：

**Reader 选中文字 → 登录 → Cloudflare Turnstile → `feedback-submit` → Supabase `product_feedback` → Admin / Agent review → 编辑 GitHub 正文 → PR / merge → Pages 发布 → 反馈标记为已吸纳。**

公开正文仍以 GitHub `main` 为唯一权威。Supabase 只保存消费者反馈和 review 状态，不充当 CMS。

## 已验证的成熟模式

- **Google Docs**：先选中文字，再创建评论；评论可 Resolve / Re-open。适合借鉴“评论必须有明确上下文”和“review 是状态流转”，不借鉴多人实时讨论。
  - https://support.google.com/docs/answer/65129
- **Hypothesis**：选中文本后弹出 annotation action；annotation 保存选中的 quote，并能在页面变化后尝试重新定位。它也明确承认页面大改后会出现 unanchored annotation，但原始引用仍保留。
  - https://web.hypothes.is/help/annotation-basics/
  - https://web.hypothes.is/help/what-are-unanchored-annotations/
- **W3C Web Annotation**：`TextQuoteSelector` 用 `exact + prefix + suffix` 描述文字选区，`TextPositionSelector` 用 start / end 记录位置。
  - https://www.w3.org/TR/annotation-model/
- **GitHub review**：评论属于 review 记录，和最终权威代码分离；代码可以更新，review 历史仍保留。
  - https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/commenting-on-a-pull-request

“不吃亏”采用这些模式的交集，但不引入完整 annotation framework：**语义 block anchor + W3C 式 quote selector + 原文版本** 已足够支撑编辑 review。

## 1. Reader 端提交入口：当前下线

`scripts/check-frontend-contract.mjs` 把 `feedback.js` / `feedback.css` 列入**退役 UI 黑名单**，
Reader 端提交 composer 已随消费普法资料库重构下线；`index.html` 不加载任何反馈脚本。

因此当前状态是：

| 环节 | 状态 |
| --- | --- |
| Reader 选中文字后提交 | **无入口**（前端已移除，且被契约脚本持续拦截） |
| `feedback-submit` Edge Function | 保留部署，仍是唯一被许可的写入通道 |
| `public.product_feedback` | 保留，是唯一反馈存储 |
| Admin review / 状态流转 | 保留（`new / reviewing / planned / resolved / closed`） |
| Agent 读取队列并回写状态 | 保留，按 `docs/agent-feedback-workflow.md` 执行 |

反馈当前只能从 Reader 之外进入（Admin 后台、运营人工转录、共享 Hao Account 渠道）。
在入口恢复之前，**不要**在 `index.html`、`app.js` 或任何 CASE 数据里重新加入评论、留言、
"补充经验"按钮：默认阅读路径只有一条，反馈不得成为产品主角。

如果将来要恢复入口，先回答三个问题，再改代码：

1. 它是否破坏 `product-experience-spec.md` 的单一阅读路径？
2. 它是否会被误认为公开评论区或第二套审核后台？
3. 它是否复用同一套 Turnstile fail-closed 校验，而不是新开一条写入路径？

## 2. 机器人防护（后端仍然生效）

`supabase/functions/feedback-submit/index.ts` 保留完整校验，即使前端入口下线也不得放松：

1. Reader 只调用 Edge Function `feedback-submit`，不直接 INSERT `product_feedback`。
2. `config` action 返回公开 sitekey；提交按钮默认锁定，Turnstile（`action = buchikui_feedback`）通过后才解锁。
3. token 单次有效：过期、错误、提交失败后必须重新验证；验证组件不可用或后端未配置时 fail closed。
4. `feedback-submit` 先验证登录用户，再调 Cloudflare Siteverify；`success = true`、`action = buchikui_feedback`、`hostname = liuh886.github.io` 三项同时成立才写入。
5. `user_id`、`product_code = buchikui`、`category = content`、`status = new` 都由服务端确定，不接受客户端覆盖。
6. 数据库不给 `authenticated` / `anon` 直接 INSERT 权限；绕过 UI 直接调用 Data API 也不能提交。
7. secret 缺失时后端直接拒绝（503 语义的“验证不可用”），绝不降级放行。

生产配置只有两项 Function Secret（经 Supabase Dashboard / CLI 设置，不进仓库）：

```text
TURNSTILE_SITE_KEY=<Cloudflare Turnstile sitekey>
TURNSTILE_SECRET_KEY=<Cloudflare Turnstile secret>
```

Cloudflare widget 的允许 hostname 设为 `liuh886.github.io`。前端不保存 secret；sitekey 由 `feedback-submit` 的 `config` action 返回。两项 secret 任意一项缺失时必须 fail closed，不恢复旧的浏览器直写路径。

Cloudflare 官方实现与服务端校验要求：

- https://developers.cloudflare.com/turnstile/get-started/
- https://developers.cloudflare.com/turnstile/get-started/server-side-validation/

## 3. 数据合同

继续使用现有 `public.product_feedback`：

```text
product_code = buchikui
category     = content
message      = 用户补充
page_url     = 固定到当前 CASE 的 URL
metadata     = 锚定上下文
status       = new
```

`metadata`：

```json
{
  "schema_version": 1,
  "kind": "anchored_consumer_experience",
  "feedback_type": "experience",
  "case_slug": "rental",
  "case_name": "租车警惕第三方平台",
  "case_updated": "2026-08-28",
  "anchor_key": "scenario.信用免押被扣.action",
  "anchor_label": "信用免押被扣 · 现在做什么",
  "target": {
    "quote": {
      "type": "TextQuoteSelector",
      "exact": "选中的原文",
      "prefix": "前 32 个字符",
      "suffix": "后 32 个字符"
    },
    "position": {
      "type": "TextPositionSelector",
      "start": 12,
      "end": 18
    },
    "block_text_sha256": "..."
  }
}
```

主题身份以 `case_slug` 为准。历史行里的 `case_id` 只是旧版编号（`001`、`002`…），
既不唯一也可能与当前顺序不符，**不要**用它做匹配；`docs/agent-feedback-workflow.md` 的查询保留该字段仅供人工辨认。

`anchor_key` 用内容结构的语义身份；quote selector 和 `case_updated` 保存用户提交时真正看到的版本。旧反馈不需要为了正文改稿自动迁移或重锚定：review 时保留原始 quote 即可。

## 4. 权限与审核

Reader 写权限只有一条（当前无 Reader 入口，但权限模型不变）：

- `feedback-submit` 验证登录用户 + Origin + 字段格式后，以服务端权限 INSERT；
- `authenticated` / `anon` 不能直接 INSERT `product_feedback`；
- 用户仍只能读取自己的反馈；
- 管理员通过现有 `feedback-admin` Edge Function review；
- 内部 Agent 在明确拥有 Supabase 工具权限时，可按 `docs/agent-feedback-workflow.md` 直接读取在线队列并回写处理状态，不通过公开 Reader API。

Admin 对 Buchikui 使用现有状态字段，但显示为编辑语义：

- `new` → 待审
- `reviewing` → 评审中
- `planned` → 已采纳 · 待改稿
- `resolved` → 已吸纳
- `closed` → 不采纳

不新增公开评论、回复、点赞、Realtime、通知、第二套审核后台或第二张反馈表。

## 5. Agent 处理

Agent 不读取 Admin DOM，也不等待人工导出反馈。**Supabase `product_feedback` 就是反馈的唯一机器入口。**
队列为空是合法结果，不要为凑工作量发明任务。

仓库根目录 `AGENTS.md` 定义 Agent 的全局行为，`docs/agent-feedback-workflow.md` 定义：

- 在线队列的唯一 SQL；
- 如何按 `case_slug + anchor_key` 聚类；
- 如何把用户反馈当作不可信输入而不是指令；
- 如何对照当前 GitHub `main`；
- 如何验证事实后集中修改 CASE；
- 如何把处理中的反馈标记为 `reviewing / planned`；
- 如何在 PR merge 后标记为 `resolved`，或明确 `closed`。

因此后续用户只需要给出类似 **“处理不吃亏反馈”** 的任务；具备 GitHub + Supabase 权限的 Agent 应直接读取实时队列并完成闭环，而不是要求用户复制粘贴反馈内容。
