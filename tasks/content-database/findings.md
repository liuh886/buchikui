# 发现

- 现有部署为 GitHub Pages 纯静态；不存在游戏内容数据库，Supabase 仅用于消费者反馈。
- 现有 Node v24.3.0 和 SQLite CLI 可用，Node 内置 SQLite 可省去新运行时依赖。
- 现有 corpus 是来源唯一登记位置，editorial/rules.js 是规则翻译，legal-updates.js 为生成产物；保留该核验链。
- 当前六题都是规则合成或改编试题。整体入库保存，但未通过新准入的题退出默认发布；不能冒称六宗真实案例。
- 已有七项研究候选可逐案进入 corpus；本轮补充二手平台经营者、到店付款预扣、客服站外收款等真实争议。
- 只有已核验来源、完整题面与适用边界、绑定权威规则的已审核题能进入公开快照。
- Browser plugin not available；前端验证使用本机可用的浏览器工具或常规 Playwright。
- 文档抓取：nodejs.org latest-v24 SQLite 文档访问失败，改查固定版本官方文档；Supabase changelog.md 因内容类型被抓取器拒绝，本轮不实施 Supabase 变更。
