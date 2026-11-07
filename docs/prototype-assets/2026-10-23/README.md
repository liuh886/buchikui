# 三张卡面草图的生成记录

日期：2026-10-23。使用内置 ImageGen，以现有手机首页截图作为品牌参考；没有使用 CLI 或 API key。

这些是原型探索图，不是站点页面。编号按本轮实际展示顺序记为 1、2、3。全部输出为 390×844 比例的高分辨率参考，尺寸以图像元数据为准，不代表已经通过真实浏览器布局验证。

用户继续授权设计后，第二轮沿第一张纸牌结构扩展了完整静态流程工作稿，见[流程评审](../../prototype-flow-review.md)及[生成记录](flow/README.md)。这是设计推进，不代表用户已选择最终视觉；首轮图片中的旧题面以最新设计稿为准。

## 共享参考

- 当前品牌截图：2026-10-22 检查中的手机首页；主色与字体由 docs/design-system.md 确认。
- 三张原始生成图保留在 Codex generated_images 默认目录；本目录保存设计参考副本。
- 第 1 张有非关键辅助标签“现车场景”的生成文字误差，选定后应改为“现实场景”。
- 第 2 张的右侧按钮带红色填充，且有额外“对话现场”标题。它们是待修正的草图偏差：最终未答题的两个方向必须等权，原型界面不出现方案名称。
- 第 3 张先展示行动再展示事实；是否会让读者过早决策，需要在选定方向后的完整状态原型中检查。

## 展示 1

对应图片：[01-card.png](01-card.png)。

```text
Use case: ui-mockup.
Edit the attached current Buchikui mobile screenshot into a focused, production-quality NEW PROTOTYPE CARD SCREEN for the same existing product. Treat the input as brand/typography/color reference, not a layout to copy: replace the long document/search homepage with the requested swipe card screen. Preserve warm paper #f7f5ef, slightly lighter card #fffdfa, near-black #161616, muted #6b665d, restrained dark red #9d201f. Chinese Songti-style serif headlines and legible system sans-serif UI, at most two families.
Target dimensions: mobile web APP CONTENT ONLY, 390 x 844 logical viewport, match its natural narrow aspect ratio, the entire design fits inside this viewport. NO phone hardware, notch, OS status or navigation bar, browser frame, scrollbar, device bezel, exterior margins or comparison board. One independent screen only, not a montage. Clear Chinese characters.
The product is a consumer legal-literacy decision guide with a Tinder-like survival-choice rhythm: exactly one current scenario and one action to judge. Fixed semantics: LEFT means "不会这样做"; RIGHT means "会这样做". Both are equally legitimate neutral choices before a result. Do not make the right option look correct or put checkmarks/crosses/hearts on the front. Wrong answers will later show an explanation and require retry on the same card; only correct answers unlock Continue, but this frame is UNANSWERED. Thus no Continue button, no answer, no correct/wrong banner on this frame.
Keep very few controls: top left brand "不吃亏", top right text link "资料库". Main stage line "租车的一天 · 下单前". One scenario and one proposed action. Under the main card, two equal-width tactile rounded or squared buttons, left "不会这样做", right "会这样做"; tiny text "左滑不会，右滑会" as first-use guidance. One secondary text link "查看依据". Leave natural breathing room and tap targets at least 44px.
Exact scenario text: "平台挂着熟悉的大品牌，合同出租方却是另一家公司。"
Exact proposed action text: "我只认平台品牌，不再核对实际出租方。"
Question label: "你会这样做吗？"
The proposed action is a statement to be evaluated, not advice endorsed by the product. Do not add legal conclusions, fabricated sources, dates, claims, rewards or functionality. Current date anchor is 2026-10-23 if needed, but prefer no dates on this unanswered screen.
No points, hearts/lives, progress bars, levels, numbered questions, streaks, badges, rankings, login, tab bar, topic filters, chatbot, fake AI widget, confetti or dashboard. No nested cards or unrelated content areas. A contained single swipeable playing card is explicitly requested, so one dominant paper card and at most two faint unreadable offset paper edges behind it are appropriate.
Design hierarchy should privilege scenario/action and easy thumb decisions. Body text at least 15-16 logical px, main action 24-30 logical px with generous leading. Avoid crowding, clipped characters, tiny legal text, gradients, neon, generic fintech UI and excessive shadows. Produce a polished realistic high-fidelity product screen, not a wireframe diagram.
Direction name: 纸牌案卷.
Use a bold editorial paper-card composition: a large movable warm-white card centered with small offset blank card edges behind; thin charcoal rules and very restrained shadow make it a tactile deck. The current stage appears outside above the deck. Within the card, give the factual scenario a readable two/three-line introduction near the top, then generous empty space leading into the larger proposed action in Chinese serif type, then the short question. A thin dark-red small heading accent can supply the brand signature, but no correctness cue. Paper should feel modern, calm and playable rather than antiquated. Bottom decision buttons are neutral outlined rounded rectangles with full Chinese labels. Main difference is tactile card/deck hierarchy; no dialogue bubbles or illustration.
```

