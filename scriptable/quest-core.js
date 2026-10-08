// 실적 퀘스트 계산 (순수 함수, Scriptable/Node 공용). 카드 합계 v(원)와 CARDS 설정만으로 레벨·진행률을 만든다.
// 목표 금액은 CARDS[].tiers 에서 읽으므로 카드 위젯과 항상 같은 숫자를 쓴다.
const EMOJI = { bc: "🦊", hd: "🐻", sh: "🐱", wr: "🐰" };
const SHORT = { bc: "BC바로", hd: "현대ED3", sh: "신한", wr: "우리다모아" };

// card: {noTarget, tiers:[원…]}  v: 이번 달 합계(원, 취소로 음수가 될 수 있음 → 0으로 고정)
function questOf(card, v) {
  const val = Math.max(0, Number.isFinite(v) ? v : 0);
  if (card.noTarget) {
    const on = val > 0;
    return { kind: "active", level: on ? 1 : 0, levels: 1, max: on, pct: on ? 1 : 0, toNext: 0, nextTarget: 0, label: on ? "ACTIVE" : "대기" };
  }
  const t = card.tiers;
  let level = 0;
  while (level < t.length && val >= t[level]) level++;
  const max = level === t.length;
  const lo = level === 0 ? 0 : t[level - 1], hi = max ? t[t.length - 1] : t[level];
  const pct = max ? 1 : Math.min(1, Math.max(0, (val - lo) / (hi - lo)));
  return { kind: "tier", level, levels: t.length, max, pct, toNext: max ? 0 : hi - val, nextTarget: hi, label: max ? (t.length > 1 ? "MAX" : "CLEAR") : "Lv" + level };
}
// 파티 레벨: 달성한 구간 수 / 전체 구간 수 (신한은 1구간)
function partyOf(cards, sums) {
  let got = 0, total = 0;
  for (const c of cards) { const q = questOf(c, sums[c.id] || 0); got += q.level; total += q.levels; }
  return { got, total };
}
if (typeof module !== "undefined") module.exports = { questOf, partyOf, EMOJI, SHORT };
