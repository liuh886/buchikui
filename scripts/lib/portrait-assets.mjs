import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {portraitAssetPathSync} from './portrait-content.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export async function portraitAssets(){
  const config=JSON.parse(await readFile(path.join(root,'editorial/consumer-portraits.json'),'utf8'));
  const result=[];
  for(const role of config.portraits){
    for(const thumbnail of [false,true]){
      const source=path.join(root,'editorial/portrait-assets',`${role.id}${thumbnail?'-thumb':''}.webp`);
      const size=(await stat(source)).size;
      if(size>(thumbnail?12:60)*1024)throw new Error(`角色图片超出预算：${source}`);
      result.push({source,target:portraitAssetPathSync(role.id,thumbnail)});
    }
  }
  return result;
}
export function portraitSwBlock(assets){
  return `// PORTRAIT_ASSETS_START\nconst PORTRAIT_ASSETS=${JSON.stringify(assets.map(a=>'./'+a.target))};\n// PORTRAIT_ASSETS_END`;
}
