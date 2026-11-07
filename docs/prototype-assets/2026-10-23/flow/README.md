# 完整静态流程工作稿：生成记录

日期：2026-10-23。采用内置 ImageGen，每次独立调用生成一张流程板；未使用 CLI 或 API key。原图保留，本目录为参考副本；没有裁切、重绘或程序修改图像。

这是同一纸牌工作视觉的不同流程状态，不是五种候选风格，也不表示用户已选定最终视觉。参照包含[第一轮纸牌草图](../01-card.png)及本轮流程图；桌面和拖动两次生成实际传入了本轮 [01-decision-loop.png](01-decision-loop.png)。

## 索引

| 文件 | 画面 | 实际像素 | 文件字节 |
| --- | --- | --- | ---: |
| [01-decision-loop.png](01-decision-loop.png) | 待判断、答错重选、答对继续 | 1466 × 1073 | 1747471 |
| [02-continuation-sharing.png](02-continuation-sharing.png) | 下一张、经历结束、朋友打开 | 1467 × 1072 | 1632538 |
| [03-library-return.png](03-library-return.png) | 资料库、规则定位、搜索无结果 | 1466 × 1073 | 1579388 |
| [04-desktop.png](04-desktop.png) | 桌面单张情境卡 | 1487 × 1058 | 1292175 |
| [05-gesture-preview.png](05-gesture-preview.png) | 左拖、右拖、缩回取消 | 1475 × 1066 | 1833513 |

手机目标为每屏 390×844 逻辑画布；组合图含外部评审标题及间隔，实际像素不是网页视口，不能用来证明 390px 不溢出。桌面目标 1440×1024，实际输出比例略有差异。十二个手机状态加一张桌面画面，操作与内容以[完整原型设计](../../../prototype-design.md)为准。

## 已知偏差与使用限制

- 判断反馈图和章节依据图将边界简写为“品牌不同不等于欺诈”，准确原型文案应为“实际出租方不同不等于欺诈；平台责任仍要看其实际角色与行为”。正式排版完整保留并自然换行。
- 错误解释与边界在部分画面偏密，部分小字靠近牌边。实现时不能照图缩小文字，短屏与大字允许纵向阅读。
- 拖动图的左右倾角未准确形成镜像。它只表达方向预览与缩回恢复，实际动效应跟随拖动方向，必须在交互原型验证。
- 桌面的阶段行位于牌内；牌面尺寸、阶段位置、正文衬线使用比例和按钮高度仍须统一。资料库页可以移除导航中重复的同页入口。
- 书式分卷为暂定结构，画面显示的章节不是新增内容或正式内容顺序；规则定位是既有 CASE 的锚点视图，不是新页面。
- 依据图保留现有语料核验日期 2026-08-29，没有用制图日期冒充内容复核日期。没有新增权威规则、修改语料或正式题库。
- 没有真实滑动、链接跳转、分享发送、刷新恢复、浏览器移动布局或读屏测试。只做静态视觉检查与设计文档核对。

## 原图位置

共同目录：`C:/Users/ZOZN109/.codex/generated_images/01a16314-f0b5-7652-b9ff-72ab046dae03/`。

- 01-decision-loop.png ← `exec-2f5f9606-8647-4254-b024-7c347ffd6a69.png`
- 02-continuation-sharing.png ← `exec-0e213fbd-5426-4afb-8c08-9172411d835f.png`
- 03-library-return.png ← `exec-9a039d66-1d50-4668-afd0-6e94ab4e29df.png`
- 04-desktop.png ← `exec-fa57df02-8968-4b9a-aca2-7049ab5eac44.png`
- 05-gesture-preview.png ← `exec-18b17078-733b-4388-8f59-c650233710c4.png`

## 待判断、答错重选、答对继续

对应：[01-decision-loop.png](01-decision-loop.png)。

