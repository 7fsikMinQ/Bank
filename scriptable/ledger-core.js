// 카드 실적 집계 코어 (Scriptable/Node 공용). 파싱 규칙은 CARDS 만 고치면 된다.
// ※ 문자 형식은 "가정"이다. 실제 문자 샘플로 match/exclude 를 반드시 보정할 것.
// tiers: 혜택 구간(원, 오름차순). confirmed:false 는 조사로 확인 못 한 임시값 → 위젯에 "?" 표시.
// 우리 제외항목(조사 확인): 관리비·세금·공과금·상품권/선불충전·교통카드충전·무이자할부·매출취소 등
const CARDS = [
  { id: "bc", name: "BC바로KPASS", match: /BC|비씨/,       tiers: [300000, 600000], confirmed: true,  exclude: [] },
  { id: "hd", name: "현대ED3",     match: /현대카드|현대/,  tiers: [400000],         confirmed: true,  exclude: [] },
  { id: "sh", name: "신한",        match: /신한/,          tiers: [300000],         confirmed: false, exclude: [] },
  { id: "wr", name: "우리다모아",  match: /우리/,          tiers: [300000],         confirmed: false,
    exclude: [/관리비|국세|지방세|공과금|상품권|선불|교통카드|충전/] },
];

// 문자에 카드사가 넣어 주는 "누적 이용액"(조사 확인: 전업카드사 공통 제공). 교차검증용.
const CUMUL = /누적\s*(?:이용|사용)?\s*(?:금액|액)?\s*:?\s*([0-9][0-9,]*)\s*원/;

// 현재 구간 기준 "다음 목표" (모두 달성하면 마지막 구간)
function nextTarget(card, v) {
  return card.tiers.find(t => v < t) ?? card.tiers[card.tiers.length - 1];
}

// 취소 먼저 판정 ("승인취소", "취소", "부분취소" 모두 음수)
const CANCEL = /취소/;
const AMOUNT = /([0-9][0-9,]*)\s*원/;

// 파일 하나 = [발신자, ISO일시, 본문...] 3줄 이상
function parseFile(text) {
  const lines = text.split(/\r?\n/);
  return { sender: lines[0] || "", iso: lines[1] || "", body: lines.slice(2).join("\n") };
}

function classify(rec) {
  const hay = rec.sender + "\n" + rec.body;
  const card = CARDS.find(c => c.match.test(hay));
  if (!card) return { status: "nocard" };
  const m = AMOUNT.exec(rec.body);
  if (!m) return { status: "noamount", card };
  let amt = parseInt(m[1].replace(/,/g, ""), 10);
  if (card.exclude.some(re => re.test(rec.body))) return { status: "excluded", card };
  if (CANCEL.test(rec.body)) amt = -amt;
  return { status: "ok", card, amt };
}

// KST 기준 "YYYY-MM"
function ymKST(iso) {
  const d = new Date(iso);
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  return k.toISOString().slice(0, 7);
}

function aggregate(files, nowIso) {
  const ym = ymKST(nowIso);
  const sum = Object.fromEntries(CARDS.map(c => [c.id, 0]));
  const cum = {}; // 카드별 이번 달 가장 늦은 문자의 누적이용액
  const cumAt = {};
  let unparsed = 0;
  for (const f of files) {
    const rec = parseFile(f);
    if (!rec.iso || isNaN(new Date(rec.iso))) { unparsed++; continue; }
    if (ymKST(rec.iso) !== ym) continue;
    const r = classify(rec);
    if (r.status === "ok") {
      sum[r.card.id] += r.amt;
      const cm = CUMUL.exec(rec.body);
      if (cm && (!cumAt[r.card.id] || rec.iso > cumAt[r.card.id])) {
        cumAt[r.card.id] = rec.iso; cum[r.card.id] = parseInt(cm[1].replace(/,/g, ""), 10);
      }
    } else if (r.status === "noamount") unparsed++;
  }
  return { ym, sum, cum, unparsed };
}

if (typeof module !== "undefined") module.exports = { CARDS, nextTarget, aggregate, classify, parseFile, ymKST };
