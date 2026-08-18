import { readFile } from 'node:fs/promises';

const [html, app, styles, pwa, library, libraryStyles, serviceWorker, manifestRaw] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../pwa.js', import.meta.url), 'utf8'),
  readFile(new URL('../library.js', import.meta.url), 'utf8'),
  readFile(new URL('../library.css', import.meta.url), 'utf8'),
  readFile(new URL('../sw.js', import.meta.url), 'utf8'),
  readFile(new URL('../manifest.webmanifest', import.meta.url), 'utf8'),
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
if (!html.includes('href="library.css"')) fail('Personal library styles are missing');
if (!html.includes('id="libraryDialog"')) fail('Personal library dialog is missing');
if (!html.includes('data-library-open')) fail('Personal library entry point is missing');
if (!html.includes('src="library.js"')) fail('Personal library client is not loaded');
if (!html.includes('src="pwa.js"')) fail('PWA client is not loaded');

for (const required of [
  "navigator.serviceWorker.register('./sw.js')",
  "window.addEventListener('beforeinstallprompt'",
  'registration.waiting',
  "waiting.postMessage({type:'SKIP_WAITING'})",
]) {
  if (!pwa.includes(required)) fail(`Missing PWA client contract: ${required}`);
}

for (const required of [
  "const STORAGE_KEY='buchikui-library-v1';",
  'function recordRecent(item)',
  'function toggleFavorite(slug)',
  'function evidenceProgress(item)',
  '`buchikui-${item.slug}-evidence-v1`',
  'new MutationObserver(',
]) {
  if (!library.includes(required)) fail(`Missing personal library contract: ${required}`);
}

for (const required of [
  '.library-dialog',
  '.library-progress-track',
  '.mobile-bar{grid-template-columns:1.35fr .78fr .72fr}',
]) {
  if (!libraryStyles.includes(required)) fail(`Missing personal library style contract: ${required}`);
}

for (const required of [
  "const CACHE_NAME='buchikui-pwa-v2';",
  "'./index.html'",
  "'./cases.js'",
  "'./library.js'",
  "'./library.css'",
  "'./pwa.js'",
  "self.skipWaiting()",
  "networkFirst(request,'./index.html')",
]) {
  if (!serviceWorker.includes(required)) fail(`Missing service worker contract: ${required}`);
}

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

console.log(`Frontend contract passed for ${localScripts.length} deferred local scripts with installable PWA shell and local personal library.`);