// 시뮬레이션: 3년(2026~2028, 윤년 포함) 거래를 실제 4개 카드 문자 형식으로 만들고, 저장이 0~3시간 늦어지는 경우까지 섞어
// 매달 말일 정오/다음 달 정오 시점의 합계가 "결제한 달 기준 정답"과 항상 같은지 확인한다. 월 경계(말일 23:5x, 1일 00:0x) 거래를 일부러 많이 넣는다.
const assert = require("assert");
const { aggregate, daysInMonth } = require("../scriptable/ledger-core.js");
let seed = 20261008; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const pick = a => a[Math.floor(rnd() * a.length)];
const p2 = n => String(n).padStart(2, "0");
const W = "[Web발신]\n";
const fmt = {   // 실제 문자 형식 (id → [승인 만드는 함수, 취소 만드는 함수])
  bc: [(a, d) => W + `BC바로(5678) 승인\n홍*동님\n${a.toLocaleString()}원 일시불\n${d}\n무신사페이먼츠\n총누적1,120,900원`, (a, d) => W + `BC바로(5678)승인취소\n홍*동님\n${a.toLocaleString()}원 (${d.slice(0, 5)} 사용)\n${d}\n무신사페이먼츠`],
  hd: [(a, d) => W + `현대 네이버 승인\n홍*동\n${a.toLocaleString()}원 일시불\n${d}\n무신사\n누적516,000원`, (a, d) => W + `현대 네이버 취소\n홍*동\n${a.toLocaleString()}원 일시불\n${d}\n무신사\n누적506,100원`],
  sh: [(a, d) => W + `신한카드(9999)승인 홍*동 ${a.toLocaleString()}원\n(일시불)${d} 무신사페이먼\n누적91,583원`, (a, d) => W + `신한카드(9999)취소 홍*동 ${a.toLocaleString()}원\n(일시불)${d} 무신사페이먼\n누적81,683원`],
  wr: [(a, d) => W + `우리카드(1234)체크승인\n홍*동님\n${a.toLocaleString()}원\n${d}\n무신사`, (a, d) => W + `우리카드(1234)승인취소\n홍*동님\n${a.toLocaleString()}원\n${d}\n무신사`],
};
const KST = (y, m, d, h, mi, s = 0) => Date.UTC(y, m - 1, d, h - 9, mi, s);
const ymOf = ms => new Date(ms + 9 * 3600e3).toISOString().slice(0, 7);
let checked = 0, tx = 0;
for (let year = 2026; year <= 2028; year++) {
  const items = [], truth = {};   // truth[ym][card] = 정답 합계
  for (let m = 1; m <= 12; m++) {
    const last = daysInMonth(year, m), ym = `${year}-${p2(m)}`;
    truth[ym] = { bc: 0, hd: 0, sh: 0, wr: 0 };
    for (let i = 0; i < 60; i++) {
      // 40%는 월 경계(1일 00:00~00:10 / 말일 23:50~23:59), 나머지는 월 중 임의 시각
      const edge = rnd() < 0.4, first = rnd() < 0.5;
      const day = edge ? (first ? 1 : last) : 1 + Math.floor(rnd() * last);
      const hour = edge ? (first ? 0 : 23) : Math.floor(rnd() * 24), min = edge ? (first ? Math.floor(rnd() * 10) : 50 + Math.floor(rnd() * 10)) : Math.floor(rnd() * 60);
      const id = pick(["bc", "hd", "sh", "wr"]), amt = 100 * (1 + Math.floor(rnd() * 3000)), cancel = rnd() < 0.2;
      const txMs = KST(year, m, day, hour, min), text = fmt[id][cancel ? 1 : 0](amt, `${p2(m)}/${p2(day)} ${p2(hour)}:${p2(min)}`);
      const delay = rnd() < 0.5 ? 0 : Math.floor(rnd() * 3 * 3600e3);          // 저장이 최대 3시간 늦어질 수 있음
      const saved = txMs + 5000 + delay;
      items.push({ name: `Text ${items.length}.txt`, text, mtime: new Date(saved).toISOString(), saved });
      truth[ym][id] += cancel ? -amt : amt; tx++;
    }
  }
  for (let m = 1; m <= 12; m++) {
    const last = daysInMonth(year, m), ym = `${year}-${p2(m)}`;
    // 해당 달 15일 정오를 "지금"으로 두고 3년 치 문자를 전부 넘겨도, 그 달 거래(결제한 달 기준)만 정확히 합산되는지 → 정답과 일치
    const rAll = aggregate(items.map(({ saved, ...x }) => x), new Date(KST(year, m, Math.min(15, last), 12, 0)).toISOString());
    assert.deepStrictEqual(rAll.sum, truth[ym], `${ym}`);
    checked++;
  }
}
console.log(`MONTH SIM OK (36개월, ${tx}건: 경계 40%·늦은 저장 최대 3시간·취소 20%·윤년 포함 → 매달 합계 정답과 일치)`);
