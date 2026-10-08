// 카드 실적 집계 코어 (Scriptable/Node 공용). 파싱 규칙은 CARDS/패턴만 고치면 된다.
// ※ 문자 형식은 "가정"이다. 실제 문자 샘플로 match/exclude/패턴을 반드시 보정할 것.

// tiers: 혜택 구간(원, 오름차순). noTarget:true = 목표 없음(0원보다 크면 달성). confirmed:false 이면 위젯에 "?" 표시(현재 전부 확정)
// match 는 "문자 머리말(승인/취소/결제/이용 글자 앞, 최대 HEAD_LEN자)"에만 적용 → 가맹점명(현대백화점 등) 오분류 방지
// ※ 규칙은 사용자 아이폰의 실제 카드 문자(2026-10-08)로 확인:
//   BC바로  : "BC바로(끝4자리) 승인" / "BC바로(…)승인취소"
//   우리    : "우리카드(…)체크승인" / "우리카드(…) 승인" / "우리카드(…)승인취소"
//   현대ED3 : "현대 네이버 승인" / "현대 네이버 취소"      ← "현대카드" 글자가 없음
//   신한    : "신한카드(…)승인 …" / "신한카드(…)취소 …"     ← 취소 문자에 "승인" 글자가 없음
const CARDS = [
  // BC 바로: "BC바로" (실제 문자) 또는 "비씨/BC" + "신용" 이 둘 다 있는 표기(대체 표기)
  { id: "bc", name: "BC바로KPASS", match: /BC\s*바로|^(?=[\s\S]*(?:비씨|BC))(?=[\s\S]*신용)/, tiers: [300000, 600000], confirmed: true, exclude: [] }, // 30만/60만 · 태그 없음: BC 계열 번호는 본문으로 구분
  // 네이버 현대카드 ED3: "현대 네이버" (실제 문자). 다른 현대카드는 세지 않는다
  { id: "hd", name: "현대ED3",     tag: /^현대(?:카드)?$/, match: /현대\s*네이버|네이버\s*현대/, tiers: [400000], confirmed: true, exclude: [] },
  // 신한카드: "신한카드", "신한해외"(달러 결제는 금액을 못 읽어 ⚠︎). 다른 카드인 "신한체크"는 제외
  { id: "sh", name: "신한",        tag: /^신한(?:카드)?$/, match: /신한(?!체크)/, tiers: [1], noTarget: true, confirmed: true, exclude: [] }, // 목표 없음: 0원만 아니면 달성
  // 우리다모아: "우리" (실제 문자: 우리카드(…)체크승인) 또는 "비씨(BC) 체크" 표기
  { id: "wr", name: "우리다모아",  tag: /^우리(?:카드)?$/, match: /우리|(?:비씨|BC)\s*체크/, tiers: [100000], confirmed: true,
    exclude: [/관리비|국세|지방세|공과금|상품권|선불|교통카드|충전/] },
];
const HEAD_LEN = 30;
const MAX_BODY = 2000;      // 비정상적으로 큰 파일(악성/오류) 방어
const MAX_ADJUST = 10000000; // 수동 보정 상한(1천만 원)

const CANCEL = /취소/;
// 카드사 문자의 "누적/총누적" 금액은 그달 누적이 아니므로 계산에 쓰지 않는다. 승인금액으로 오인하지 않도록 금액 추출 전에 지우기만 한다.
const CUMUL = /누적\s*(?:이용|사용)?\s*(?:금액|액)?\s*:?\s*([0-9][0-9,]*)\s*원/;
const CUMUL_G = new RegExp(CUMUL.source, "g");
// 잔액/한도/포인트 금액은 승인금액이 아니다
const NOISE_G = /(?:잔액|한도|잔여|가용|포인트|적립|누적)\s*:?\s*[0-9][0-9,]*\s*원?/g;
const AMOUNT = /([0-9][0-9,]*)\s*원/;
// 해외 달러 결제: 문자에 "원" 금액이 없고 달러만 있으면 아래 고정 환율로 원화 환산한다 (예: 22.00 달러 × 1320 = 29,040원)
const FX_USD_KRW = 1320;   // ← 환율을 바꾸려면 이 숫자만 수정
const USD = /([0-9][0-9,]*(?:\.[0-9]+)?)\s*(?:달러|USD)|(?:USD|\$)\s*([0-9][0-9,]*(?:\.[0-9]+)?)/i;

function nextTarget(card, v) {
  return card.tiers.find(t => v < t) ?? card.tiers[card.tiers.length - 1];
}

