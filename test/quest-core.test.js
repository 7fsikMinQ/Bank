// 퀘스트 레벨·진행률 경계값 테스트 (확정 목표: BC 30/60만, 현대 40만, 우리 10만, 신한 목표 없음)
const assert = require("assert");
const { questOf, partyOf } = require("../scriptable/quest-core.js");
const core = require("../scriptable/ledger-core.js");
const C = Object.fromEntries(core.CARDS.map(c => [c.id, c]));
const q = (id, v) => questOf(C[id], v);
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

// BC바로: 30만 → 60만
assert.deepStrictEqual([q("bc", 0).level, q("bc", 299999).level, q("bc", 300000).level, q("bc", 599999).level, q("bc", 600000).level, q("bc", 99999999).level], [0, 0, 1, 1, 2, 2]);
near(q("bc", 0).pct, 0); near(q("bc", 150000).pct, 0.5); near(q("bc", 300000).pct, 0);    // 30만 달성 순간 바가 0에서 다시 시작
near(q("bc", 350000).pct, 5 / 30); near(q("bc", 450000).pct, 0.5); near(q("bc", 600000).pct, 1);
assert.strictEqual(q("bc", 350000).toNext, 250000); assert.strictEqual(q("bc", 350000).nextTarget, 600000);
assert.strictEqual(q("bc", 600000).label, "MAX"); assert.strictEqual(q("bc", 350000).label, "Lv1"); assert.strictEqual(q("bc", 100).label, "Lv0");
// 현대 ED3: 40만
assert.deepStrictEqual([q("hd", 399999).level, q("hd", 400000).level], [0, 1]);
assert.strictEqual(q("hd", 400000).label, "CLEAR"); assert.strictEqual(q("hd", 400000).max, true); near(q("hd", 80000).pct, 0.2);
// 우리다모아: 10만
assert.deepStrictEqual([q("wr", 99999).level, q("wr", 100000).level], [0, 1]); near(q("wr", 9900).pct, 0.099); assert.strictEqual(q("wr", 100000).label, "CLEAR");
// 신한: 목표 없음 — 0원보다 크면 달성
assert.strictEqual(q("sh", 0).level, 0); assert.strictEqual(q("sh", 1).level, 1); assert.strictEqual(q("sh", 1).label, "ACTIVE"); assert.strictEqual(q("sh", 0).label, "대기");
// 음수(취소 초과)·NaN·Infinity 는 0으로 고정되고 예외가 없다
for (const id of Object.keys(C)) for (const v of [-1, -1e9, NaN, undefined, -Infinity]) { const r = q(id, v); assert.ok(r.pct === 0 && r.level === 0, `${id} ${v}`); }
const inf = q("bc", Infinity); assert.ok(inf.pct >= 0 && inf.pct <= 1);
// 진행률은 항상 0~1
for (const id of Object.keys(C)) for (let v = 0; v <= 2000000; v += 7919) { const r = q(id, v); assert.ok(r.pct >= 0 && r.pct <= 1 && r.level <= r.levels, `${id} ${v}`); }
// 목표는 CARDS 설정에서 읽는다(숫자 복사 금지): 설정을 바꾸면 결과가 따라온다
assert.strictEqual(questOf({ tiers: [50000] }, 50000).level, 1);
// 파티 레벨: BC 2 + 현대 1 + 우리 1 + 신한 1 = 5
assert.deepStrictEqual(partyOf(core.CARDS, { bc: 0, hd: 0, wr: 0, sh: 0 }), { got: 0, total: 5 });
assert.deepStrictEqual(partyOf(core.CARDS, { bc: 350000, hd: 80000, wr: 9900, sh: 12000 }), { got: 2, total: 5 });
assert.deepStrictEqual(partyOf(core.CARDS, { bc: 600000, hd: 400000, wr: 100000, sh: 1 }), { got: 5, total: 5 });
// aggregate 와 연결: 승인 후 취소 → 합계 0 → 레벨 0
const now = "2026-10-08T12:00:00+09:00";
const ap = core.aggregate([{ name: "20261008_100000", text: "[Web발신]\nBC바로(1234) 승인\n홍*동님\n350,000원 일시불\n10/08 10:00", mtime: now }], now).sum;
assert.strictEqual(q("bc", ap.bc).level, 1);
const ac = core.aggregate([{ name: "20261008_100000", text: "[Web발신]\nBC바로(1234) 승인\n홍*동님\n350,000원 일시불\n10/08 10:00", mtime: now }, { name: "20261008_110000", text: "[Web발신]\nBC바로(1234)승인취소\n홍*동님\n350,000원\n10/08 11:00", mtime: now }], now).sum;
assert.strictEqual(ac.bc, 0); assert.strictEqual(q("bc", ac.bc).level, 0);
console.log("QUEST CORE OK (경계값·음수·설정 연동·aggregate 연결)");
