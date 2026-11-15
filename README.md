# 不吃亏 / Buchikui

> **当前版本（2026-11-15）：** Game-first「每日 5 关」消费决策游戏 + 消费案例库。[产品 PRD](docs/game-first-prd.md) · [首期五关](tasks/game-first/episode-001.md) · [实施计划](tasks/game-first/execution-plan.md)。

每天 5 关真实消费决策小游戏：不花一分钱，提前过一遍常见套路与容易错过的好选择。

每一关给出固定玩家目标、下单前肉眼可见线索与具体价目条件，先选 **NO（拒绝/不买）** 或 **YES（接受/购买）**，首次选择锁定当关得分，再两段揭晓关键反转、适用边界与一手官方来源（最高法典型案例、司法解释、消协比较试验与官方收费公示）。答完 5 关生成无剧透 5 格成绩与 1080×1440 纪念成绩卡，并附 `?pack=<id>&challenge=1` 好友挑战链接；站内仅额外保留五卷十八章**案例库**（`?view=library` 与 `/c/<slug>/`）。

## 本地运行

需要 Node.js 24.3 或更新版本，无新增运行时包。

- `npm run build`：核验语料、重建 `data/content.sqlite`、导出 `daily-data.js` / `content-data.js` / `legal-updates.js` / `cases-data.js`，同步角色资源清单与站点索引。
- `npm run site`：完整构建并启动预览（默认端口 `4173`，可用 `PORT` 覆盖；提供只读 `/api/daily-content`）。
- `npm test`：运行全量 Node 行为与准入测试。
- `npm run check`：语料与前端契约检查。
- `npm run verify`：串联执行 `build`、`test` 与 `check`。
- `npm run build:site`：生成纯静态发布目录 `_site`（已隔离退场旧问卷脚本与内部语料目录）。

## 内容架构与数据隔离

- **语料与规则层**：`corpus/` 登记法律、司法解释、典型案例与消协比较试验 / 官方收费公示；`editorial/cases/` 与 `editorial/rules.js` 组成十八章案例库；`editorial/challenges/` 与 `editorial/daily-packs/` 维护每日 5 关关卡与发布排期，并经 `scripts/lib/challenge-content.mjs` 强制核验反方校验、可观察线索与已核验一手来源，未通过核验或处于 `blocked`/`draft` 状态的关卡不会进入公开包 `daily-data.js`。
- **历史问卷资产隔离保留**：旧经历问卷接口、`data/survey.sqlite`、`editorial/retired-questions.json` 及浏览器键 `buchikui-survey-v1` 均保留不被删改；新版游戏状态完全独立存入 `buchikui-daily-v1`，首页仅展示每日 5 关与案例库入口。
- **错配语料处置**：`corpus/cases/case-consumer-prepaid-retail-deduction.json` 经复核发现所引 `459331.html` 案例四原文实为经营者消费记录举证责任案，已标记 `needsReview: true` 暂停公开使用；`beauty-hair` 相关规则改引现行《法释〔2025〕4 号》第十八条、第十九条。
- **公共静态边界**：`npm run build:site` 仅导出静态站点必需文件，不发布数据库或编辑原稿；成绩卡在浏览器本地 `<canvas>` 绘制，不向服务端上传玩家作答。

## 文档与验证

[文档索引](docs/README.md) · [Game-first PRD](docs/game-first-prd.md) · [现行验收清单](docs/release-acceptance.md) · [数据库流程](docs/content-database.md)

当前已完成全量 Node 测试（`npm test`）、前端契约检查（`npm run check`）、静态构建（`npm run build:site`）以及无头 Edge 端到端回归（`tests/daily_browser.py`，覆盖 `390×844` / `390×666` / `320×640` / `1365×900` 视口、5/5 与 0/5 流程、键盘操作、PNG 成绩卡下载、案例库与章节往返、刷新恢复与异常兜底）。**真实手机触控/横竖屏、VoiceOver/TalkBack 读屏以及 6–8 名普通消费者盲测仍待上线后实机补测**，不在自动化报告中替代。