```text
Use case: ui-mockup / product prototype storyboard.
Edit the attached Buchikui paper-card concept into a coherent high-fidelity STATIC FLOW REVIEW BOARD for that SAME product. This is expansion of one working visual system, not alternative design directions. Use the attached image as visual/brand reference, replace its text and layout with the exact new requirements below. Preserve warm paper #f7f5ef, warm-white card #fffdfa, near-black #161616, muted #6b665d, restrained deep-red #9d201f; Chinese Songti-style serif for main action and wordmark, system sans-serif for readable scene/feedback and UI, at most two families.
Each requested mobile screen is 390 x 844 logical pixels, app content only. Arrange mobile screens left-to-right with a clean small gutter and tiny review labels OUTSIDE the app artboards. Render at high resolution approximately twice logical board size so Chinese remains legible when zoomed. No device body, browser chrome, notch, OS status bar, home indicator, phone shadow or rounded hardware mask. This is one consistent flow board with multiple STATES, not multiple concepts.
Screen header: wordmark "不吃亏", small brand line "不花钱，也能买到教训。", right text "资料库". One current paper card with at most one subtle blank offset edge behind, discreet corners, minimal shadow. Remove old redundant labels "现实场景" / "我的做法". Scene is comfortably readable 17-19px, one proposed action is 24-27px, feedback 15-16px, small contextual stage 13px. No crammed layout; retain generous but purposeful whitespace.
Fixed interaction: left means "不会这样做", right means "会这样做". Both buttons equal size, identical neutral light fill, identical black outline and text before and after wrong answers. Neither left nor right implies correctness by color. Only AFTER a correct answer do they change to one "继续" button. Wrong answers explain immediately on the SAME card and permit retry; no Continue, Skip, Next, close or read-more-explanation button in wrong state. Correct answers show the correct action, reason, visible applicability boundary, source link, then user-triggered Continue.
No progress bar, question numbers, lives, score, streak, leaderboard, achievement, countdown, login, tab bar, dashboard or chatbot. No horror/panic styling, invented monetary losses, official-looking seals, legal guarantees or fabricated sources. Current date anchor 2026-10-23; do not invent dates.
The two judgement buttons are below the card; quiet secondary links "查看依据" and "这题有问题" can sit below them. Feedback is integrated in the same card using a fine rule, not a modal, extra nested cards or full-screen error. ALL exact text below must be rendered accurately, especially negative/positive meaning. Do not add explanations outside the specified copy.
BOARD: the single representative decision and its immediate teaching loop. Three mobile screens side-by-side in order, review captions above artboards "待判断", "答错，原题重选", "答对，解锁继续". Target board approximately 1218 x 890 logical pixels, high resolution.
Use consistent card position and frame styling across all three. All stages say "租车的一天 · 付款前".
Scene in all screens: "你在大平台订车。门店只报品牌名，实际出租方信息还没给，就催你：“先付钱，马上拿车。”"
UNANSWERED screen: Proposed action "我先付款，出租方信息提车后再问。" in large black type. Left judgement button "不会这样做"; right "会这样做"; first-use hint "左滑不会，右滑会". No answer, reason, boundary, Continue or red correctness indicator. Auxiliary source/issue links remain quiet.
WRONG screen: user chose RIGHT, but this is wrong. Keep full original scene and the proposed action so the person knows what was judged. Add short header "为什么" and integrated explanation: "这一步容易把品牌当成实际出租方。先拿到出租方的名称、地址和联系方式，再与合同对照，才知道由谁提供租赁服务。" Visible boundary in smaller legible text: "品牌不同不等于欺诈；平台责任仍看其实际角色。" Two equal neutral judgement buttons still present for retry. Small hint "看完解释，再选一次". NO Continue, Skip, Next or separate retry-confirmation button.
CORRECT screen: user then chose LEFT, which is correct. Show simple deep-red text "正解 · 不会这样做". Full scene can be slightly smaller but still readable. The dominant large sentence must now be the CORRECT ACTION "先认清实际出租方，再付款。" NOT the wrong proposed action. Brief reason "品牌入口和实际服务方可能不同。" Visible boundary "品牌不同不等于欺诈；平台责任仍看其实际角色。" Quiet source text "依据：消保条例第十三条" with "查看依据". Only one full-width main button "继续"; no judgement buttons in the correct state. Footer issue link quiet.
The point is clear SAME-CARD continuity and the exact rule that wrong explains, retry stays, right unlocks. Preserve readability; if spacing is tight, reduce decorative whitespace and headings, never remove scene, boundary or core controls.
```

