# 内容数据库、画像与问卷回答

更新：2026-10-24。当前可爱经历角色与案例回报已本地实现，待人工验收，未部署集中收卷。产品与统计口径见[产品规范](product-experience-spec.md)和[问卷标准](survey-standard.md)。

## 两个数据库

- data/content.sqlite：可重建的来源、案例、章节、规则、问句及画像发布配置。
- data/survey.sqlite：本机真实答卷，独立持久保存，内容构建不删除它。

Supabase product_feedback仍是消费者内容反馈队列，不保存问卷回答。本轮保持既有问句语义与真实回答，不伪造新答卷。

## 版本化输入与构建

corpus保存来源事实；editorial保存章节、规则翻译、题目以及consumer-portraits.json中的角色与审核短读。数据库先校验，再事务写入临时库，成功才替换；包括角色资源缺失或短读指纹过期在内的失败保留旧内容库。

当前149条来源、39条案例、18章、59条规则、8道公开自述题、15道退役题。12条案例已核验，27条旧案例仍是采集状态，不包装成全部已核验。共享网页的不同原案按独立来源ID和定位关联。

表结构为sources、topics/topic_sources、authority_rules/rule_sources、real_cases、questions、journeys/journey_questions、schema_migrations，以及第3次迁移新增的portrait_publications单例表。外键、唯一约束与参数绑定保护关系。重建不直接迁移回答库，也不要求给回答新增角色列。

published_questions只公开已审核、关联核验案例且对应规则直接引用该案例的题；背景采集、草稿及退役题不公开。

## 公开schema 3与模块

publicContent返回schema 3、mode self-report、questionnaireVersion、questions、journeys、portrait及整体revision。portrait包含六角色、覆盖门槛、题组映射、后备角色和八则短读。角色图路径为基于真实图片字节SHA-256前12位的portraits/<id>.<hash>.webp，缩略图同理。

构建从同一数据库投影导出content-data.js；本机GET /api/content与离线快照一致。章节另导出cases-data.js，权威解释仍来自legal-updates.js。

- survey-state.js管理整卷状态、恢复、内容原子安装。
- survey-portrait.js纯函数管理画像及两则回报。
- survey-ui.js管理填写和三层结果。
- survey-portrait-share.js在客户端生成Canvas图片与预览。
- survey-portrait.css承载画像结果样式。

## 角色与短读编辑

editorial/consumer-portraits.json是角色、规则与短读的唯一编辑入口。六角色覆盖三主题、并列、未报告和不足信息状态。minAnswered为6、minAnsweredPerGroup为1；改变题组或题数须重审这些阈值。

每则短读绑定questionId、caseId、topicSlug、ruleId，含situation/outcome/boundary/notice、稳定排序与入门优先级。每题至少一则，入门候选至少覆盖两主题；不能靠重复原案凑两则。

reviewedAgainst绑定原案事实、结果、边界、URL、机关、日期、核验日与权重，以及规则状态、解释和提醒。来源或规则实质变化导致指纹不匹配时阻止构建，编辑核对后才可重写指纹。字段验证不能代替事实审核。公开投影不含指纹或编辑备注；原文URL/机关等直接由既有来源生成，不另建来源登记。

每题解析analysis仍包含直接关联的已核验案例经过、结果、边界与出处。结果短读对这些材料做经审核的压缩，不生成独立法律结论。

## 版本与旧状态

question.version由题号、题面与决策类型决定；questionnaireVersion绑定题目语义版本、固定顺序和分组；portrait.rulesVersion独立管理分类规则；内容revision覆盖角色/短读等内容变化。

有效schema 2完整卷或前缀可校验迁移至state schema 3；旧中途截断状态回整卷起点，不冒充完整画像。records、pending、sequence及已收回答不清空。规则或图像更新可以重算角色而不改答案，问句语义变化继续隔离旧响应。

## 角色资源与发布物

editorial/portrait-assets保存六张512×512与六张128×128透明WebP及generation.json。12张图326404字节（约318.8KiB），来自内置ImageGen；提示、生成文件与打包说明在该记录中。单图/缩略图预算分别60/12KiB。公开产物只复制审核资源到哈希路径，不公开editorial、corpus、数据库、生成提示或原画稿。

构建生成SW角色清单，问卷壳、数据、脚本、CSS及图片使用版本缓存，完整新包安装成功后切换。API绕过SW；不能把单次成功的网络文件写进旧问卷包造成混版。资源404时结果文字与图片导出后备仍可用。

## 本机答卷与统计

POST /api/survey-responses仅接受随机去重标识、题号、版本、yes/no/skip与修改序号；额外字段、旧版本、跨站或超大请求被拒绝。重复幂等，较旧序号不能覆盖新修改。

GET /api/survey-stats仅返回当前问句版本有效完整答卷聚合，包括YES/NO/skip、YES题项分布和最大题项数；全skip和部分答卷不混入，不返回参与标识。画像覆盖条件与聚合完整条件独立。

静态站离线完成个人回报，不提供跨设备集中汇总。角色卡在浏览器导出，不上传图片或答案。P1集中收卷需另做部署、HTTPS/Origin、防滥用、备份删除与样本范围方案，不复用反馈队列。

## 使用与验收

需要Node.js 24.3或更新版本，无新增运行时包。npm run build重建内容及静态载荷；npm run db:inspect查看内容；npm run survey:inspect查看本机计数；npm run verify与npm run build:site执行工程检查。

测试在隔离回答库运行。当前浏览器证据与真实设备/用户待验收项目见[release-acceptance](release-acceptance.md)。最终自动测试数量见[当轮交付记录](../tasks/consumer-portrait/delivery.md)；未实测项目不继承历史游戏通过结论。
