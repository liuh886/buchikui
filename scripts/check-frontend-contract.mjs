import { readFile } from 'node:fs/promises';

const [html, app, styles, pwa, serviceWorker, manifestRaw, investmentCase] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../pwa.js', import.meta.url), 'utf8'),
  readFile(new URL('../sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'),
  readFile(new URL('../investment-advisor-case.js', import.meta.url), 'utf8'),
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
  'const href=safeHref(step.href);',
  'const href=safeHref(source.href);',
  'function renderMeta()',
  'function renderHero()',
  'function renderRoute()',
  'function renderSources()',
  "main.addEventListener('transitionend'",
  'caseTransitionController?.abort();',
]) {
  if (!app.includes(required)) fail(`Missing frontend contract: ${required}`);
}

for (const retired of ['let transitionTimer=', 'setTimeout(apply,100)', "setAttribute('href',step.href)"]) {
  if (app.includes(retired)) fail(`Retired frontend path returned: ${retired}`);
}

if (!styles.includes('overscroll-behavior:contain')) fail('Case switcher must contain overscroll');
if (!styles.includes('body.case-switcher-open{overflow:hidden}')) fail('Mobile case switcher must lock background scroll');

if (!html.includes('rel="manifest" href="manifest.webmanifest"')) fail('PWA manifest link is missing');
if (!html.includes('rel="apple-touch-icon"')) fail('Apple touch icon is missing');
if (!html.includes('src="pwa.js"')) fail('PWA registration client is not loaded');
if (!html.includes('data-share')) fail('Share action is missing');
if (!html.includes('data-print')) fail('Evidence print action is missing');

for (const retired of [
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

if (!pwa.includes("navigator.serviceWorker.register('./sw.js')")) fail('PWA service worker registration is missing');
if (pwa.includes('beforeinstallprompt') || pwa.includes('pwaToast') || pwa.includes('SKIP_WAITING')) {
  fail('PWA client must stay infrastructure-only');
}

for (const required of [
  "const CACHE_NAME='buchikui-pwa-v3';",
  "'./index.html'",
  "'./cases.js'",
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
if (!investmentCase.includes('1 万元持有 10 年后投顾约为 1.81 万元')) fail('Compact advisor cost comparison is missing');

const manifest = JSON.parse(manifestRaw);
if (manifest.display !== 'standalone') fail('PWA manifest must use standalone display mode');
if (manifest.start_url !== './' || manifest.scope !== './') fail('PWA start_url and scope must stay project-relative');
const iconPurposes = new Set((manifest.icons || []).map(icon => `${icon.sizes}:${icon.purpose || 'any'}`));
if (!iconPurposes.has('192x192:any')) fail('PWA manifest is missing a 192x192 app icon');
if (!iconPurposes.has('512x512:any')) fail('PWA manifest is missing a 512x512 app icon');
if (!iconPurposes.has('512x512:maskable')) fail('PWA manifest is missing a maskable 512x512 icon');

await Promise.all([
  readFile(new URL('../icons/icon-180.png', import.meta.url)),
  readFile(new URL('../icons/icon-192.png', import.meta.url)),
  readFile(new URL('../icons/icon-512.png', import.meta.url)),
  readFile(new URL('../icons/icon-maskable-512.png', import.meta.url)),
]);

console.log(`Frontend contract passed for ${localScripts.length} deferred local scripts with a minimal reader surface and infrastructure-only PWA.`);
