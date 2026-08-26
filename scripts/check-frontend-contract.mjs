import { readFile } from 'node:fs/promises';

const [html, app, styles, rightsPulseStyles, pwa, serviceWorker, manifestRaw, investmentCase, thailandCase, applianceCase, legalUpdates] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../rights-pulse.css', import.meta.url), 'utf8'),
  readFile(new URL('../pwa.js', import.meta.url), 'utf8'),
  readFile(new URL('../sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'),
  readFile(new URL('../investment-advisor-case.js', import.meta.url), 'utf8'),
  readFile(new URL('../thailand-travel-safety-case.js', import.meta.url), 'utf8'),
  readFile(new URL('../appliance-repair-case.js', import.meta.url), 'utf8'),
  readFile(new URL('../legal-updates.js', import.meta.url), 'utf8'),
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
  'function renderEvidence()',
  'function renderServiceStandard()',
  'function renderStandardCase()',
  'function renderRoute()',
  'function renderSources()',
  'const href=safeHref(step.href);',
  'const href=safeHref(source.href);',
  "main.addEventListener('transitionend'",
  'caseTransitionController?.abort();',
  "shareMeritToast.textContent='功德 +1';",
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
  'src="pwa.js"',
  'src="appliance-repair-case.js"',
  'src="thailand-travel-safety-case.js"',
  'data-share',
  'data-print',
  'id="caseList"',
  'id="caseSwitcherId"',
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
]) {
  if (!styles.includes(required)) fail(`Missing simplified design contract: ${required}`);
}
for (const retired of ['.situation{', '.risk{', 'nav{']) {
  if (styles.includes(retired)) fail(`Retired visual layer returned: ${retired}`);
}

for (const required of [
  '.rights-pulse-tabs',
  '.rights-pulse-tab[aria-selected="true"]',
  '.rights-pulse-document',
]) {
  if (!rightsPulseStyles.includes(required)) fail(`Missing rights-pulse visual contract: ${required}`);
}

for (const required of [
  'const normalizeRules=item=>item&&Array.isArray(item.rules)?item.rules:[];',
  'function bindRuleTabs(host,rules)',
  'role="tablist"',
  'data-rights-rule',
  '切换相关权利问题',
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
]) {
  if (!legalUpdates.includes(required)) fail(`Missing rights-pulse rule contract: ${required}`);
}

for (const retired of [
  "tab:'当前规则'",
  "tab:'即将生效'",
  'item.upcoming',
  'item.upcomingSource',
]) {
  if (legalUpdates.includes(retired)) fail(`Retired rights-pulse path returned: ${retired}`);
}

if (!pwa.includes("navigator.serviceWorker.register('./sw.js')")) fail('PWA service worker registration is missing');
if (pwa.includes('beforeinstallprompt') || pwa.includes('pwaToast') || pwa.includes('SKIP_WAITING')) {
  fail('PWA client must stay infrastructure-only');
}

for (const required of [
  "const CACHE_NAME='buchikui-pwa-v6';",
  "'./index.html'",
  "'./cases.js'",
  "'./appliance-repair-case.js'",
  "'./thailand-travel-safety-case.js'",
  "'./pwa.js'",
  'self.skipWaiting()',
  "networkFirst(request,'./index.html')",
]) {
  if (!serviceWorker.includes(required)) fail(`Missing service worker contract: ${required}`);
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

if (investmentCase.includes('costModel:')) fail('Case-specific cost-model renderer contract must not return');
if (!investmentCase.includes("panic:{")) fail('Compact advisor panic data required by renderHero is missing');
if (!investmentCase.includes("shareText:")) fail('Compact advisor share text is missing');
if (!investmentCase.includes("ogTitle:") || !investmentCase.includes("ogDescription:")) fail('Compact advisor social metadata is missing');
for (const required of [
  '自己买 IQQ        约 0.10%',
  '自己买国内纳指 ETF 约 0.60%–1.00%',
  '支付宝投顾        底层基金费用 + 约 0.50% 投顾费',
  '投顾不是“更高级的基金”，而是“基金 + 服务”',
]) {
  if (!investmentCase.includes(required)) fail(`Compact advisor core fee-layer logic is missing: ${required}`);
}
if (investmentCase.includes('display:none') || investmentCase.includes('<span style=')) {
  fail('Compact advisor case must not hide legacy contract text in content');
}

for (const required of [
  "slug:'thailand-travel-safety'",
  "layout:'compact'",
  "ogTitle:",
  "ogDescription:",
  "panic:{",
  "route:{",
  "sources:[",
  "takeaway:",
  "legal:",
  '免费但不合理',
  '行程被改变',
  '要求隔离',
]) {
  if (!thailandCase.includes(required)) fail(`Thailand travel safety case contract is missing: ${required}`);
}

if (!applianceCase.includes("slug:'appliance-repair-trap'")) fail('Appliance repair case is missing');
if (!applianceCase.includes('虚报故障部件')) fail('Appliance repair consumer-risk rule is missing');
if (!applianceCase.includes('这是危险的开始')) fail('Appliance repair opening must identify search ranking as the start of the risk chain');

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

console.log(`Frontend contract passed for ${localScripts.length} deferred local scripts with one simplified reader path and infrastructure-only PWA.`);
