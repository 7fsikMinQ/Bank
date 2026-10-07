const assert = require("assert");
const { aggregate, CARDS, nextTarget, classify, isoFromName } = require("../scriptable/ledger-core.js");
const f = (s, iso, b) => `${s}\n${iso}\n${b}`;
const NOW = "2026-10-07T00:00:00Z";
const sumOf = (files, adj) => aggregate(files, NOW, adj);

// 1 기본: 승인/전액취소/부분취소/KST 월경계/금액없음
let r = sumOf([
  f("1588-4000", "2026-10-02T03:00:00Z", "비씨 신용 승인 12,000원 일시불 스타벅스"),
  f("1588-4000", "2026-10-03T03:00:00Z", "비씨 신용 승인 30,000원 일시불 GS25"),
  f("1588-4000", "2026-10-04T03:00:00Z", "비씨 신용 승인취소 30,000원 GS25"),
  f("1544-7000", "2026-10-05T03:00:00Z", "현대카드 ED3 승인 45,000원 네이버"),
  f("1544-7000", "2026-10-06T03:00:00Z", "현대카드 부분취소 5,000원 네이버"),
  f("1544-7200", "2026-09-30T14:59:00Z", "신한카드 승인 99,000원"),
  f("1544-7200", "2026-09-30T15:01:00Z", "신한카드 승인 10,000원"),
  f("1588-9999", "2026-10-06T03:00:00Z", "우리카드 해외승인 USD 10"),
  f("1588-9999", "2026-10-06T04:00:00Z", "우리카드 승인 7,000원"),
]);
assert.deepStrictEqual(r.sum, { bc: 12000, hd: 40000, sh: 10000, wr: 7000 });
assert.strictEqual(r.unparsed, 1);

// 2 오분류 방지: 신한 문자의 가맹점이 현대/우리/BC 여도 신한으로, 잔액·누적 금액은 승인금액이 아님
r = sumOf([
  f("1544-7200", "2026-10-02T03:00:00Z", "[신한카드] 승인 50,000원 일시불 현대백화점 누적 50,000원"),
  f("1544-7200", "2026-10-03T03:00:00Z", "[신한카드] 승인 20,000원 일시불 우리약국"),
  f("x", "2026-10-04T03:00:00Z", "[Web발신] 신한카드 승인 잔액 1,000,000원 사용 30,000원"),
  f("1544-7200", "2026-10-05T03:00:00Z", "[신한카드] 승인 3,000원 BC마트"),
]);
assert.deepStrictEqual(r.sum, { bc: 0, hd: 0, sh: 103000, wr: 0 });

// 3 누적 이용액: 가장 늦은 문자 기준
r = sumOf([
  f("1588-4000", "2026-10-05T03:00:00Z", "비씨 신용 승인 8,000원 GS25 누적 20,000원"),
  f("1588-4000", "2026-10-02T03:00:00Z", "비씨 신용 승인 12,000원 스타벅스 누적 12,000원"),
]);
assert.strictEqual(r.sum.bc, 20000); assert.strictEqual(r.cum.bc, 20000);

// 4 중복(같은 문자가 두 자동화에 걸려 2파일) 제거 / 서로 다른 분의 동일 결제는 유지
const same = f("1588-4000", "2026-10-02T03:00:10Z", "비씨 신용 승인 4,500원 카페");
r = sumOf([same, same, f("1588-4000", "2026-10-02T03:05:10Z", "비씨 신용 승인 4,500원 카페")]);
assert.strictEqual(r.sum.bc, 9000); assert.strictEqual(r.dup, 1);

// 5 2행 일시가 깨졌으면 파일명으로 복구, 그것도 없으면 unparsed
r = aggregate([{ name: "20261003-101010-1234.txt", text: "1588-4000\n\n비씨 신용 승인 1,000원" }], NOW);
assert.strictEqual(r.sum.bc, 1000);
assert.strictEqual(sumOf(["1588-4000\n깨짐\n비씨 신용 승인 1,000원"]).unparsed, 1);
assert.strictEqual(isoFromName("20261003-101010-1.txt"), "2026-10-03T10:10:10+09:00");

// 6 수동 보정, 제외항목, 모호(카드 2개 동시 매칭)
r = sumOf([
  f("1588-9999", "2026-10-02T03:00:00Z", "우리카드 승인 150,000원 OO아파트 관리비"),
  f("1588-9999", "2026-10-03T03:00:00Z", "우리카드 승인 10,000원 편의점"),
  f("1588-9999", "2026-10-04T03:00:00Z", "신한카드 우리카드 승인 1,000원"),
], { wr: 5000, zz: 9 });
assert.strictEqual(r.sum.wr, 15000); assert.strictEqual(r.unparsed, 1);