// 입력: {name,text,mtime} 또는 문자열.
//  (A) 헤더 모드: 1행 태그 / 2행 ISO일시 / 3행~ 본문  (단축어 동작 6개짜리 방식)
//  (B) 간단 모드: 파일 전체가 문자 원문. 시각은 파일명(yyyyMMdd-HHmmss)이 있으면 그것, 없으면 파일 수정시각(mtime)  (동작 2개짜리 방식)
const TAG_LINE = /^(?:비씨|BC|우리카드|현대카드|신한|우리|현대)$/;
function parseFile(item, nowIso) {
  const text = typeof item === "string" ? item : item.text;
  const name = typeof item === "string" ? "" : item.name || "";
  const mtime = typeof item === "string" ? "" : item.mtime || "";
  const lines = text.split(/\r?\n/);
  const headerDate = normalizeIso(lines[1] || "");
  const isHeader = lines.length >= 3 && (TAG_LINE.test((lines[0] || "").trim()) || (headerDate && !isNaN(new Date(headerDate))));
  if (isHeader) {
    let iso = headerDate;
    if (!iso || isNaN(new Date(iso))) iso = isoFromName(name) || normalizeIso(mtime); // 2행이 비정상이면 파일명→수정시각으로 복구
    const body = lines.slice(2).join("\n").slice(0, MAX_BODY);
    return { sender: (lines[0] || "").slice(0, 60), iso: bodyDateIso(body, iso || nowIso) || iso, recv: iso, body };
  }
  const ref = isoFromName(name) || normalizeIso(mtime);
  const body = text.slice(0, MAX_BODY);
  return { sender: "", iso: bodyDateIso(body, ref || nowIso) || ref, recv: ref, body };
}

// 문자 본문의 거래 일시 "MM/DD HH:mm"(예: 10/31 23:59, 실제 4개 카드 문자 모두 이 형식)로 월을 판정한다.
// → 자동화가 늦게 실행돼 파일 시각이 다음 달이 되어도 거래가 일어난 달로 정확히 들어간다.
// 연도는 기준 시각(파일 시각)에서 가장 가까운 해로 추정(12월→1월 경계 포함). 존재하지 않는 날짜(평년 2/29)·기준과 40일 넘게 차이 나면 무시.
const BODY_DATE = /(?:^|[^\d/])(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?!\d)/;
function bodyDateIso(body, refIso) {
  const m = BODY_DATE.exec(body);
  if (!m || !refIso || !validDate(refIso)) return "";
  const mo = +m[1], d = +m[2], h = +m[3], mi = +m[4];
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return "";
  const ref = new Date(normalizeIso(refIso)).getTime();
  const refYear = new Date(ref + 9 * 3600 * 1000).getUTCFullYear();
  let best = NaN, bestDiff = Infinity;
  for (const y of [refYear - 1, refYear, refYear + 1]) {
    const t = Date.UTC(y, mo - 1, d, h - 9, mi);                    // KST 시각 → UTC
    const k = new Date(t + 9 * 3600 * 1000);
    if (k.getUTCMonth() !== mo - 1 || k.getUTCDate() !== d) continue;   // 없는 날짜(평년 2/29 등)
    const diff = Math.abs(t - ref);
    if (diff < bestDiff) { bestDiff = diff; best = t; }
  }
  return isNaN(best) || bestDiff > 40 * 86400 * 1000 ? "" : new Date(best).toISOString();
}

