# 不吃亏 / Buchikui

测测你的消费经历角色，不花钱，也买教训。

八道“你是否遭遇过：”问卷卡，记录自己的实际消费波折。右滑YES有过、左滑NO没有过，任一选择直接继续；支持跳过、返回修改和刷新恢复，没有标准答案或判分。

填写结束后获得六种可爱角色之一、能够核对的经历线索，以及两则来源明确的真实案例和下次值得留意的事。角色是本次答卷的趣味表达，不是人格诊断或消费能力等级。未报告遭遇与回答不足都有完整角色和案例回报。

资料库保持五卷十八章，支持搜索与筛选，每题也可主动打开“案例解析”。当前版本已本地实现，尚未发布。集中云收卷、真实手机/读屏及受访者理解与可爱偏好验收仍待完成。

## 本地运行

需要Node.js 24.3或更新版本，无新增运行时包。

- npm run build：核验来源、重建内容库、导出问卷与画像、生成角色资源清单。
- npm run site：完整构建并启动预览，默认4173；PORT可指定端口。
- npm test：行为测试。
- npm run check：语料与前端契约检查。
- npm run verify：构建、测试及检查。
- npm run db:inspect：查看内容库状态。
- npm run survey:inspect：查看本机分问句、分版本计数。

## 内容与回答

corpus登记来源事实，editorial保存章节、规则、问句及画像短读；内容库data/content.sqlite可重建。当前有149条来源、39条案例、18章、59条规则、8道公开题、15道退役题；12条案例已核验、27条仍为采集状态，不能把全部入库材料称为已核验。

editorial/consumer-portraits.json保存六角色与八则短读；短读的reviewedAgainst指纹绑定原案和规则，实质变化需重审。12张透明WebP资源326404字节（约318.8KiB），来自内置ImageGen，提示与来源记录在editorial/portrait-assets/generation.json。发布路径按图片字节哈希生成，编辑源目录不会公开。

真实回答独立保存在data/survey.sqlite，内容重建不删除它。本机预览先保存浏览器再幂等同步；静态站和离线可完成问卷、画像和角色卡导出，但未接入全站集中收集。回答库不提交Git、不进入静态产物，合成答卷只用隔离测试库。

GET /api/content返回schema 3公开内容；POST /api/survey-responses保存本机回答；GET /api/survey-stats只返回实际匿名聚合。Supabase消费者反馈队列未混入问卷回答。分享链接是干净问卷入口；角色图片只有用户主动生成、保存或系统分享，不上传图片，也不包含具体回答。

## 文档与验证

[文档索引](docs/README.md) · [产品规范](docs/product-experience-spec.md) · [问卷与画像口径](docs/survey-standard.md) · [数据库流程](docs/content-database.md) · [实施计划](tasks/consumer-portrait/implementation-plan.md)

本轮已有自动检查和headless Edge浏览器验证，最终自动检查结果以[本轮交付记录](tasks/consumer-portrait/delivery.md)为准，不沿用旧测试数量。[现行验收清单](docs/release-acceptance.md)区分桌面浏览器模拟、真实设备和受访者验收；[浏览器结果](docs/prototype-assets/2026-10-24/implementation/browser-results.json)与截图保留证据。真实iPhone/Android、VoiceOver/TalkBack和6–8人理解/可爱偏好均未执行，未发布线上。