## 展示 2

对应图片：[02-card.png](02-card.png)。

```text
Use case: ui-mockup.
Edit the attached current Buchikui mobile screenshot into a focused, production-quality NEW PROTOTYPE CARD SCREEN for the same existing product. Treat the input as brand/typography/color reference, not a layout to copy: replace the long document/search homepage with the requested swipe card screen. Preserve warm paper #f7f5ef, slightly lighter card #fffdfa, near-black #161616, muted #6b665d, restrained dark red #9d201f. Chinese Songti-style serif headlines and legible system sans-serif UI, at most two families.
Target dimensions: mobile web APP CONTENT ONLY, 390 x 844 logical viewport, match its natural narrow aspect ratio, the entire design fits inside this viewport. NO phone hardware, notch, OS status or navigation bar, browser frame, scrollbar, device bezel, exterior margins or comparison board. One independent screen only, not a montage. Clear Chinese characters.
The product is a consumer legal-literacy decision guide with a Tinder-like survival-choice rhythm: exactly one current scenario and one action to judge. Fixed semantics: LEFT means "不会这样做"; RIGHT means "会这样做". Both are equally legitimate neutral choices before a result. Do not make the right option look correct or put checkmarks/crosses/hearts on the front. Wrong answers will later show an explanation and require retry on the same card; only correct answers unlock Continue, but this frame is UNANSWERED. Thus no Continue button, no answer, no correct/wrong banner on this frame.
Keep very few controls: top left brand "不吃亏", top right text link "资料库". Main stage line "租车的一天 · 下单前". One scenario and one proposed action. Under the main card, two equal-width tactile rounded or squared buttons, left "不会这样做", right "会这样做"; tiny text "左滑不会，右滑会" as first-use guidance. One secondary text link "查看依据". Leave natural breathing room and tap targets at least 44px.
Exact scenario text: "平台挂着熟悉的大品牌，合同出租方却是另一家公司。"
Exact proposed action text: "我只认平台品牌，不再核对实际出租方。"
Question label: "你会这样做吗？"
The proposed action is a statement to be evaluated, not advice endorsed by the product. Do not add legal conclusions, fabricated sources, dates, claims, rewards or functionality. Current date anchor is 2026-10-23 if needed, but prefer no dates on this unanswered screen.
No points, hearts/lives, progress bars, levels, numbered questions, streaks, badges, rankings, login, tab bar, topic filters, chatbot, fake AI widget, confetti or dashboard. No nested cards or unrelated content areas. A contained single swipeable playing card is explicitly requested, so one dominant paper card and at most two faint unreadable offset paper edges behind it are appropriate.
Design hierarchy should privilege scenario/action and easy thumb decisions. Body text at least 15-16 logical px, main action 24-30 logical px with generous leading. Avoid crowding, clipped characters, tiny legal text, gradients, neon, generic fintech UI and excessive shadows. Produce a polished realistic high-fidelity product screen, not a wireframe diagram.
Direction name: 对话现场.
Within the same Buchikui visual identity, compose the single draggable card as an immediate scene-and-decision dialogue, rather than a formal document. Use a compact thin top header, a quiet stage label, a generous central paper panel with strongly typographic quotation marks or a softly rounded speech-like silhouette for the ONE proposed action, integrated into that same panel without nested cards. The full factual scenario remains plainly readable above it. Label the scenario "眼前的情况" and the proposed action "我的决定". Make the proposed-action statement the emotional focal point as an internal voice, not a merchant promise. More intimate generous whitespace and rounder tactile geometry than a book page; the two neutral decision controls form a tight horizontal pair directly below the card. Do not add people, chat history, chat input, avatars, speech threads or extra actions. A tiny dog-ear or paper curl may suggest touch, but the UI remains clean flat product design. Correctness must be completely hidden. Preserve every exact main text from the brief, especially "合同出租方却是另一家公司" and "不再核对实际出租方".
```