## 下一张、经历结束、朋友打开

对应：[02-continuation-sharing.png](02-continuation-sharing.png)。

```text
Use case: ui-mockup / product prototype storyboard.
Edit the attached Buchikui paper-card concept into a coherent high-fidelity STATIC FLOW REVIEW BOARD for that SAME product. This is expansion of one working visual system, not alternative design directions. Use the attached image as visual/brand reference, replace its text and layout with the exact new requirements below. Preserve warm paper #f7f5ef, warm-white card #fffdfa, near-black #161616, muted #6b665d, restrained deep-red #9d201f; Chinese Songti-style serif for main action and wordmark, system sans-serif for readable scene/feedback and UI, at most two families.
Each requested mobile screen is 390 x 844 logical pixels, app content only. Arrange mobile screens left-to-right with a clean small gutter and tiny review labels OUTSIDE the app artboards. Render at high resolution approximately twice logical board size so Chinese remains legible when zoomed. No device body, browser chrome, notch, OS status bar, home indicator, phone shadow or rounded hardware mask. This is one consistent flow board with multiple STATES, not multiple concepts.
Screen header: wordmark "不吃亏", small brand line "不花钱，也能买到教训。", right text "资料库". One current paper card with at most one subtle blank offset edge behind, discreet corners, minimal shadow. Remove old redundant labels "现实场景" / "我的做法". Scene is comfortably readable 17-19px, one proposed action is 24-27px, feedback 15-16px, small contextual stage 13px. No crammed layout; retain generous but purposeful whitespace.
Fixed interaction: left means "不会这样做", right means "会这样做". Both buttons equal size, identical neutral light fill, identical black outline and text before and after wrong answers. Neither left nor right implies correctness by color. Only AFTER a correct answer do they change to one "继续" button. Wrong answers explain immediately on the SAME card and permit retry; no Continue, Skip, Next, close or read-more-explanation button in wrong state. Correct answers show the correct action, reason, visible applicability boundary, source link, then user-triggered Continue.
No progress bar, question numbers, lives, score, streak, leaderboard, achievement, countdown, login, tab bar, dashboard or chatbot. No horror/panic styling, invented monetary losses, official-looking seals, legal guarantees or fabricated sources. Current date anchor 2026-10-23; do not invent dates.
The two judgement buttons are below the card; quiet secondary links "查看依据" and "这题有问题" can sit below them. Feedback is integrated in the same card using a fine rule, not a modal, extra nested cards or full-screen error. ALL exact text below must be rendered accurately, especially negative/positive meaning. Do not add explanations outside the specified copy.
BOARD: continuing the same rental story, resting at its ending, and a friend opening a shared question. Three mobile screens left-to-right, outside review labels "继续，进入下一张", "这一段结束", "朋友打开邀请". Board approximately 1218 x 890 logical pixels, render high resolution. Match the styling and sizing of the attached three-state board, but create these three new screens; NOT alternative looks.

LEFT: next question, UNANSWERED.
Stage "租车的一天 · 交押金前".
Scene: "交押金时，店员只说“还车就退”，没有退还说明。后面的人正催着你快点。"
Dominant proposed action: "我现在问清退还方式、流程和时限。"
Two equal NEUTRAL buttons "不会这样做" and "会这样做". Tiny hint "左滑不会，右滑会". Quiet links "查看依据" and "这题有问题". Do not reveal answer; the correct choice happens to be right on this new question, but do NOT visually signal that.

MIDDLE: end of the completed rental experience, NOT a reward/score screen.
Same brand/header and one calm paper card. Small context "租车的一天".
Main headline "这趟租车，先到这里。"
Supporting text "谁来履约、开什么车、押金怎么退、申诉找谁——需要时还可以回来查。"
A small thin-rule-separated closing line "教训先学到，依据随时查。" may serve as human editorial tone.
No judgement buttons. One full-width neutral outlined main button "再遇一件事". Below it, separate restrained text links "读租车这一章" and "把情境发给朋友". Avoid badges, crowns, trophies, points, percentages, mastery claims or congratulations.

RIGHT: friend opens an invitation link directly to the UNANSWERED original question, with the same card layout as normal.
Header wordmark "不吃亏", small brand line "不花钱，也能买到教训。", right "资料库".
A tiny contextual line "朋友给你出了一道情境" above or just outside the card, not an onboarding screen.
Stage "租车的一天 · 付款前".
Scene: "你在大平台订车。门店只报品牌名，实际出租方信息还没给，就催你：“先付钱，马上拿车。”"
Proposed action: "我先付款，出租方信息提车后再问。"
Two equal neutral buttons "不会这样做" and "会这样做". No sender name/photo, sender answer, sender result, spoiler, social counter, login or extra Start button. The recipient can immediately choose.
Maintain sensible wrapping with generous side padding; do not let ANY sentence spill across its card edge or screen gutter.
```

