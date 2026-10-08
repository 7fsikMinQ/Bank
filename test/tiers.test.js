// 확정 목표: BC바로 30만/60만 · 현대ED3 40만 · 우리다모아 10만 · 신한 목표 없음(0원만 아니면 달성)
const assert = require("assert");
const { CARDS, nextTarget } = require("../scriptable/ledger-core.js");
const by = Object.fromEntries(CARDS.map(c => [c.id, c]));
assert.deepStrictEqual(by.bc.tiers, [300000, 600000]);
assert.deepStrictEqual(by.hd.tiers, [400000]);
assert.deepStrictEqual(by.wr.tiers, [100000]);
assert.strictEqual(by.sh.noTarget, true);
assert.ok(CARDS.every(c => c.confirmed), "모든 카드 목표 확정(위젯에 ? 없음)");
// BC: 30만 미만 → 다음 목표 30만 / 30만 이상 → 60만 / 60만 이상 → 60만 유지
assert.deepStrictEqual([0, 299999, 300000, 599999, 600000, 1e6].map(v => nextTarget(by.bc, v)), [300000, 300000, 600000, 600000, 600000, 600000]);
assert.deepStrictEqual([0, 399999, 400000, 900000].map(v => nextTarget(by.hd, v)), [400000, 400000, 400000, 400000]);
assert.deepStrictEqual([0, 99999, 100000, 250000].map(v => nextTarget(by.wr, v)), [100000, 100000, 100000, 100000]);
console.log("TIERS OK (BC 30/60만 · 현대 40만 · 우리 10만 · 신한 목표 없음)");