// ── 로그 파일 방식 ─────────────────────────────────────────────────────────
// "텍스트 파일에 추가" 동작으로 한 파일(log.txt)에 문자를 계속 이어 붙인 경우. 문자는 모두 "[Web발신]"으로 시작하므로 그 단위로 나눈다.
// 문자에는 연도가 없으므로(MM/DD HH:mm) 파일 순서(= 시간순)를 이용해 "마지막 문자부터 거꾸로" 연도를 복원한다.
// → 로그가 1년 넘게 쌓여도 같은 날짜(예: 10/08)가 서로 다른 해로 정확히 구분된다.
function splitLog(text) {
  return String(text || "").split(/(?=\[Web발신\])/).map(x => x.trim()).filter(x => x.startsWith("[Web발신]") && x.length > 12);
}
function logItems(text, nowIso, maxChunks = 5000) {
  const chunks = splitLog(text).slice(-maxChunks);
  const items = new Array(chunks.length);
  let upper = new Date(normalizeIso(nowIso)).getTime() + 36 * 3600 * 1000;   // 다음(더 나중) 문자의 시각 + 여유 36시간
  for (let i = chunks.length - 1; i >= 0; i--) {
    const m = BODY_DATE.exec(chunks[i]);
    let t = NaN;
    if (m) {
      const mo = +m[1], d = +m[2], h = +m[3], mi = +m[4];
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31 && h <= 23 && mi <= 59) {
        const uy = new Date(upper + 9 * 3600 * 1000).getUTCFullYear();
        for (const y of [uy, uy - 1, uy - 2]) {                                 // upper 이전 중 가장 늦은 해
          const c = Date.UTC(y, mo - 1, d, h - 9, mi), k = new Date(c + 9 * 3600 * 1000);
          if (k.getUTCMonth() !== mo - 1 || k.getUTCDate() !== d) continue;     // 없는 날짜(평년 2/29)
          if (c <= upper) { t = c; break; }
        }
      }
    }
    if (isNaN(t)) t = upper - 36 * 3600 * 1000;                                // 날짜를 못 읽으면 다음 문자 시각으로 간주
    items[i] = { name: "log.txt", text: chunks[i], mtime: new Date(t).toISOString() };
    upper = t + 36 * 3600 * 1000;
  }
  return items;
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
    const tagHits = CARDS.filter(c => c.tag && c.tag.test(rec.sender.trim()));
    if (tagHits.length === 1) hits = tagHits;
  }
  if (hits.length === 0) return { status: "nocard" };
  if (hits.length > 1) return { status: "ambiguous" };
  const card = hits[0];
  const clean = rec.body.replace(CUMUL_G, " ").replace(NOISE_G, " ");
  const m = AMOUNT.exec(clean);
  let amt, fx = false;
  if (m) amt = parseInt(m[1].replace(/,/g, ""), 10);
  else {
    const u = USD.exec(clean);                       // 원 금액이 없을 때만 달러 환산
    if (!u) return { status: "noamount", card };     // 엔·유로 등 다른 통화는 계산하지 않고 ⚠︎
    amt = Math.round(parseFloat((u[1] || u[2]).replace(/,/g, "")) * FX_USD_KRW);
    fx = true;
  }
  if (card.exclude.some(re => re.test(rec.body))) return { status: "excluded", card };
  if (CANCEL.test(rec.body)) amt = -amt;
  return { status: "ok", card, amt, fx };
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

// adjust: 수동 보정(시작 잔액 등). 중복: 같은 본문이 60초 안에 2번 저장되면 1건
function aggregate(items, nowIso, adjust = {}) {
  const info = monthInfo(nowIso), ym = info.ym;
  const sum = Object.fromEntries(CARDS.map(c => [c.id, 0]));
  const lastSeen = new Map(), rows = [];
  let unparsed = 0, dup = 0;
  const recs = items.map(it => parseFile(it, nowIso)).map(r => ({ ...r, ts: validDate(r.iso) ? new Date(r.iso).getTime() : NaN, rts: r.recv && validDate(r.recv) ? new Date(normalizeIso(r.recv)).getTime() : NaN }))
    .sort((a, b) => (isNaN(a.ts) ? -1 : isNaN(b.ts) ? 1 : a.ts - b.ts)); // 실제 시각 순(문자열 비교 금지: Z/+09:00 혼재)
  for (const rec of recs) {
    if (!rec.iso || !validDate(rec.iso)) { unparsed++; rows.push({ rec, status: "baddate" }); continue; }
    if (ymKST(rec.iso) !== ym) continue;
    const key = rec.body.trim(), t = isNaN(rec.rts) ? rec.ts : rec.rts;   // 중복 판정은 "저장된 시각" 기준(월 판정은 거래 일시 기준)
    if (lastSeen.has(key) && t - lastSeen.get(key) < 60000) { dup++; rows.push({ rec, status: "dup" }); continue; }
    lastSeen.set(key, t);
    const r = classify(rec);
    rows.push({ rec, status: r.status, card: r.card, amt: r.amt, fx: r.fx });
    if (r.status === "ok") {
      sum[r.card.id] += r.amt;
    } else if (r.status === "noamount" || r.status === "ambiguous") unparsed++;
  }
  // adjust: {"2026-10": {"bc": 1111000}} 처럼 달을 지정하면 그 달에만 적용, {"bc": 1000} 처럼 쓰면 매달 적용
  const flat = {}, scoped = (adjust && typeof adjust[ym] === "object" && adjust[ym]) || {};
  for (const [k, v] of Object.entries(adjust || {})) if (typeof v === "number") flat[k] = v;
  for (const [id, v] of Object.entries({ ...flat, ...scoped }))
    if (id in sum && typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= MAX_ADJUST) sum[id] += v;
  return { ym, info, sum, unparsed, dup, rows };
}

if (typeof module !== "undefined") module.exports = { FX_USD_KRW, CARDS, bodyDateIso, splitLog, logItems, nextTarget, normalizeIso, daysInMonth, prevYm, monthInfo, aggregate, classify, parseFile, ymKST, isoFromName };
