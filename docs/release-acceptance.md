# Game-first 每日五关与案例库：发布与人工验收清单

> 更新：2026-11-15 · 当前状态：G1–G5 及 G6 轻入口已完成系统重构与内容核验（含 3 NO + 2 YES 首期 5 关），所有自动化测试与无头 Edge 端到端验证通过，准备合并推送 `main` 触发 GitHub Pages 上线；**真实 iPhone/Android 真机触控、屏幕阅读器及 6–8 名普通消费者试玩访谈待上线后实机补齐，不以自动化测试替代**。

产品权威见 [Game-first PRD](game-first-prd.md)、[Episode 001](../tasks/game-first/episode-001.md) 与 [执行计划](../tasks/game-first/execution-plan.md)。

## 1. 已完成的自动化与无头浏览器验证（2026-11-15）

| 验证项 | 执行命令 / 脚本 | 覆盖范围与限制 | 结果 |
| --- | --- | --- | --- |
| 构建与准入编译 | `npm run build` | 152 条来源、18 章、5 关 approved 挑战、1 个 approved Daily Pack；强制拦截 `blocked`/`draft`/待核验语料 | 通过 |
| Node 单元与状态机回归 | `npm test`（`tests/**/*.test.mjs`） | 含 `tests/daily-game.test.mjs`（0/5、5/5、双击锁分、刷新恢复、跨版本部分保留、无剧透文案、事务回滚）与全站回归 | 通过 |
| 语料与前端契约门禁 | `npm run check` | HTML/CSS/JS/SW 白名单、体积预算、`cases-data.js`/`legal-updates.js`/`docs/content-index.md`/sitemap 一致性、语料 URL | 通过 |
| 纯静态发布产物构建 | `npm run build:site` | 验证 `_site/` 只含静态发布白名单文件，旧问卷与内部目录已隔离清除 | 通过 |
| 无头 Edge 端到端回归 | `python tests/daily_browser.py` | 模拟 `390×844` / `390×666` / `320×640` / `1365×900`；5/5 与 0/5 通关、键盘 `ArrowLeft`/`ArrowRight`、1080×1440 PNG 导出下载、案例库与 `/c/<slug>/` 跳转返回、`?pack=episode-001&challenge=1` 好友挑战、损坏存档恢复；无 JS 报错 | 通过 |
| 新增外部权威链接巡检 | `node scripts/check-links.mjs` | 核验北京市消协比较试验、发改价格规〔2017〕1250号、工商银行小额账户收费通告均可访问且正文一致 | 通过 |

## 2. 真机与真人试玩待办清单（未由自动化覆盖）

### 2.1 真实手机设备、触控手势与系统设置
- [ ] **iPhone Safari（含竖屏/横屏、系统大字与安全区）**：核对左/右滑动手势与页面纵向滚动互不误触、返回今日挑战、打开系统分享面板导出成绩卡后取消返回无异常。
- [ ] **Android Chrome（含窄屏与系统缩放）**：核对首屏可读性、44px+ 触控目标、PNG 下载保存与离线缓存切换。

### 2.2 无障碍读屏与焦点流转
- [ ] **iOS VoiceOver / Android TalkBack**：完整朗读关卡情境、目标、线索、NO/YES 按钮（不依赖红绿色差）、两阶段揭晓结果及无剧透成绩网格，关闭 PNG 成绩卡 `<dialog>` 后焦点正确回到触发按钮。

### 2.3 6–8 名普通成年消费者无引导盲测（R3）
- [ ] 观察并记录未看说明情况下能否理解 YES=买/留用、NO=拒绝/不签。
- [ ] 验证第 2 关与第 4 关两条正向题的“反转惊喜感”是否可信、不被误判为强推广告。
- [ ] 验证结果页纪念小海獭插画被理解成“通关纪念”而非“消费者能力评分”，确认分享链接点开后不会先剧透朋友成绩详情。
