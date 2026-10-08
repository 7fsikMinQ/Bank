// 간단 모드: 파일 = 문자 원문만(헤더·날짜 없음). 시각은 파일 수정시각. 기존 헤더 모드와 섞여도 정확해야 한다
const assert = require("assert");
const { aggregate, parseFile } = require("../scriptable/ledger-core.js");
const NOW = "2026-10-07T00:00:00Z";
const raw = (text, mtime, name = "Text.txt") => ({ name, text, mtime });

let r = aggregate([
  raw("[Web발신]\n비씨 신용 승인 12,000원 일시불 스타벅스", "2026-10-02T03:00:00Z"),
  raw("비씨 체크 승인 3,000원 카페", "2026-10-03T03:00:00Z", "Text 1.txt"),
  raw("[Web발신]\n현대 네이버 승인 45,000원 네이버", "2026-10-04T03:00:00Z", "Text 2.txt"),
  raw("[신한카드] 승인취소 5,000원", "2026-10-05T03:00:00Z", "Text 3.txt"),
  raw("우리카드 승인 7,000원", "2026-10-06T03:00:00Z", "Text 4.txt"),
  raw("[Web발신] 인증번호 승인 123456", "2026-10-06T04:00:00Z", "Text 5.txt"),       // 카드 문자 아님 → 무시
  raw("비씨 신용 승인 99,000원", "2026-09-30T14:59:00Z", "Text 6.txt"),                 // KST 9/30 23:59 → 전월
], NOW);
assert.deepStrictEqual(r.sum, { bc: 12000, hd: 45000, sh: -5000, wr: 10000 });
// 같은 문자가 두 자동화("승인","취소")에 걸려 파일 2개 → 1건
r = aggregate([raw("[Web발신]\n현대 네이버 취소 3,000원 A", "2026-10-02T03:00:00Z"), raw("[Web발신]\n현대 네이버 취소 3,000원 A", "2026-10-02T03:00:07Z", "Text 1.txt")], NOW);
assert.strictEqual(r.sum.hd, -3000); assert.strictEqual(r.dup, 1);
// 헤더 모드 파일과 간단 모드 파일 혼재
r = aggregate(["비씨\n2026-10-02T03:00:00+09:00\n비씨 신용 승인 1,000원 A", raw("비씨 신용 승인 2,000원 B", "2026-10-03T03:00:00Z")], NOW);
assert.strictEqual(r.sum.bc, 3000);
// 간단 모드에서 시각을 알 수 없으면 unparsed
assert.strictEqual(aggregate([raw("비씨 신용 승인 1,000원", "")], NOW).unparsed, 1);
// 간단 모드 월 경계: 수정시각이 KST 10/31 23:59:59 = 10월, 11/1 00:00:00 = 11월
assert.strictEqual(aggregate([raw("비씨 신용 승인 100원", "2026-10-31T14:59:59Z")], "2026-10-31T14:59:59Z").sum.bc, 100);
assert.strictEqual(aggregate([raw("비씨 신용 승인 100원", "2026-10-31T15:00:00Z")], "2026-10-31T14:59:59Z").sum.bc, 0);
console.log("SIMPLE MODE OK");
