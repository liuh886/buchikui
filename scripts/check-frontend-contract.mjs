import { readFile, mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { prerender } from './prerender-cases.mjs';

const [html, app, styles, caseLibraryStyles, rightsPulseStyles, pwa, serviceWorker, manifestRaw, investmentCase, thailandCase, applianceCase, layoffCase, alibabaAuctionCase, legalUpdates, feedbackClient, feedbackFunction] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../case-library.css', import.meta.url), 'utf8'),
  readFile(new URL('../rights-pulse.css', import.meta.url), 'utf8'),
  readFile(new URL('../pwa.js', import.meta.url), 'utf8'),
  readFile(new URL('../sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'),
  readFile(new URL('../investment-advisor-case.js', import.meta.url), 'utf8'),
  readFile(new URL('../thailand-travel-safety-case.js', import.meta.url), 'utf8'),
  readFile(new URL('../appliance-repair-case.js', import.meta.url), 'utf8'),
  readFile(new URL('../layoff-compensation-case.js', import.meta.url), 'utf8'),
  readFile(new URL('../alibaba-auction-case.js', import.meta.url), 'utf8'),
  readFile(new URL('../legal-updates.js', import.meta.url), 'utf8'),
  readFile(new URL('../feedback.js', import.meta.url), 'utf8'),
  readFile(new URL('../supabase/functions/feedback-submit/index.ts', import.meta.url), 'utf8'),
]);

const fail = (message) => {
  throw new Error(message);
};