## 展示 3

对应图片：[03-card.png](03-card.png)。

```text
Use case: ui-mockup.
Edit the attached current Buchikui mobile screenshot into a focused, production-quality NEW PROTOTYPE CARD SCREEN for the same existing product. Treat the input as brand/typography/color reference, not a layout to copy: replace the long document/search homepage with the requested swipe card screen. Preserve warm paper #f7f5ef, slightly lighter card #fffdfa, near-black #161616, muted #6b665d, restrained dark red #9d201f. Chinese Songti-style serif headlines and legible system sans-serif UI, at most two families.
Target dimensions: mobile web APP CONTENT ONLY, 390 x 844 logical viewport, match its natural narrow aspect ratio, the entire design fits inside this viewport. NO phone hardware, notch, OS status or navigation bar, browser frame, scrollbar, device bezel, exterior margins or comparison board. One independent screen only, not a montage. Clear Chinese characters.
The product is a consumer legal-literacy decision guide with a Tinder-like survival-choice rhythm: exactly one current scenario and one action to judge. Fixed semantics: LEFT means "不会这样做"; RIGHT means "会这样做". Both are equally legitimate neutral choices before a result. Do not make the right option look correct or put checkmarks/crosses/hearts on the front. Wrong answers will later show an explanation and require retry on the same card; only correct answers unlock Continue, but this frame is UNANSWERED. Thus no Continue button, no answer, no correct/wrong banner on this frame.
Keep very few controls: top left brand "不吃亏", top right text link "资料库". Main stage line "租车的一天 · 下单前". One scenario and one proposed action. Under the main card, two equal-width tactile rounded or squared buttons, left "不会这样做", right "会这样做"; tiny text "左滑不会，右滑会" as first-use guidance. One secondary text link "查看依据". Leave natural breathing room and tap targets at least 44px.
Exact scenario text: "平台挂着熟悉的大品牌，合同出租方却是另一家公司。"
Exact proposed action text: "我只认平台品牌，不再核对实际出租方。"
Question label: "你会这样做吗？"
The proposed action is a statement to be evaluated, not advice endorsed by the product. Do not add legal conclusions, fabricated sources, dates, claims, rewards or functionality. Current date anchor is 2026-10-23 if needed, but prefer no dates on this unanswered screen.
No points, hearts/lives, progress bars, levels, numbered questions, streaks, badges, rankings, login, tab bar, topic filters, chatbot, fake AI widget, confetti or dashboard. No nested cards or unrelated content areas. A contained single swipeable playing card is explicitly requested, so one dominant paper card and at most two faint unreadable offset paper edges behind it are appropriate.
Design hierarchy should privilege scenario/action and easy thumb decisions. Body text at least 15-16 logical px, main action 24-30 logical px with generous leading. Avoid crowding, clipped characters, tiny legal text, gradients, neon, generic fintech UI and excessive shadows. Produce a polished realistic high-fidelity product screen, not a wireframe diagram.
Direction name: 行动签.
Make the main draggable card feel like a crisp, contemporary printed decision ticket, with near-square subtle corners, a fine dark border, an understated deep-red top rule and one restrained offset blank paper behind it. Change the hierarchy significantly: the proposed action is the dominant large serif text in the upper-middle of the ticket, labeled "你打算这样做"; the full factual scenario is in a clearly readable secondary section lower on the same ticket labeled "事情是这样的". Keep each section part of one continuous paper surface using space and a single hairline divider, NOT boxes inside the card. The short question "你会这样做吗？" can sit just below the action with lots of breathing room. Header contains only brand and 资料库; stage appears as a narrow context line above the ticket. Do NOT print the direction name as a UI heading. A very subtle cut-paper ticket edge may be used, no decorative stamps or pseudo-official seals.
Crucial: BOTH bottom decision buttons MUST have exactly equal visual weight, identical light paper fill, identical dark border and black text. Neither button is filled red, green, pink or any saturated color. No color implying right is correct. Dark-red is reserved for a thin brand/detail line, not an answer. Two full labels "不会这样做" and "会这样做" must fit comfortably without wrapping. Do not add a chat bubble, icon inside a circle, illustration, score, topic list, or more navigation.
```