## 资料库、规则定位、搜索无结果

对应：[03-library-return.png](03-library-return.png)。

```text
Use case: ui-mockup / product prototype storyboard.
Edit the attached Buchikui paper-card concept into a coherent high-fidelity STATIC FLOW REVIEW BOARD for that SAME product. This is expansion of one working visual system, not alternative design directions. Use the attached image as visual/brand reference, replace its text and layout with the exact new requirements below. Preserve warm paper #f7f5ef, warm-white card #fffdfa, near-black #161616, muted #6b665d, restrained deep-red #9d201f; Chinese Songti-style serif for main action and wordmark, system sans-serif for readable scene/feedback and UI, at most two families.
Each requested mobile screen is 390 x 844 logical pixels, app content only. Arrange mobile screens left-to-right with a clean small gutter and tiny review labels OUTSIDE the app artboards. Render at high resolution approximately twice logical board size so Chinese remains legible when zoomed. No device body, browser chrome, notch, OS status bar, home indicator, phone shadow or rounded hardware mask. This is one consistent flow board with multiple STATES, not multiple concepts.
Screen header: wordmark "不吃亏", small brand line "不花钱，也能买到教训。", right text "资料库". One current paper card with at most one subtle blank offset edge behind, discreet corners, minimal shadow. Remove old redundant labels "现实场景" / "我的做法". Scene is comfortably readable 17-19px, one proposed action is 24-27px, feedback 15-16px, small contextual stage 13px. No crammed layout; retain generous but purposeful whitespace.
Fixed interaction: left means "不会这样做", right means "会这样做". Both buttons equal size, identical neutral light fill, identical black outline and text before and after wrong answers. Neither left nor right implies correctness by color. Only AFTER a correct answer do they change to one "继续" button. Wrong answers explain immediately on the SAME card and permit retry; no Continue, Skip, Next, close or read-more-explanation button in wrong state. Correct answers show the correct action, reason, visible applicability boundary, source link, then user-triggered Continue.
No progress bar, question numbers, lives, score, streak, leaderboard, achievement, countdown, login, tab bar, dashboard or chatbot. No horror/panic styling, invented monetary losses, official-looking seals, legal guarantees or fabricated sources. Current date anchor 2026-10-23; do not invent dates.
The two judgement buttons are below the card; quiet secondary links "查看依据" and "这题有问题" can sit below them. Feedback is integrated in the same card using a fine rule, not a modal, extra nested cards or full-screen error. ALL exact text below must be rendered accurately, especially negative/positive meaning. Do not add explanations outside the specified copy.
BOARD: the reading-and-return part of the SAME prototype. Three mobile artboards left-to-right, outside review captions "资料库", "查看依据，回到原题", "搜索无结果". Target board approximately 1218 x 890 logical pixels, high resolution. Match the attached flow board's restrained warm paper style. These are grouped editorial lists and readable article surfaces, NOT a game deck on every page. Use hierarchy, whitespace and fine rules; no separate box for every row.

LEFT: LIBRARY.
Header has a text back link "返回当前情境" and small wordmark "不吃亏". Title "资料库". Search input with label/placeholder "租车、办卡、维修……".
A book-like contents heading "把钱要回来", below it simple rows with fine separators, no tiles:
"第一章 · 租车" / subtitle "实际出租方是谁，押金怎么退？"
"第二章 · 信用免押" / subtitle "付款授权与信用卡预授权"
"第三章 · 预付消费" / subtitle "美容美发卡能不能退？"
"第四章 · 银行账户收费" / subtitle "唯一账户也被扣管理费？"
"第五章 · 银行理财" / subtitle "亏损与销售责任怎么区分？"
At the lower edge the next contents group heading "平台与商家" may begin if space permits. No law-type chip wall, filters, counts, recommender or progress.

MIDDLE: EXISTING RENTAL CHAPTER opened at the rule relevant to the current card, not a second legal registry.
Header back link "返回当前情境". Small context "第一章 · 租车".
Main headline "付款前，先认清实际出租方。"
An unboxed rule section distinguished with fine rules:
label "权威依据"
metadata "行政法规 · 国务院"
document "消费者权益保护法实施条例"
article "第十三条"
plain summary: "网络服务应说明真实经营者。由其他经营者实际提供服务的，还应提供其名称、经营地址和联系方式。"
metadata "核验 2026-08-29" (this is the actual stored source verification date; do not change to today).
Text link "打开官方原文".
Then a separate editorial translation section labeled "放到这件事里":
"先把实际出租方与合同对上，再决定付款。"
Boundary label "适用边界" and text "品牌不同不等于欺诈；平台责任仍看其实际角色。"
One clear bottom link/button "返回当前情境". No quiz controls and no mark saying reading the source unlocks the next question. All text must wrap within generous margins; no huge legal title or tiny unreadable footnotes.

RIGHT: LIBRARY SEARCH EMPTY STATE.
Same header back link "返回当前情境" and small wordmark "不吃亏". Title "资料库".
Search input retains exact query "空气炸锅延保", with a subtle clear affordance if desired.
Central text "暂时没有匹配的主题"
Supporting text "换个关键词试试，也可以回到目录。"
One neutral outlined button "清空搜索".
Leave calm whitespace; no fake results, AI suggestions, chatbot, error-code panel or invitation to submit feedback. Returning must be visibly available in header.
All three are app-content views only, no browser/device frames or OS bars.
```