const localScripts = [...html.matchAll(/<script\s+([^>]*?)src="([^"]+)"([^>]*)><\/script>/g)]
  .filter(([, , src]) => !/^https?:\/\//i.test(src));

if (!localScripts.length) fail('No local scripts discovered in index.html');
for (const match of localScripts) {
  const attrs = `${match[1]} ${match[3]}`;
  if (!/\bdefer\b/.test(attrs)) fail(`Local script must be deferred: ${match[2]}`);
}

for (const required of [
  'function safeHref(value)',
  'function sanitizeCanonicalHtml(value)',
  'function renderMeta()',
  'function renderHero()',
  'function renderOverview()',
  "function filterSwitcher(value='')",
  'function renderEvidence()',
  'function renderServiceStandard()',
  'function renderStandardCase()',
  'function renderRouteComparison()',
  'function renderRoute()',
  'function renderSources()',
  'renderOverview();',
  'renderRouteComparison();',
  'const href=safeHref(step.href);',
  'const href=safeHref(source.href);',
  "main.addEventListener('transitionend'",
  'caseTransitionController?.abort();',
  "shareMeritToast.textContent='功德 +1';",
  "showShareMerit('已复制到粘贴板');",
  "const requestedCase=cases.find(item=>item.slug===requested);",
  "url.searchParams.set('case',next.slug);",
  'document.body.dataset.activeCaseSlug=active.slug;',
  "window.BuchikuiRights.render(active.slug);",
  'is-critical',
  'critical-star',
  'criticalCount',
  'progressBar',
  'function caseCanonicalUrl(slug){',
  'function isCasePath(){',
  'function siteBase(){',
  '/c/${next.slug}/',
  '/c/${slug}/',
]) {
  if (!app.includes(required)) fail(`Missing frontend contract: ${required}`);
}

for (const retired of [
  'let transitionTimer=',
  'setTimeout(apply,100)',
  "setAttribute('href',step.href)",
  "byId('scenarioNav')",
  "byId('situationList')",
  "byId('caseStamp')",
  'item.risk',
  "byId('routeIntro')",
  "byId('templateNav')",
]) {
  if (app.includes(retired)) fail(`Retired frontend path returned: ${retired}`);
}

for (const required of [
  'rel="manifest" href="manifest.webmanifest"',
  'rel="apple-touch-icon"',
  'href="case-library.css"',
  'src="pwa.js"',
  'src="read-progress.js"',
  'src="appliance-repair-case.js"',
  'src="thailand-travel-safety-case.js"',
  'src="alibaba-auction-case.js"',
  'src="layoff-compensation-case.js"',
  'data-share',
  'data-print',
  'id="caseList"',
  'id="caseSwitcherId"',
  'id="caseSwitcherSearch"',
  'id="caseOverview"',
  'id="discussionIntro"',
  '<details class="service-standard-details"',
  '<details class="template-details"',
]) {
  if (!html.includes(required)) fail(`Missing reader surface: ${required}`);
}

for (const retired of [
  '<nav',
  'id="scenarioPicker"',
  'class="stamp"',
  'case-switcher-action',
  'case-switcher-foot',
  'id="routeKicker"',
  'id="routeIntro"',
  'id="scenarioNav"',
  'id="templateNav"',
  'data-install-app',
  'id="pwaInstallDialog"',
  'id="pwaToast"',
  'data-library-open',
  'id="libraryDialog"',
  'data-account-slot',
  'src="library.js"',
  'src="case-visual.js"',
  'href="library.css"',
  'href="case-visual.css"',
  'href="pwa.css"',
  'href="account-integration.css"',
]) {
  if (html.includes(retired)) fail(`Retired reader chrome returned: ${retired}`);
}

for (const required of [
  'overscroll-behavior:contain',
  'body.case-switcher-open{overflow:hidden}',
  '.service-standard-details',
  '.template-details',
  '.case-list',
  '.fee-comparison',
  '.fee-row.is-highlight',
  '.fee-track',
  '.read-progress{',
  '#discussionBody>ol{counter-reset:discussion-card;display:grid',
]) {
  if (!styles.includes(required)) fail(`Missing simplified design contract: ${required}`);
}
for (const retired of ['.situation{', '.risk{', 'nav{']) {
  if (styles.includes(retired)) fail(`Retired visual layer returned: ${retired}`);
}

for (const required of [
  '.case-switcher-search',
  '.case-switcher-list{grid-template-columns:repeat(2,minmax(0,1fr))',
  '.case-overview-grid',
  '.case-overview-item',
]) {
  if (!caseLibraryStyles.includes(required)) fail(`Missing case library visual contract: ${required}`);
}

for (const required of [
  '.rights-pulse-tabs',
  '.rights-pulse-tab[aria-selected="true"]',
  '.rights-pulse-document',
  '.rights-pulse-badge',
  '.rights-pulse-badge.is-statute',
]) {
  if (!rightsPulseStyles.includes(required)) fail(`Missing rights-pulse visual contract: ${required}`);
}

for (const required of [
  'const normalizeRules=item=>item&&Array.isArray(item.rules)?item.rules:[];',
  "const isCaseRule=rule=>rule&&rule.kind==='case';",
  'const ruleVerified=rule=>rule&&rule.verified?rule.verified:VERIFIED;',
  'function bindRuleTabs(host,rules)',
  'role="tablist"',
  'data-rights-rule',
  '切换关键参考',
  '案例参考',
  '关键提取',
  'window.BuchikuiRights={render:renderForSlug,renderActive:render};',
  'function renderForSlug(slug){',
  'function ruleBadge(rule){',
  'document.body.dataset.activeCaseSlug',
  "tab:'经营主体'",
  "tab:'预付退款'",
  "tab:'套餐选择'",
  "tab:'管辖'",
  "tab:'费用'",
  "tab:'风险测评'",
  "tab:'调单核查'",
  "tab:'维修行为'",
  "tab:'明码标价'",
  "tab:'搜索广告'",
  "tab:'投诉举报'",
  "tab:'自竞禁止'",
  "tab:'瑕疵说明'",
  "tab:'平台保全'",
  "tab:'Jaguar'",
  "tab:'陌生接送'",
  "tab:'商务邀约'",
  "tab:'断联控制'",
  "tab:'星宇劝退'",
  "tab:'AI替岗'",
  "tab:'部门撤销'",
  "tab:'解除理由'",
  "tab:'调岗边界'",
  "tab:'批量裁员'",
  "tab:'补偿计算'",
]) {
  if (!legalUpdates.includes(required)) fail(`Missing rights-pulse reference contract: ${required}`);
}

for (const required of [
  "'thailand-travel-safety':{",
  "'alibaba-auction-trap':{",
  '边境转运是明确的风险信号。',
  '酒店门口的一次接送，也可能是风险起点。',
  '前半程正常，不代表下一程安全。',
  '没有现场绑匪，也能先把人“隔离”。',
  '“个人离职 / 流水线二选一”，先别替公司写解除理由。',
  'AI能替岗，不等于公司可以直接降薪解约。',
  '部门没了，也不等于劳动合同当然可以解除。',
]) {
  if (!legalUpdates.includes(required)) fail(`Missing concise case reference: ${required}`);
}

for (const retired of [
  "tab:'当前规则'",
  "tab:'即将生效'",
  'item.upcoming',
  'item.upcomingSource',
]) {
  if (legalUpdates.includes(retired)) fail(`Retired rights-pulse path returned: ${retired}`);
}

// 覆盖率：每个 CASE slug 必须在权利层有对应条目（rental 为历史无引号 key，单独兼容）
for (const slug of [
  'beauty-hair',
  'bank-small-account-fee',
  'mobile-plan-cost',
  'internet-court-self-litigation',
  'alipay-advisor-cost',
  'bank-wealth-not-guaranteed',
  'rental-credit-card-first',
  'appliance-repair-trap',
  'airport-sales-pitch',
  'dating-safety',
  'thailand-travel-safety',
  'layoff-compensation',
  'alibaba-auction-trap',
  'qingdao-travel',
  'transport-platform-layered-fees',
]) {
  if (!legalUpdates.includes(`'${slug}':{`)) fail(`Missing rights-pulse entry for case: ${slug}`);
}
if (!/['"]?rental['"]?:\s*\{/.test(legalUpdates)) fail('Missing rights-pulse entry for case: rental');

const caseSourcePaths = [
  'cases.js',
  'compact-cases.js',
  'mobile-plan-case.js',
  'court-case.js',
  'investment-advisor-case.js',
  'bank-wealth-case.js',
  'rental-payment-case.js',
  'appliance-repair-case.js',
  'airport-sales-case.js',
  'dating-safety-case.js',
  'thailand-travel-safety-case.js',
  'alibaba-auction-case.js',
  'layoff-compensation-case.js',
  'qingdao-travel-case.js',
  'transport-platform-case.js',
  'legal-updates.js',
];
const caseSources = await Promise.all(caseSourcePaths.map(path => readFile(new URL(`../${path}`, import.meta.url), 'utf8')));
for (let index = 0; index < caseSources.length; index += 1) {
  const source = caseSources[index];
  const path = caseSourcePaths[index];
  // 内容标准17：只有真实时间顺序存在时才使用“先确认/先确定”，且不得作为模板式标题。
  // 合法如“先确认原经营主体”“先确认码头和全包价”（带具体对象+真实时序）；拦截标题式与空泛对象用法。
  if (/"title":\s*"[^"]*先(?:确认|确定)/.test(source)) fail(`AI-style confirm title returned in ${path}`);
  if (/先(?:确认|确定)(事实|情况|相关|责任|问题|内容|信息|事项)/.test(source)) fail(`AI-style generic confirm opener returned in ${path}`);
  if (/不是[^。\n]{0,80}(?:而是|而在)/.test(source)) fail(`AI-style contrast skeleton returned in ${path}`);
  if (/(?:把[^。\n]{0,24}(?:讲明白|讲清楚|说透)|真正(?:要看的是|要记住|危险的|值得警惕的部分|省钱的一步|降下来)|说到底|归根结底|换句话说|本质上)/.test(source)) fail(`Empty AI-style framing returned in ${path}`);
}

// Schema 校验：真实执行数据文件（而非正则猜测），按 layout 强制必填字段。
// 架构说明：本站是离线优先的单页随机阅读器，16 个 CASE 全量预载是刻意取舍
// （首屏确定性 + 离线完整 + 切换零等待），不做按需拆分；本段 schema 即该取舍的完整性兜底。
{
  const dataFiles = caseSourcePaths.filter(path => path !== 'legal-updates.js');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of dataFiles) {
    const code = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    vm.runInContext(code, sandbox, { filename: file });
  }
  const allCases = sandbox.window.BUCHIKUI_CASES;
  if (!Array.isArray(allCases)) fail('BUCHIKUI_CASES is not an array after evaluating case files');
  if (allCases.length !== 16) fail(`Expected 16 cases, got ${allCases.length}`);
  const ids = new Set();
  const slugs = new Set();
  const need = (cond, message) => { if (!cond) fail(message); };
  for (const c of allCases) {
    need(/^\d{3}$/.test(c.id ?? ''), `Case has bad id: ${c.slug ?? '(unknown)'}`);
    need(!ids.has(c.id), `Duplicate case id: ${c.id}`);
    ids.add(c.id);
    need(/^[a-z0-9][a-z0-9-]{0,79}$/.test(c.slug ?? ''), `Case has bad slug: ${c.id}`);
    need(!slugs.has(c.slug), `Duplicate case slug: ${c.slug}`);
    slugs.add(c.slug);
    for (const key of ['name', 'label', 'shareText', 'legal', 'takeaway']) {
      need(typeof c[key] === 'string' && c[key].trim().length > 0, `Case ${c.slug} is missing ${key}`);
    }
    need(/^\d{4}-\d{2}-\d{2}$/.test(c.updated ?? ''), `Case ${c.slug} has bad updated date`);
    for (const key of ['title', 'description', 'ogTitle', 'ogDescription']) {
      need(typeof c.meta?.[key] === 'string' && c.meta[key].trim().length > 0, `Case ${c.slug} meta is missing ${key}`);
    }
    need(typeof c.hero?.title === 'string' && c.hero.title.length > 0, `Case ${c.slug} is missing hero.title`);
    need(typeof c.hero?.copy === 'string' && c.hero.copy.length > 0, `Case ${c.slug} is missing hero.copy`);
    need(typeof c.panic?.title === 'string' && Array.isArray(c.panic?.items) && c.panic.items.length >= 1, `Case ${c.slug} has bad panic block`);
    need(typeof c.route?.title === 'string' && Array.isArray(c.route?.steps) && c.route.steps.length >= 1, `Case ${c.slug} has bad route block`);
    for (const step of c.route.steps) {
      need(step.title && step.text && step.href && step.link, `Case ${c.slug} has an incomplete route step`);
    }
    need(Array.isArray(c.sources) && c.sources.length >= 1, `Case ${c.slug} needs at least one source`);
    for (const source of c.sources) {
      need(source.title && source.href, `Case ${c.slug} has an incomplete source`);
    }
    const layout = c.layout ?? 'standard';
    need(['standard', 'compact'].includes(layout), `Case ${c.slug} has unknown layout: ${layout}`);
    if (layout === 'standard') {
      need(Array.isArray(c.scenarios) && c.scenarios.length >= 1, `Standard case ${c.slug} needs scenarios`);
      need(c.template?.title && c.template?.text, `Standard case ${c.slug} needs a template`);
      for (const scenario of c.scenarios) {
        need(scenario.short && scenario.title && Array.isArray(scenario.blocks) && scenario.blocks.length >= 1, `Case ${c.slug} has an incomplete scenario`);
      }
    } else {
      need(!c.scenarios, `Compact case ${c.slug} must not carry scenarios`);
    }
    if (c.evidence) need(Array.isArray(c.evidence.items) && c.evidence.items.length >= 1, `Case ${c.slug} has an empty evidence block`);
    for (const item of (c.evidence?.items || [])) {
      need(item.critical === undefined || typeof item.critical === 'boolean', `Case ${c.slug} evidence item ${item.key} has bad critical flag`);
    }
    if (c.serviceStandard) need(Array.isArray(c.serviceStandard.items) && c.serviceStandard.items.length >= 1, `Case ${c.slug} has an empty serviceStandard block`);
    if (c.overview) need(Array.isArray(c.overview.items) && c.overview.items.length >= 1, `Case ${c.slug} has an empty overview block`);
    const keyQuoted = `'${c.slug}':{`;
    const keyBare = `${c.slug}:{`;
    need(legalUpdates.includes(keyQuoted) || legalUpdates.includes(keyBare), `Missing rights-pulse entry for case: ${c.slug}`);
  }
  // Sitemap 覆盖率：16 个 slug 必须全部有规范地址（/c/<slug>/）；?case= 仅为兼容入口，不进 sitemap。
  const sitemap = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  for (const c of allCases) {
    if (!sitemap.includes(`/c/${c.slug}/`)) fail(`Sitemap is missing case: ${c.slug}`);
    if (sitemap.includes(`?case=${c.slug}`)) fail(`Sitemap must use canonical /c/ URLs, not ?case=: ${c.slug}`);
  }
  const robots = await readFile(new URL('../robots.txt', import.meta.url), 'utf8');
  if (!robots.includes('sitemap.xml')) fail('robots.txt must reference sitemap.xml');
}

// 预渲染验证：真实执行生成器，16 页齐全、head 专属化、资源引用 ../ 化、无漏改写。
{
  const tmp = await mkdtemp(path.join(os.tmpdir(), 'buchikui-prerender-'));
  const pages = await prerender(tmp);
  if (pages.length !== 16) fail(`Prerender expected 16 pages, got ${pages.length}`);
  for (const { slug, file } of pages) {
    const page = await readFile(file, 'utf8');
    for (const required of [
      `<link rel="canonical" href="https://liuh886.github.io/buchikui/c/${slug}/">`,
      `<meta property="og:url" content="https://liuh886.github.io/buchikui/c/${slug}/">`,
      'src="../app.js"',
      'href="../styles.css"',
    ]) {
      if (!page.includes(required)) fail(`Prerendered page is missing ${required} for case: ${slug}`);
    }
    for (const leaked of ['src="cases.js"', 'href="styles.css"', 'src="app.js"', '.././']) {
      if (page.includes(leaked)) fail(`Prerendered page has unrewritten ref ${leaked} for case: ${slug}`);
    }
  }
}

if (!pwa.includes("navigator.serviceWorker.register('./sw.js')")) fail('PWA service worker registration is missing');
if (pwa.includes('beforeinstallprompt') || pwa.includes('pwaToast') || pwa.includes('SKIP_WAITING')) {
  fail('PWA client must stay infrastructure-only');
}

for (const required of [
  "const CACHE_NAME='buchikui-pwa-v10';",
  "'./index.html'",
  "'./case-library.css'",
  "'./cases.js'",
  "'./appliance-repair-case.js'",
  "'./thailand-travel-safety-case.js'",
  "'./alibaba-auction-case.js'",
  "'./qingdao-travel-case.js'",
  "'./transport-platform-case.js'",
  "'./layoff-compensation-case.js'",
  "'./pwa.js'",
  'self.skipWaiting()',
  "networkFirst(request,'./index.html')",
]) {
  if (!serviceWorker.includes(required)) fail(`Missing service worker contract: ${required}`);
}

// 自动一致性：index.html 引入的本地脚本必须全部进入 SW 离线清单，防止新增 CASE 漏配离线
for (const [, , src] of localScripts) {
  const asset = `'./${src.replace(/^\.\//, '')}'`;
  if (!serviceWorker.includes(asset)) fail(`Service worker is missing offline asset: ${src}`);
}

for (const retired of [
  "'./library.js'",
  "'./library.css'",
  "'./case-visual.js'",
  "'./case-visual.css'",
  "'./pwa.css'",
  "'./account-integration.css'",
]) {
  if (serviceWorker.includes(retired)) fail(`Retired offline asset returned: ${retired}`);
}

// Turnstile 人机验证：前后端 wiring 缺一即红灯，杜绝“文档说有、实现没有”二次分叉。
for (const required of [
  'challenges.cloudflare.com/turnstile/v0/api.js?render=explicit',
  'buchikui_feedback',
  'turnstile_token',
  "action: 'config'",
  'expired-callback',
  'error-callback',
  '!state.turnstileToken',
  '机器人验证暂不可用，提交已锁定',
  '请先完成人机验证。',
]) {
  if (!feedbackClient.includes(required)) fail(`Missing feedback Turnstile contract: ${required}`);
}
for (const required of [
  'siteverify',
  'TURNSTILE_SECRET_KEY',
  'TURNSTILE_SITE_KEY',
  'buchikui_feedback',
  'TURNSTILE_HOSTNAME',
  '"config"',
  'Human verification is unavailable.',
]) {
  if (!feedbackFunction.includes(required)) fail(`Missing feedback-submit Turnstile contract: ${required}`);
}

const hasAny = (source, ...variants) => variants.some(variant => source.includes(variant));

if (investmentCase.includes('costModel:')) fail('Case-specific cost-model renderer contract must not return');
if (!hasAny(investmentCase, 'panic:{', '"panic":')) fail('Compact advisor panic data required by renderHero is missing');
if (!hasAny(investmentCase, 'shareText:', '"shareText"')) fail('Compact advisor share text is missing');
if (!hasAny(investmentCase, 'ogTitle:', '"ogTitle"') || !hasAny(investmentCase, 'ogDescription:', '"ogDescription"')) fail('Compact advisor social metadata is missing');
for (const required of [
  '支付宝投顾的真实交易成本<br>犹如冰山。',
  '交易手续费约 0.22%',
  '运作费约 1.00%',
  '投顾管理费约 0.50%',
]) {
  if (!investmentCase.includes(required)) fail(`Compact advisor iceberg comparison is missing: ${required}`);
}
for (const variants of [
  ['comparison:{', '"comparison"'],
  ["label:'IQQ'", '"label": "IQQ"'],
  ["label:'嘉实 159501'", '"label": "嘉实 159501"'],
  ["label:'广发 159941'", '"label": "广发 159941"'],
  ["label:'支付宝投顾'", '"label": "支付宝投顾"'],
  ["totalLabel:'约 1.72%'", '"totalLabel": "约 1.72%"'],
]) {
  if (!hasAny(investmentCase, ...variants)) fail(`Compact advisor iceberg comparison is missing: ${variants[0]}`);
}
if (investmentCase.includes('把结构看成三层就够了')) fail('Retired advisor three-line summary returned');
if (investmentCase.includes('display:none') || investmentCase.includes('<span style=')) {
  fail('Compact advisor case must not hide legacy contract text in content');
}

for (const required of [
  'Grand Palace 今天关闭',
  '20 泰铢 tuk-tuk 城市游',
  'ATM / 刷卡机 DCC',
  '摩托 / 水上摩托“损坏索赔”',
  '免税宝石投资 / 回国转卖赚钱',
  '免费但不合理',
  '行程被改变',
  '要求隔离',
]) {
  if (!thailandCase.includes(required)) fail(`Thailand travel safety case contract is missing: ${required}`);
}
for (const variants of [
  ["slug:'thailand-travel-safety'", '"slug": "thailand-travel-safety"'],
  ["layout:'compact'", '"layout": "compact"'],
  ['ogTitle:', '"ogTitle"'],
  ['ogDescription:', '"ogDescription"'],
  ['panic:{', '"panic":'],
  ['route:{', '"route":'],
  ['discussion:{', '"discussion":'],
  ["title:'常见旅游骗局'", '"title": "常见旅游骗局"'],
  ['sources:[', '"sources":'],
  ['takeaway:', '"takeaway"'],
  ['legal:', '"legal"'],
]) {
  if (!hasAny(thailandCase, ...variants)) fail(`Thailand travel safety case contract is missing: ${variants[0]}`);
}
for (const retired of ['overview:{', '"overview":', '共同风险链']) {
  if (thailandCase.includes(retired)) fail(`Thailand case must not duplicate pulse references: ${retired}`);
}

if (!hasAny(applianceCase, "slug:'appliance-repair-trap'", '"slug": "appliance-repair-trap"')) fail('Appliance repair case is missing');
if (!applianceCase.includes('虚报故障部件')) fail('Appliance repair consumer-risk rule is missing');
if (!applianceCase.includes('警惕搜索排名')) fail('Appliance repair opening must identify search ranking as the start of the risk chain');

for (const required of [
  '案例参考｜星宇股份：从“离职 / 产线二选一”到公开致歉',
  '24至26小时',
  '媒体采访中的前员工与新员工陈述',
  'N+1不是所有裁员的统一答案',
  '最后再升级',
  '全国劳动人事争议在线调解服务平台',
]) {
  if (!layoffCase.includes(required)) fail(`Layoff compensation case contract is missing: ${required}`);
}
for (const variants of [
  ["id:'013'", '"id": "013"'],
  ["slug:'layoff-compensation'", '"slug": "layoff-compensation"'],
  ["name:'公司要裁你：别签个人离职'", '"name": "公司要裁你：别签个人离职"'],
  ["updated:'2026-08-29'", '"updated": "2026-08-29"', '"updated":"2026-08-29"'],
  ['panic:{', '"panic":'],
  ['scenarios:[', '"scenarios":'],
  ['evidence:{', '"evidence":'],
  ['route:{', '"route":'],
  ['template:{', '"template":'],
  ['discussion:{', '"discussion":'],
]) {
  if (!hasAny(layoffCase, ...variants)) fail(`Layoff compensation case contract is missing: ${variants[0]}`);
}
if (hasAny(layoffCase, "layout:'compact'", '"layout": "compact"')) fail('Layoff compensation case must use the standard scenario-first reader');

for (const required of [
  '拍卖方自己抬价',
  '先查谁在拍',
]) {
  if (!alibabaAuctionCase.includes(required)) fail(`Alibaba auction case contract is missing: ${required}`);
}
for (const variants of [
  ["id:'014'", '"id": "014"'],
  ["slug:'alibaba-auction-trap'", '"slug": "alibaba-auction-trap"'],
  ["name:'阿里拍卖局中局：捡漏你就输了'", '"name": "阿里拍卖局中局：先查谁在拍、谁在竞价"'],
  ["updated:'2026-08-29'", '"updated": "2026-08-29"', '"updated":"2026-08-29"'],
]) {
  if (!hasAny(alibabaAuctionCase, ...variants)) fail(`Alibaba auction case contract is missing: ${variants[0]}`);
}

const manifest = JSON.parse(manifestRaw);
if (manifest.display !== 'standalone') fail('PWA manifest must use standalone display mode');
if (manifest.start_url !== './' || manifest.scope !== './') fail('PWA start_url and scope must stay project-relative');
const iconPurposes = new Set((manifest.icons || []).map(icon => `${icon.sizes}:${icon.purpose || 'any'}`));
if (!iconPurposes.has('192x192:any')) fail('PWA manifest is missing a 192x192 app icon');
if (!iconPurposes.has('512x512:any')) fail('PWA manifest is missing a 512x512 app icon');
if (!iconPurposes.has('512x512:maskable')) fail('PWA manifest is missing a maskable 512x512 app icon');

await Promise.all([
  readFile(new URL('../icons/icon-180.png', import.meta.url)),
  readFile(new URL('../icons/icon-192.png', import.meta.url)),
  readFile(new URL('../icons/icon-512.png', import.meta.url)),
  readFile(new URL('../icons/icon-maskable-512.png', import.meta.url)),
]);

console.log(`Frontend contract passed for ${localScripts.length} deferred local scripts with one simplified reader path, direct case language, and infrastructure-only PWA.`);
