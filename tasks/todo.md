# Todo: 青岛旅游消费避坑与维权 CASE 开发

- [x] 1. 调研与设计青岛旅游核心法源、典型事件、5 大消费场景及权利抓手 <!-- id: 0 -->
- [x] 2. 编写 `qingdao-travel-case.js`（涵盖餐饮、交通、出海、景区拍照、民宿等核心场景） <!-- id: 1 -->
- [x] 3. 在 `legal-updates.js` 中新增 `qingdao-travel` 权利校验条目（Rights Check） <!-- id: 2 -->
- [x] 4. 在 `index.html` 中引入 `qingdao-travel-case.js` 并校验展示效果 <!-- id: 3 -->
- [x] 5. 按照用户要求移除青岛案例冗余的“证据清单（Evidence）”模块，并在 `app.js` 中使 Evidence 模块具备优雅可选性 <!-- id: 4 -->
- [x] 6. 提交本地 Git 变更并 Push 到远端 GitHub 仓库 <!-- id: 5 -->

## Review
- 案例文件: `qingdao-travel-case.js` 包含海鲜餐饮、交通带店、海上娱乐、景区体验、公共景区拍照、住宿退订 6 大典型场景。
- 架构优化: 移除了独立的证据清单模块，保留各场景内精炼直接的“现在做什么”行动指引与留证提示；`app.js` 已实现无 `evidence` 字段时自动隐藏 DOM 结构。
- 权利校验: `legal-updates.js` 接入“明码标价”、“商业贿赂”、“强制消费”、“违约赔偿”、“景区拍照” 5 个高杠杆 Tab 抓手。
- 远端同步: 已成功提交并推送到 GitHub `main` 分支（Commit: `56a10d7`）。
