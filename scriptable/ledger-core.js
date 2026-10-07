// 카드 실적 집계 코어 (Scriptable/Node 공용). 파싱 규칙은 CARDS/패턴만 고치면 된다.
// ※ 문자 형식은 "가정"이다. 실제 문자 샘플로 match/exclude/패턴을 반드시 보정할 것.

// tiers: 혜택 구간(원, 오름차순). confirmed:false = 조사로 확인 못 한 임시값 → 위젯에 "?"
// match 는 "발신번호 + 문자 앞부분(HEAD_LEN자)"에만 적용 → 가맹점명(현대백화점 등) 오분류 방지
const CARDS = [
  // BC 바로: 문자 머리말에 "비씨(또는 BC)"와 "신용"이 둘 다 있어야 한다 (순서·띄어쓰기 무관)
  { id: "bc", name: "BC바로KPASS", match: /^(?=[\s\S]*(?:비씨|BC))(?=[\s\S]*신용)/, tiers: [300000, 600000], confirmed: true, exclude: [] },
  { id: "hd", name: "현대ED3",     match: /현대카드/, tiers: [400000], confirmed: true, exclude: [] },
  { id: "sh", name: "신한",        match: /신한/,     tiers: [300000], confirmed: false, exclude: [] },
  // 우리다모아: "우리" 가 있거나, "비씨(BC) 체크" 로 표기되는 경우
  { id: "wr", name: "우리다모아",  match: /우리|(?:비씨|BC)\s*체크/, tiers: [300000], confirmed: false,
    exclude: [/관리비|국세|지방세|공과금|상품권|선불|교통카드|충전/] },
];
const HEAD_LEN = 30;
const MAX_BODY = 2000;      // 비정상적으로 큰 파일(악성/오류) 방어
const MAX_ADJUST = 10000000; // 수동 보정 상한(1천만 원)

const CANCEL = /취소/;
// 카드사가 붙여 주는 "누적 이용액"(교차검증용). 금액 추출 전에 본문에서 제거한다.
const CUMUL = /누적\s*(?:이용|사용)?\s*(?:금액|액)?\s*:?\s*([0-9][0-9,]*)\s*원/;
const CUMUL_G = new RegExp(CUMUL.source, "g");
// 잔액/한도/포인트 금액은 승인금액이 아니다
const NOISE_G = /(?:잔액|한도|잔여|가용|포인트|적립|누적)\s*:?\s*[0-9][0-9,]*\s*원?/g;
const AMOUNT = /([0-9][0-9,]*)\s*원/;

function nextTarget(card, v) {
  return card.tiers.find(t => v < t) ?? card.tiers[card.tiers.length - 1];
}

// 입력: {name,text,mtime} 또는 문자열.
//  (A) 헤더 모드: 1행 태그 / 2행 ISO일시 / 3행~ 본문  (단축어 동작 6개짜리 방식)
//  (B) 간단 모드: 파일 전체가 문자 원문. 시각은 파일명(yyyyMMdd-HHmmss)이 있으면 그것, 없으면 파일 수정시각(mtime)  (동작 2개짜리 방식)
const TAG_LINE = /^(?:비씨|BC|우리카드|현대카드|신한|우리|현대)$/;
function parseFile(item) {
  const text = typeof item === "string" ? item : item.text;
  const name = typeof item === "string" ? "" : item.name || "";
  const mtime = typeof item === "string" ? "" : item.mtime || "";
  const lines = text.split(/\r?\n/);
  const headerDate = normalizeIso(lines[1] || "");
  const isHeader = lines.length >= 3 && (TAG_LINE.test((lines[0] || "").trim()) || (headerDate && !isNaN(new Date(headerDate))));
  if (isHeader) {
    let iso = headerDate;
    if (!iso || isNaN(new Date(iso))) iso = isoFromName(name) || normalizeIso(mtime); // 2행이 비정상이면 파일명→수정시각으로 복구
    return { sender: (lines[0] || "").slice(0, 60), iso, body: lines.slice(2).join("\n").slice(0, MAX_BODY) };
  }
  const iso = isoFromName(name) || normalizeIso(mtime);
  return { sender: "", iso, body: text.slice(0, MAX_BODY) };
}

