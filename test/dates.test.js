// 월 규칙 검증: 한 달 = KST 1일 00:00:00 ~ 말일 23:59:59 (28/29/30/31일, 윤년, 12→1월)
const assert = require("assert");
const { aggregate, daysInMonth, prevYm, monthInfo, normalizeIso, ymKST } = require("../scriptable/ledger-core.js");

// 1 월별 일수 표 (평년/윤년/세기 규칙)
const common = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
for (let y = 1990; y <= 2110; y++) {
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  for (let m = 1; m <= 12; m++) assert.strictEqual(daysInMonth(y, m), m === 2 && leap ? 29 : common[m - 1], `${y}-${m}`);
}
assert.strictEqual(daysInMonth(2024, 2), 29); assert.strictEqual(daysInMonth(2026, 2), 28);
assert.strictEqual(daysInMonth(2100, 2), 28); assert.strictEqual(daysInMonth(2000, 2), 29);

// 2 이전 달 (1월 → 전년 12월)
assert.strictEqual(prevYm("2026-01"), "2025-12"); assert.strictEqual(prevYm("2026-10"), "2026-09");
assert.strictEqual(prevYm("2026-03"), "2026-02");

// 3 모든 월 경계: 말일 23:59:59 = 그 달, 다음 달 1일 00:00:00 = 다음 달 (KST, 2023~2032 전체 120개월)
const p2 = n => String(n).padStart(2, "0");
let checked = 0;
for (let y = 2023; y <= 2032; y++) for (let m = 1; m <= 12; m++) {
  const last = daysInMonth(y, m), ym = `${y}-${p2(m)}`;
  const ny = m === 12 ? y + 1 : y, nm = m === 12 ? 1 : m + 1, nym = `${ny}-${p2(nm)}`;
  const first = `${ym}-01T00:00:00+09:00`, lastSec = `${ym}-${p2(last)}T23:59:59+09:00`, nextFirst = `${nym}-01T00:00:00+09:00`;
  assert.strictEqual(ymKST(first), ym); assert.strictEqual(ymKST(lastSec), ym); assert.strictEqual(ymKST(nextFirst), nym);
  // 1일 0시 직전 1초 = 전달 말일
  const justBefore = new Date(new Date(first).getTime() - 1000).toISOString();
  assert.strictEqual(ymKST(justBefore), prevYm(ym));
  // 집계: now = 말일 정오, 말일 마지막 초 문자는 포함 / 다음 달 첫 초 문자는 제외 / 이번 달 첫 초 문자는 포함
  const mk = (iso, a) => `비씨\n${iso}\n비씨 신용 승인 ${a}원 카페 ${a}`;
  const r = aggregate([mk(first, 100), mk(lastSec, 1000), mk(nextFirst, 10000)], `${ym}-${p2(last)}T12:00:00+09:00`);
  assert.strictEqual(r.sum.bc, 1100, ym); assert.strictEqual(r.info.days, last); assert.strictEqual(r.info.day, last);
  // 다음 달 시점에서 보면: 다음 달 문자만 포함
  const r2 = aggregate([mk(first, 100), mk(lastSec, 1000), mk(nextFirst, 10000)], `${nym}-01T12:00:00+09:00`);
  assert.strictEqual(r2.sum.bc, 10000, nym);
  checked++;
}
assert.strictEqual(checked, 120);

// 4 monthInfo: 오늘이 며칠째 / 총 일수
assert.deepStrictEqual(monthInfo("2026-02-28T23:59:59+09:00"), { ym: "2026-02", year: 2026, month: 2, days: 28, day: 28 });
assert.deepStrictEqual(monthInfo("2028-02-29T00:00:00+09:00"), { ym: "2028-02", year: 2028, month: 2, days: 29, day: 29 });
assert.deepStrictEqual(monthInfo("2026-10-31T15:00:00Z"), { ym: "2026-11", year: 2026, month: 11, days: 30, day: 1 }); // UTC 15:00 = KST 다음날 0시
assert.deepStrictEqual(monthInfo("2026-12-31T15:00:00Z"), { ym: "2027-01", year: 2027, month: 1, days: 31, day: 1 });

// 5 시간대 표시 없는 시각은 KST로 해석 → 폰/서버 시간대와 무관 (TZ 환경변수를 바꿔 반복 실행됨)
assert.strictEqual(normalizeIso("2026-10-31T23:59:59"), "2026-10-31T23:59:59+09:00");
assert.strictEqual(normalizeIso("2026-10-31 23:59"), "2026-10-31T23:59+09:00");
assert.strictEqual(normalizeIso("2026-10-31T23:59:59Z"), "2026-10-31T23:59:59Z");
assert.strictEqual(ymKST("2026-10-31T23:59:59"), "2026-10"); assert.strictEqual(ymKST("2026-11-01T00:00:00"), "2026-11");

// 6 Z / +09:00 혼재 시 "가장 늦은 문자" 판정과 정렬은 실제 시각 기준
const r3 = aggregate([
  "비씨\n2026-10-05T10:00:00+09:00\n비씨 신용 승인 1,000원 A 누적 1,000원",   // = 01:00Z
  "비씨\n2026-10-05T00:30:00Z\n비씨 신용 승인 2,000원 B 누적 99,000원",       // = 00:30Z (더 이른 시각)
], "2026-10-07T00:00:00Z");
assert.strictEqual(r3.cum.bc, 1000);

// 7 파일명 복구(yyyyMMdd-HHmmss)도 KST 월로
const r4 = aggregate([{ name: "20261031-235959-1.txt", text: "비씨\n\n비씨 신용 승인 500원 편의점" }], "2026-10-31T14:59:59Z");
assert.strictEqual(r4.sum.bc, 500);

console.log("DATES OK (120 months, leap years, year rollover, timezone-independent)");
