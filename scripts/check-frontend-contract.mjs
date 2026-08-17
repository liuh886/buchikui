import { readFile } from 'node:fs/promises';

const [html, app, styles] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../app.js', import.meta.url), 'utf8'),
  readFile(new URL('../styles.css', import.meta.url), 'utf8'),
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

console.log(`Frontend contract passed for ${localScripts.length} deferred local scripts.`);
