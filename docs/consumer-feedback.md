# 段落级消费者经验回流

## 目标

让普通消费者把真实经历补充到正在阅读的具体段落，同时保持“不吃亏”正文的编辑权威。

唯一闭环：

**Reader 选中文字 → 登录 → 提交经验 → Supabase `product_feedback` → Admin review → 编辑修改 GitHub 正文 → PR / merge → Pages 发布 → 反馈标记为已吸纳。**

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

## Reader UX

- 阅读始终无需登录。
- 只有用户选中文字后才出现 `补充经验`，没有常驻评论图标、评论数或头像墙。
- 未登录点击后打开现有 Hao Account；选区暂存在浏览器 `localStorage`，最多保留 6 小时，因此 OAuth 跳转或邮箱 Magic Link 在新标签页完成登录后仍能继续原反馈。
- 已登录时桌面使用右侧 editorial drawer，移动端使用 bottom sheet。
- 提交类型只有四种：`亲身经历 / 信息纠错 / 流程补充 / 其他`。
- 提交后只提示“已进入编辑收件箱”，不会直接公开。

## 数据合同

继续使用现有 `public.product_feedback`：

```text
product_code = buchikui
category     = content
message      = 用户补充
page_url     = 固定到当前 CASE 的 URL
metadata     = 锚定上下文
status       = new（数据库默认值）
```

`metadata`：

```json
{
  "schema_version": 1,
  "kind": "anchored_consumer_experience",
  "feedback_type": "experience",
  "case_id": "001",
  "case_slug": "rental",
  "case_name": "如何租车维权",
  "case_updated": "2026-08-15",
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

`anchor_key` 用内容结构的语义身份；quote selector 和 `case_updated` 保存用户提交时真正看到的版本。旧反馈不需要为了正文改稿自动迁移或重锚定：Admin review 时保留原始 quote 即可。

## 权限与审核

现有 Supabase RLS 是权威：

- `authenticated` 用户只能 INSERT 自己的反馈；
- 新反馈只能以 `status = new` 写入；
- 用户只能读取自己的反馈；
- 管理员通过现有 `feedback-admin` Edge Function review。

Admin 对 Buchikui 使用现有状态字段，但显示为编辑语义：

- `new` → 待审
- `reviewing` → 评审中
- `planned` → 已采纳 · 待改稿
- `resolved` → 已吸纳
- `closed` → 不采纳

不新增公开评论、回复、点赞、Realtime、通知、第二套审核后台或第二张反馈表。
