import {readFile,writeFile} from 'node:fs/promises';
import {portraitAssets,portraitSwBlock} from './lib/portrait-assets.mjs';
const file=new URL('../sw.js',import.meta.url);
const assets=await portraitAssets();
const old=await readFile(file,'utf8');
if(!old.includes('// PORTRAIT_ASSETS_START'))throw new Error('Missing SW portrait asset marker');
await writeFile(file,old.replace(/\/\/ PORTRAIT_ASSETS_START[\s\S]*?\/\/ PORTRAIT_ASSETS_END/,portraitSwBlock(assets)),'utf8');
console.log(`Portrait assets: ${assets.length} hashed images, service-worker manifest synchronized.`);
