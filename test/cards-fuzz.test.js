// BC바로(비씨+신용) / 우리(우리 | 비씨 체크) 규칙 퍼즈: 가맹점에 다른 카드 글자가 섞여도 흔들리지 않아야 한다
const assert = require("assert");
const { aggregate } = require("../scriptable/ledger-core.js");
let seed = 777; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = a => a[Math.floor(rnd() * a.length)];
const merchants = ["현대백화점", "우리약국", "신용카드센터", "비씨마트", "신한은행", "BC주유소", "우리은행ATM", "스타벅스", "체크인호텔"];
const heads = [
  ["bc", "비씨 신용"], ["bc", "비씨카드 신용"], ["bc", "BC 신용"],
  ["wr", "비씨 체크"], ["wr", "BC 체크"], ["wr", "우리카드"], ["wr", "우리"],
];
const senders = ["비씨", "우리", "비씨", "1588-4000"]; // 실제 태그/번호 혼합 (둘 다 걸린 자동화 시뮬레이션 포함)
for (let t = 0; t < 500; t++) {
  const exp = { bc: 0, wr: 0 }, files = [];
  for (let i = 0; i < 30; i++) {
    const [id, h] = pick(heads);
    const amt = 100 * (1 + Math.floor(rnd() * 3000)), cancel = rnd() < 0.2;
    const body = `[Web발신]\n${h} 1234 ${cancel ? "승인취소" : "승인"} ${amt.toLocaleString("en-US")}원 일시불 ${pick(merchants)} 잔액 5,000,000원`;
    const iso = `2026-10-0${1 + (i % 6)}T0${1 + Math.floor(i / 6)}:${String(i * 2 % 60).padStart(2, "0")}:00Z`;
    files.push(`${pick(senders)}\n${iso}\n${body}`);
    if (rnd() < 0.4) files.push(`${pick(senders)}\n${iso.replace(":00Z", ":07Z")}\n${body}`); // 다른 자동화가 7초 뒤 한 번 더 저장
    exp[id] += cancel ? -amt : amt;
  }
  const r = aggregate(files, "2026-10-07T00:00:00Z");
  // 태그가 무엇이든 본문 머리말이 우선이므로 항상 정확해야 한다
  assert.strictEqual(r.sum.bc, exp.bc); assert.strictEqual(r.sum.wr, exp.wr);
}
console.log("CARDS FUZZ OK");