## 桌面单张情境卡

对应：[04-desktop.png](04-desktop.png)。

```text
Use case: ui-mockup.
Create ONE high fidelity desktop web app screen for the Chinese consumer-literacy product 不吃亏. Reference the attached three mobile states as the ONLY visual direction and use the LEFT unanswered state as the exact content/state reference. This is a desktop adaptation of that same working prototype, not another design alternative or a new homepage.
Desktop APP CONTENT ONLY, 1440 x 1024 logical aspect ratio, high resolution. No browser frame, phone, device mockup, perspective, desk, external presentation title or comparison layout.
Visual identity: warm paper #f7f5ef, near-white card #fffdfa, ink #161616, muted gray #6b665d, restrained dark red #9d201f. Clean modern Chinese Songti-style serif on brand and principal proposed action, readable sans-serif UI/body. Match the tactile paper/card outline and small blank offset paper edge in the reference. Flat, restrained, generous whitespace, no ornate texture.
Top: minimal app header with brand 不吃亏, small value line 不花钱，也能买到教训。 and a quiet text link 资料库 on the right, thin bottom rule. Keep header content in a sensible centered max-width area.
Main screen: exactly ONE centered playable card, about 440 logical px wide, with enough vertical room for scene/action and two comfortable neutral decision buttons below. Stage above the card: 租车的一天 · 付款前. The screen must remain calm and focused. Do not expand the surrounding space into a dashboard, sidebars, grids, topic lists, explanatory panels or a marketing hero. No duplicate page title.
Exact factual scene inside card: 你在大平台订车。门店只报品牌名，实际出租方信息还没给，就催你：“先付钱，马上拿车。”
Exact proposed action, visually dominant but natural Chinese line breaks: 我先付款，出租方信息提车后再问。
Small prompt below proposed action: 你会这样做吗？
The scene is distinct from the proposed action by type hierarchy and whitespace, NOT nested boxes or extra section labels.
Below: equal width, equal weight neutral light paper buttons, left 不会这样做, right 会这样做. Full labels fit single lines. Both have identical dark outline and black text. No red or green answer button, no checkmarks, crosses or hearts. Right does not mean correct. This state is UNANSWERED: no correct answer, why, error, red marked answer or Continue.
One quiet keyboard hint: ← 不会 / → 会. The keys work only when the card is focused, do not imply global shortcuts. Footer text links 查看依据 and 这题有问题 are unobtrusive and comfortably spaced.
Brand red can mark a tiny rule or header accent, never imply an unanswered choice is right.
No scores, lives, counters, progress bars, levels, achievements, badges, timer, login, chat, AI helper, illustrations, confetti, search box on the game screen, extra navigation tabs or fabricated authority quotes. No card numbering.
This is a STATIC DESIGN image. Do not print implementation notes, measurements, route paths or state labels into the product UI. Body text equivalent to 17–19 logical px, proposed action around 28px, controls at least 44px tall. Preserve all exact Chinese content, no clipped characters. The user should instantly understand that one concrete action is being judged.
```