// 파일명 yyyyMMdd-HHmmss(-난수).txt 는 기기 로컬(KST) 시각
function isoFromName(name) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/.exec(name);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00` : "";
}

function classify(rec) {
  // 1순위: 본문 머리말("승인/취소/결제/이용" 앞)에서 카드 찾기 → 가맹점명(우리약국 등)에 속지 않음
  const cut = rec.body.search(/승인|취소|결제|이용/);
  const head = rec.body.slice(0, cut > 0 ? Math.min(cut, HEAD_LEN) : HEAD_LEN);
  let hits = CARDS.filter(c => c.match.test(head));
  // 2순위: 머리말에 카드 표시가 전혀 없을 때만 단축어가 1행에 적은 태그를 참고
  if (hits.length === 0) {
    const tagHits = CARDS.filter(c => c.match.test(rec.sender));
    if (tagHits.length === 1) hits = tagHits;
  }
  if (hits.length === 0) return { status: "nocard" };
  if (hits.length > 1) return { status: "ambiguous" };
  const card = hits[0];
  const clean = rec.body.replace(CUMUL_G, " ").replace(NOISE_G, " ");
  const m = AMOUNT.exec(clean);
  if (!m) return { status: "noamount", card };
  let amt = parseInt(m[1].replace(/,/g, ""), 10);
  if (card.exclude.some(re => re.test(rec.body))) return { status: "excluded", card };
  if (CANCEL.test(rec.body)) amt = -amt;
  return { status: "ok", card, amt };
}

// ── 날짜 규칙 ─────────────────────────────────────────────────────────────
// 한 달 = 한국시간(KST, +09:00, 서머타임 없음) 기준 "1일 00:00:00 ~ 말일 23:59:59".
// 말일은 월마다 28/29/30/31일이며 윤년(4의 배수, 단 100의 배수는 제외하되 400의 배수는 포함)의 2월은 29일.
// 시간대 표시가 없는 시각("2026-10-31T23:59:59")은 한국시간으로 해석해 폰의 시간대 설정에 영향받지 않게 한다.
function normalizeIso(iso) {
  const t = String(iso || "").trim();
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(t)) return t.replace(" ", "T") + "+09:00";
  return t;
}
function validDate(iso) { return !isNaN(new Date(normalizeIso(iso))); }
// KST 기준 "YYYY-MM"
function ymKST(iso) {
  const k = new Date(new Date(normalizeIso(iso)).getTime() + 9 * 3600 * 1000);
  return k.toISOString().slice(0, 7);
}
function daysInMonth(year, month) { return new Date(Date.UTC(year, month, 0)).getUTCDate(); } // month: 1~12
function prevYm(ym) { const [y, m] = ym.split("-").map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`; }
// 위젯 표시용: 이번 달 범위와 오늘이 며칠째인지
function monthInfo(nowIso) {
  const ym = ymKST(nowIso), [year, month] = ym.split("-").map(Number);
  const k = new Date(new Date(normalizeIso(nowIso)).getTime() + 9 * 3600 * 1000);
  return { ym, year, month, days: daysInMonth(year, month), day: k.getUTCDate() };
}

// adjust: {카드id: 원} 수동 보정(누락 문자 등). dedupe: 같은 발신자+본문+같은 분(分)은 1건
function aggregate(items, nowIso, adjust = {}) {
  const info = monthInfo(nowIso), ym = info.ym;
  const sum = Object.fromEntries(CARDS.map(c => [c.id, 0]));
  const cum = {}, cumAt = {}, lastSeen = new Map(), rows = [];
  let unparsed = 0, dup = 0;
  const recs = items.map(parseFile).map(r => ({ ...r, ts: validDate(r.iso) ? new Date(r.iso).getTime() : NaN }))
    .sort((a, b) => (isNaN(a.ts) ? -1 : isNaN(b.ts) ? 1 : a.ts - b.ts)); // 실제 시각 순(문자열 비교 금지: Z/+09:00 혼재)
  for (const rec of recs) {
    if (!rec.iso || !validDate(rec.iso)) { unparsed++; rows.push({ rec, status: "baddate" }); continue; }
    if (ymKST(rec.iso) !== ym) continue;
    const key = rec.body.trim(), t = rec.ts;
    if (lastSeen.has(key) && t - lastSeen.get(key) < 60000) { dup++; rows.push({ rec, status: "dup" }); continue; }
    lastSeen.set(key, t);
    const r = classify(rec);
    rows.push({ rec, status: r.status, card: r.card, amt: r.amt });
    if (r.status === "ok") {
      sum[r.card.id] += r.amt;
      const cm = CUMUL.exec(rec.body);
      if (cm && (cumAt[r.card.id] === undefined || rec.ts >= cumAt[r.card.id])) {
        cumAt[r.card.id] = rec.ts; cum[r.card.id] = parseInt(cm[1].replace(/,/g, ""), 10);
      }
    } else if (r.status === "noamount" || r.status === "ambiguous") unparsed++;
  }
  for (const [id, v] of Object.entries(adjust || {}))
    if (id in sum && typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= MAX_ADJUST) sum[id] += v;
  return { ym, info, sum, cum, unparsed, dup, rows };
}

if (typeof module !== "undefined") module.exports = { CARDS, nextTarget, normalizeIso, daysInMonth, prevYm, monthInfo, aggregate, classify, parseFile, ymKST, isoFromName };
