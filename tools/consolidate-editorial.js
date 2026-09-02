const fs = require('fs');
const vm = require('vm');
const { execFileSync } = require('child_process');

const caseFiles = [
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
  'layoff-compensation-case.js',
  'alibaba-auction-case.js',
  'qingdao-travel-case.js',
  'transport-platform-case.js'
];
const overrideFiles = [
  'editorial-overrides.js',
  'editorial-overrides-v2.js',
  'editorial-overrides-v3.js'
];

function load(files) {
  const context = vm.createContext({ window: { BUCHIKUI_CASES: [] }, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  }
  return JSON.parse(JSON.stringify(context.window.BUCHIKUI_CASES));
}

const mergedCases = load([...caseFiles, ...overrideFiles]);
if (mergedCases.length !== 16) {
  throw new Error(`Expected 16 cases after editorial merge, got ${mergedCases.length}`);
}

const fileBySlug = {
  rental: 'cases.js',
  'beauty-hair': 'cases.js',
  'bank-small-account-fee': 'compact-cases.js',
  'mobile-plan-cost': 'mobile-plan-case.js',
  'internet-court-self-litigation': 'court-case.js',
  'alipay-advisor-cost': 'investment-advisor-case.js',
  'bank-wealth-not-guaranteed': 'bank-wealth-case.js',
  'rental-credit-card-first': 'rental-payment-case.js',
  'appliance-repair-trap': 'appliance-repair-case.js',
  'airport-sales-pitch': 'airport-sales-case.js',
  'dating-safety': 'dating-safety-case.js',
  'thailand-travel-safety': 'thailand-travel-safety-case.js',
  'layoff-compensation': 'layoff-compensation-case.js',
  'alibaba-auction-trap': 'alibaba-auction-case.js',
  'qingdao-travel': 'qingdao-travel-case.js',
  'transport-platform-layered-fees': 'transport-platform-case.js'
};

const grouped = new Map();
for (const item of mergedCases) {
  const file = fileBySlug[item.slug];
  if (!file) throw new Error(`No source file mapping for ${item.slug}`);
  if (!grouped.has(file)) grouped.set(file, []);
  grouped.get(file).push(item);
}

for (const file of caseFiles) {
  const items = grouped.get(file) || [];
  let content;
  if (file === 'cases.js') {
    content = `window.BUCHIKUI_CASES = ${JSON.stringify(items, null, 2)};\n`;
  } else {
    if (items.length !== 1) throw new Error(`${file} expected one case, got ${items.length}`);
    content = `window.BUCHIKUI_CASES.push(${JSON.stringify(items[0], null, 2)});\n`;
  }
  fs.writeFileSync(file, content);
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

let index = fs.readFileSync('index.html', 'utf8');
for (const file of overrideFiles) {
  const line = new RegExp(`\\s*<script defer src="${file.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}"><\\/script>\\s*`, 'g');
  index = index.replace(line, '\n');
}
fs.writeFileSync('index.html', index);

for (const file of overrideFiles) fs.rmSync(file);

const consolidatedCases = load(caseFiles);
if (JSON.stringify(consolidatedCases) !== JSON.stringify(mergedCases)) {
  throw new Error('Consolidated source data differs from the pre-consolidation runtime data');
}

const advisor = consolidatedCases.find(item => item.slug === 'alipay-advisor-cost');
if (!advisor || !String(advisor.route?.title || '').includes('犹如冰山')) {
  throw new Error('Required advisor iceberg wording was lost');
}

// One-time migration artifacts remove themselves after a successful run.
fs.rmSync('tools/consolidate-editorial.js');
fs.rmSync('.github/workflows/consolidate-editorial.yml');

console.log('Editorial consolidation complete: 16 cases match runtime data; overrides removed; iceberg wording preserved.');