// 7 구간: BC 2구간, 달성 후 다음 구간, 전 구간 달성
const bc = CARDS[0];
assert.deepStrictEqual([0, 299999, 300000, 599999, 600000, 900000].map(v => nextTarget(bc, v)),
  [300000, 300000, 600000, 600000, 600000, 600000]);

// 8 퍼즈: 무작위 승인/취소 → 순수 계산과 항상 일치, 예외 없음
let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const tags = [["bc", "비씨 신용"], ["hd", "현대카드"], ["sh", "[신한카드]"], ["wr", "우리카드"], ["wr", "비씨 체크"]];
for (let t = 0; t < 300; t++) {
  const exp = { bc: 0, hd: 0, sh: 0, wr: 0 }, files = [];
  for (let i = 0; i < 40; i++) {
    const [id, tag] = tags[Math.floor(rnd() * 5)];
    const amt = 100 * (1 + Math.floor(rnd() * 5000)), cancel = rnd() < 0.2;
    const day = 1 + Math.floor(rnd() * 6), min = i; // 분이 달라 중복 제거에 안 걸림
    const body = `${tag} ${cancel ? "승인취소" : "승인"} ${amt.toLocaleString("en-US")}원 일시불 현대백화점 잔액 9,999,999원`;
    files.push(f("1", `2026-10-0${day}T0${Math.floor(min / 60) + 1}:${String(min % 60).padStart(2, "0")}:00Z`, body));
    exp[id] += cancel ? -amt : amt;
  }
  assert.deepStrictEqual(sumOf(files).sum, exp);
}

// 9 BC/우리 판별 규칙 (사용자 지정): BC바로 = "비씨"+"신용" 둘 다 / 우리 = "우리" 또는 "비씨 체크"
const cls = (sender, body) => { const c = classify({ sender, body }); return c.card ? c.card.id : c.status; };
assert.strictEqual(cls("비씨", "[Web발신]\n비씨 신용 1234 승인 12,000원"), "bc");
assert.strictEqual(cls("비씨", "비씨카드 신용 승인 12,000원"), "bc");          // 비씨 ... 신용 (사이에 글자)
assert.strictEqual(cls("비씨", "신용 비씨 승인 12,000원"), "bc");               // 순서 반대
assert.strictEqual(cls("비씨", "BC 신용 승인 12,000원"), "bc");                 // 영문 BC
assert.strictEqual(cls("비씨", "비씨 체크 1234 승인 3,000원"), "wr");           // BC 체크 → 우리
assert.strictEqual(cls("비씨", "BC 체크 승인 3,000원"), "wr");
assert.strictEqual(cls("우리", "우리카드 승인 5,000원"), "wr");                 // 우리 글자
assert.strictEqual(cls("비씨", "비씨 승인 5,000원"), "nocard");                 // 비씨만 있고 신용/체크 없음 → 모름(⚠︎)
assert.strictEqual(cls("비씨", "신용 승인 5,000원"), "nocard");                 // 신용만 있고 비씨 없음 → BC 아님
assert.strictEqual(cls("비씨", "비씨 신용 승인 7,000원 우리약국"), "bc");        // 가맹점의 "우리"는 무시
assert.strictEqual(cls("비씨", "비씨 체크 승인 7,000원 신용카드센터"), "wr");     // 가맹점의 "신용"은 무시
// 같은 문자가 "비씨"·"우리" 두 자동화에 모두 걸려 태그만 다른 2파일 → 1건
r = sumOf([
  f("비씨", "2026-10-02T03:00:00Z", "비씨 체크 승인 3,000원 카페"),
  f("우리", "2026-10-02T03:00:05Z", "비씨 체크 승인 3,000원 카페"),
  f("비씨", "2026-10-03T03:00:00Z", "비씨 신용 승인 8,000원 GS25"),
]);
assert.deepStrictEqual([r.sum.bc, r.sum.wr, r.dup], [8000, 3000, 1]);
// 태그가 "비씨"(애매)여도 본문으로 정확히 갈린다 / 태그가 "우리카드"면 본문이 "비씨 신용"이어도 태그가 우선하므로 주의(가이드: 우리 자동화 태그는 우리카드)
assert.strictEqual(cls("우리카드", "승인 2,000원"), "wr");                    // 본문에 카드표시 없으면 태그 사용
assert.strictEqual(cls("우리카드", "비씨 신용 승인 7,000원 우리약국"), "bc");   // 본문이 우선 (우리약국 때문에 "우리" 자동화도 실행돼도 안전)
assert.strictEqual(cls("신한", "비씨 체크 승인 7,000원"), "wr");
console.log("ALL OK");
