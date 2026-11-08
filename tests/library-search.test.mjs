import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const context=vm.createContext({window:{}});
for(const file of ['book-order.js','render-cases.js','cases-data.js']){
  vm.runInContext(readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),context);
}
const R=context.window.BuchikuiRender;
const cases=context.window.BUCHIKUI_CASES;

test('具体消费问题搜索直达现有章节中真实存在的位置',()=>{
  for(const term of ['退卡','扣款','售假','维修','旅游']){
    const matches=cases.flatMap(item=>R.searchEntries(item,term).map(entry=>({item,entry})));
    assert.ok(matches.length>0,`${term} 必须有已发布内容`);
    for(const {item,entry} of matches){
      assert.ok(entry.title);
      if(entry.anchor) assert.ok(R.caseArticleHtml(item).includes(`id="${entry.anchor}"`));
    }
  }
});

test('多个关键词共同约束搜索，找不到时不伪造问题',()=>{
  const item=cases.find(item=>item.slug==='after-sales');
  const entries=R.searchEntries(item,'二手 售假');
  assert.equal(entries.length,1);
  assert.match(entries[0].title,/二手/);
  assert.ok(entries[0].anchor,'售假应匹配讨论商品真伪的具体内容');
  assert.equal(R.searchEntries(item,'不存在的品牌产地线索').length,0);
  assert.equal(R.searchEntries(item,'  ').length,0);
});

test('只有章节整体匹配时回到章节，不拼接不相关场景锚点',()=>{
  const item=cases.find(item=>item.slug==='after-sales');
  const entries=R.searchEntries(item,'写真 电池');
  assert.equal(entries.length,1);
  assert.equal(entries[0].anchor,'');
  assert.equal(entries[0].title,item.meta.question);
});
