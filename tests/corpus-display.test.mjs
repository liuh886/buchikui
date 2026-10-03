// 来源显示口径：法源、裁判、媒体报道、办事入口各自怎么显示。
// 这层曾经出过真实回归——迁移到 sourceId 时书名号被套到裁判名上，
// 且缺 type 的待核验记录被一律标成「规则」。这些断言就是那次事故的护栏。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sourceTitle, sourceLabel } from '../scripts/lib/corpus.mjs';

test('法源加书名号并带法源类型前缀', () => {
  assert.equal(
    sourceTitle({ kind: 'law', type: '法律', title: '中华人民共和国反不正当竞争法（2025 年修订）' }),
    '【法律】《中华人民共和国反不正当竞争法（2025 年修订）》'
  );
  assert.equal(sourceLabel({ kind: 'law', type: '司法解释' }), '司法解释');
});

test('已经带书名号的法源不会被二次包裹', () => {
  assert.equal(sourceTitle({ kind: 'law', type: '部门规章', title: '《消费者权益保护法实施条例》' }), '【部门规章】《消费者权益保护法实施条例》');
});

test('裁判名不加书名号——给案件名套《》是错的', () => {
  assert.equal(sourceTitle({ kind: 'case', weight: '生效裁判', title: '珠海市香洲区人民法院非营运车辆用于出租停运费未获支持' }),
    '珠海市香洲区人民法院非营运车辆用于出租停运费未获支持');
});

test('媒体报道不加书名号', () => {
  assert.equal(sourceTitle({ kind: 'reference', title: '检察日报机场里办尊享卡别被优惠套路了' }), '检察日报机场里办尊享卡别被优惠套路了');
});

test('办事入口不加书名号、不加标签', () => {
  assert.equal(sourceTitle({ kind: 'portal', title: '全国 12315 平台' }), '全国 12315 平台');
  assert.equal(sourceLabel({ kind: 'portal' }), '');
});

test('权重未知时不编造标签，而不是回退成「规则」', () => {
  // 一部法律不是「规则」，一部民诉法也不该被降级成「规则」。
  assert.equal(sourceLabel({ kind: 'law', title: '中华人民共和国民事诉讼法2023年修正' }), '');
  assert.equal(sourceTitle({ kind: 'law', title: '中华人民共和国民事诉讼法2023年修正' }), '《中华人民共和国民事诉讼法2023年修正》');
  assert.equal(sourceLabel({ kind: 'case', title: '某案' }), '');
});

test('裁判权重用 weight 字段表达，不是 kind', () => {
  assert.equal(sourceLabel({ kind: 'case', weight: '典型案例' }), '典型案例');
  // sourceTitle 对裁判不套书名号，所以 weight 不出现在标题里
  assert.equal(sourceTitle({ kind: 'case', weight: '典型案例', title: '某公司虚假宣传案' }), '某公司虚假宣传案');
});