# 第二轮实机、读屏与异常路径验收矩阵 (Acceptance Matrix)

日期：2026-10-24 · 状态：模拟器与自动化全量通过；真机与辅助技术分栏待执行  
依据：[第二轮工作计划](iteration-2-plan.md)、[发布验收规范](../../docs/release-acceptance.md)、[交付记录](delivery.md)。

---

## 1. 验收标准与测试分栏原则

为了杜绝“以模拟器截图冒充真实设备与读屏验收”的工程弊端，本轮验收严格执行**双栏分离原则**：
1. **自动化与模拟器测试栏**：记录 Headless Chromium / Edge、Node 单元测试与 Playwright 自动化脚本已确证的技术证据；
2. **真机与读屏人工验收栏**：明确列出真实设备、操作系统、浏览器版本及辅助技术测试项目；未在真实硬件上实测的条目，如实标记为“待执行”，不隐瞒，不预打勾。

---

## 2. 详细验收矩阵

| 序号 | 验证维度 | 具体验证项 | 自动化/模拟器验证结果 | 真实设备/真机验证结果 | 证据产物与复现方式 |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **01** | **短屏与视口适配** | 390×666（短屏）、320×640（窄屏）下，首题及最长题（Q6）YES/NO完整语义与说明可见，跳过可达，触控目标 $\ge 44\text{px}$，无横向溢出 | **通过**<br>Playwright实测：390×666下按钮底部为567.4px（远远低于666px折线），触控尺寸 $68\times 68\text{px}$，`scrollWidth <= innerWidth` | **待执行**<br>待在真实 iPhone SE / 小型 Android 机型上手势验证 | `tests/verify_iteration_2_ui.py`<br>`short_screen_390x666: passed` |
| **02** | **结果首屏收益** | 结果首屏同时展示可爱形象、经历特征短句与具体案例提醒（★ 记住这条提醒 / 提前了解一条经验）及案例解析入口，无需滚动即可见；留角色卡作为次行动紧随其后 | **通过**<br>Playwright实测：390×844首屏教训底部为612.7px，390×666教训卡位于371～517px，一屏内完全展示 | **待执行**<br>真实手机 Safari / Chrome 首屏直观感知待确认 | `tests/verify_iteration_2_ui.py`<br>`result_screen_takeaway: passed` |
| **03** | **主画像与推荐对齐** | 第一则案例严格对齐主画像的有效YES证据；第二则兼顾另一YES或跨场景；保留并验证 `NO/YES/YES/NO/NO/YES/YES/YES` 复现用例 | **通过**<br>单元测试与浏览器实测通过；复现用例第一则精准命中主画像勾选证据案例，杜绝错位 | **通过（功能逻辑）**<br>纯函数与前端状态一致，无运行时随机偏差 | `tests/portrait.test.mjs`<br>`PM评估复现用例验证: passed` |
| **04** | **短读改写重审门禁** | 短读内容（situation/outcome/boundary/notice）改动立刻改变 SHA-256 指纹，未审核即构建失败回滚；审核元数据留痕 | **通过**<br>单元测试覆盖文本改写拦截、来源变更拦截与指纹一致性 | **不适用（纯代码/工程门禁）** | `tests/portrait-content.test.mjs`<br>88/88 测试全部通过 |
| **05** | **真机触摸与滑动** | 左右滑卡触发有过/没有过；小幅度横拖释放取消；滑动中纵向滚动不误判为选答案；刷新保持状态；案例解析打开与返回 | **模拟通过**<br>Playwright 模拟 pointerdown / pointerup / drag 取消与提交通过 | **待执行**<br>真实 iPhone Safari (iOS 17+) 及真实 Android (Chrome 120+) 实测 | `tests/portrait_browser.py` |
| **06** | **辅助技术与读屏** | VoiceOver / TalkBack 能按顺序朗读题号、题干前缀“你是否遭遇过”、选项“YES 有过 / NO 没有过”、首屏核心提醒、案例解析对话框焦点捕获与 Escape 释放 | **模拟语义通过**<br>ARIA 属性、aria-live、dialog showModal 与 role 语义结构完整 | **待执行**<br>真实开启 VoiceOver（iOS）和 TalkBack（Android）逐题手势划选待确认 | 待真机读屏实测 |
| **07** | **系统大字与缩放** | 200% CSS zoom 或系统辅助功能放大字号下，文本自然折行纵向展开，无截断，无横向不可挽回的溢出 | **模拟通过**<br>Playwright 200% zoom 实测无 overflow，生成 `result-200-percent.png` | **待执行**<br>真实 iOS“大字号文本”和 Android“字体大小/显示大小”实测 | `result-200-percent.png` |
| **08** | **离线与弱网表现** | PWA 预缓存完整生效；断网（离线）后刷新页面仍可浏览问卷、展示角色插画与本地保存的完整结果；本地回答排队恢复 | **模拟通过**<br>Playwright context.set_offline(True) 刷新页面完整呈现角色与案例 | **待执行**<br>真机飞行模式下 Safari / PWA 离线实测 | `tests/portrait_browser.py`<br>`offline: True` |
| **09** | **角色卡分享与隐私** | 点击“留一张角色卡”弹出预览；下载 PNG 图像；图像仅含公共角色名称与链接，不包含答卷具体选择、损失或个人ID；拒绝剪贴板时后备复制输入框可用 | **模拟通过**<br>Canvas 导出 1080×1920 高清角色卡通过；PNG 写入 `otter-share.png`，不含答卷隐私 | **待执行**<br>真实 iOS / Android 系统原生分享面板调用与取消实测 | `docs/prototype-assets/2026-10-24/implementation/otter-share.png` |
| **10** | **一手出处外链可达** | 湖南文旅厅行政处罚通报、最高法典型案例等原始出处在现代浏览器中均能正常打开 | **通过**<br>Edge 实际打开3份出处网页均返回 HTTP 200，记录于 `source-links-browser.json` | **通过**<br>浏览器真实网络访问通过 | `source-links-browser.json` |

---

## 3. 验收结论与进入下一阶段条件

1. **G2 核心体验与工程交付**：**达成（Passed）**。
   - 所有已知代码缺陷（F02推荐错位、F03短屏裁切、F04首屏缺少教训、F06短读重审门禁）均已完成工程修复并有自动化/真实浏览器证据。
   - 88 项单元测试、前端契约检查、静态构建与 4 组 Playwright 视口端到端测试均 100% 绿灯。
2. **G3 用户与实机验证**：**待真实验收（Pending Real Devices & Participants）**。
   - 依据工程守则，不以本地全绿冒充真实设备与受访者签收；
   - 待硬件与受访者就绪后，直接在 `iteration-2-user-validation.md` 和本文档中回填真机证据。
