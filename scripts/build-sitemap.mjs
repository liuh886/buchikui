import {writeFile} from 'node:fs/promises';
import {buildSitemap} from './prerender-cases.mjs';
await writeFile(new URL('../sitemap.xml',import.meta.url),await buildSitemap(),'utf8');
