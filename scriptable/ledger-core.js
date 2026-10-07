// 카드 실적 집계 코어 (Scriptable/Node 공용). 파싱 규칙은 CARDS 만 고치면 된다.
// ※ 문자 형식은 "가정"이다. 실제 문자 샘플로 match/exclude 를 반드시 보정할 것.
const CARDS = [
  { id: "bc",   name: "BC바로KPASS", match: /BC|비씨/,            target: 300000, exclude: [] },
  { id: "hd",   name: "현대ED3",     match: /현대카드|현대/,       target: 500000, exclude: [] },
  { id: "sh",   name: "신한",        match: /신한/,               target: 300000, exclude: [] },
  { id: "wr",   name: "우리다모아",  match: /우리/,               target: 100000, exclude: [] },
];

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
  let unparsed = 0;
  for (const f of files) {
    const rec = parseFile(f);
    if (!rec.iso || isNaN(new Date(rec.iso))) { unparsed++; continue; }
    if (ymKST(rec.iso) !== ym) continue;
    const r = classify(rec);
    if (r.status === "ok") sum[r.card.id] += r.amt;
    else if (r.status === "noamount") unparsed++;
  }
  return { ym, sum, unparsed };
}

if (typeof module !== "undefined") module.exports = { CARDS, aggregate, classify, parseFile, ymKST };
