#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";

const rootArg = process.argv[2];
const token = (process.env.CLOUDFLARE_WEB_ANALYTICS_TOKEN ?? "").trim();

if (!rootArg) {
  throw new Error("Usage: node scripts/inject-cloudflare-web-analytics.mjs <output-directory>");
}

const root = resolve(rootArg);
if (!existsSync(root) || !statSync(root).isDirectory()) {
  throw new Error(`Output directory does not exist: ${root}`);
}

if (!token) {
  console.log("Cloudflare Web Analytics: no manual token configured; leaving HTML unchanged.");
  process.exit(0);
}

const beaconSrc = "https://static.cloudflareinsights.com/beacon.min.js";
const beaconConfig = JSON.stringify({ token }).replaceAll("'", "&#39;");
const snippet = `<script type="module" src="${beaconSrc}" data-cf-beacon='${beaconConfig}'></script>`;

function collectHtmlFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...collectHtmlFiles(path));
    else if (entry.endsWith(".html")) files.push(path);
  }
  return files;
}

let injected = 0;
let alreadyPresent = 0;

for (const file of collectHtmlFiles(root)) {
  const html = readFileSync(file, "utf8");
  if (html.includes(beaconSrc)) {
    alreadyPresent += 1;
    continue;
  }

  const bodyClose = html.toLowerCase().lastIndexOf("</body>");
  if (bodyClose === -1) continue;

  const next = `${html.slice(0, bodyClose)}  ${snippet}\n${html.slice(bodyClose)}`;
  writeFileSync(file, next, "utf8");
  injected += 1;
}

if (injected + alreadyPresent === 0) {
  throw new Error(`Cloudflare Web Analytics token is set, but no complete HTML document was found in ${root}`);
}

console.log(`Cloudflare Web Analytics: injected=${injected}, already_present=${alreadyPresent}.`);