## 左拖、右拖、缩回取消

对应：[05-gesture-preview.png](05-gesture-preview.png)。

```text
Use case: ui-mockup, motion storyboard.
Make a THREE-FRAME mobile product storyboard of the SAME unanswered Buchikui card, matching the attached design's LEFT unanswered screen exactly in paper, ink, brand, typography, controls, and scenario/action content. These are motion states of ONE working prototype, not visual alternatives. Each frame is a 390 x 844 logical app viewport, arranged left to right with small quiet OUTSIDE captions and narrow gaps on a light presentation sheet. No phone hardware, OS bars, browser frames or device bezels.
Outside captions only, one per viewport: 左拖预览 / 右拖预览 / 缩回，取消选择.
Same in-app header in all frames: 不吃亏, small 不花钱，也能买到教训。, quiet 资料库. A single tactile off-white paper card with subtle blank offset deck edges, nearly black text, restrained deep red #9d201f; warm paper canvas #f7f5ef. Main action Chinese serif; readable body and controls.
Exact content in each card: stage 租车的一天 · 付款前. Factual scene 你在大平台订车。门店只报品牌名，实际出租方信息还没给，就催你：“先付钱，马上拿车。” Proposed action 我先付款，出租方信息提车后再问。
Frame 1: current card follows a leftward horizontal drag, modest visible displacement and slight counter-clockwise rotation (3–4 degrees), clear neutral preview word 不会这样做 on the card. This is a PREVIEW of the USER'S CHOICE; it does NOT say 正确, 错误, 正解 or reveal which answer is right.
Frame 2: same card follows a rightward drag, symmetric displacement and slight clockwise rotation, preview word 会这样做 with EXACTLY SAME visual weight and SAME neutral ink color as frame 1. No green, red/correct difference, checkmarks, X, hearts or success cues. Right is not predetermined to mean correct.
Frame 3: same card returned to its centered resting position after pulling back before releasing; no choice-preview label and no result. A tiny quiet in-app hint can read 缩回即可取消. It is still unanswered and can be judged again.
Keep main text readable in each state; use a modest shift so most of card remains visible, clip moving paper INSIDE the viewport rather than expanding the page. Do not illustrate multiple visible cards with readable content, do not draw giant arrows or fingers over the text, do not show previous/next question.
In every frame, the anchored two equal neutral decision buttons remain below the card: 不会这样做 on the left, 会这样做 on the right. Identical border, identical light fill, identical black labels. Footer links 查看依据 and 这题有问题. Do not add a Continue button, correctness feedback, penalty, timer, counters, points, lives, progress, achievements, skip, restart, modal, chat, dashboard or a new navigation step.
The interaction is commit-on-release only when threshold and horizontal intention are met; returning before release cancels without judging. Show the visual preview/cancel states, but do NOT print pixels, threshold numbers, implementation notes or an instruction essay into the product UI. Keep captions OUTSIDE the app, no explanatory panels.
Use crisp Chinese lettering, comfortable minimum mobile body sizes, no clipped glyphs. Preserve calm editorial paper identity and just enough tactile movement to communicate play.
```

