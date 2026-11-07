import {writeFile} from 'node:fs/promises';
import {buildContentDatabase,ROOT} from './lib/content-db.mjs';
import path from 'node:path';

const {content,stats}=await buildContentDatabase();
await writeFile(path.join(ROOT,'content-data.js'),`// 生成文件：从 data/content.sqlite 导出的已审核内容。运行 npm run build。\nwindow.BUCHIKUI_CONTENT=${JSON.stringify(content,null,2)};\n`,'utf8');
console.log(JSON.stringify(stats,null,2));
