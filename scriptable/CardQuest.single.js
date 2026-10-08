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

const core = { CARDS, nextTarget, aggregate, monthInfo, prevYm, logItems };
const fm = FileManager.iCloud();
const root = fm.joinPath(fm.documentsDirectory(), "CardLedger");
const dir = fm.joinPath(root, "inbox");

// 문자 파일을 읽는 위치 3가지:
//  (1) CardLedger/inbox 폴더  (2) Scriptable 설정 > File Bookmarks 에 "ShortcutsFolder" 이름으로 연결한 폴더(예: iCloud Drive/Shortcuts)
//  (3) CardLedger/log.txt  ("텍스트 파일에 추가" 동작으로 한 파일에 이어 붙인 경우)
async function readTxtDir(d, now, okMonths, pres, items) {
  let failed = 0;
  // 파일 이름 보정: (a) iCloud에서 아직 내려받지 않은 파일은 ".이름.icloud" 로 보이므로 실제 이름으로 바꾸고(아래에서 내려받음)
  //                (b) "텍스트 저장"이 확장자 없이 만든 파일("텍스트" 등)도 읽는다(점이 없는 이름, 숨김 파일 제외)
  const names = fm.listContents(d).map(n => { const m = /^\.(.+)\.icloud$/.exec(n); return m ? m[1] : n; })
    .filter((n, i, a) => a.indexOf(n) === i && !n.startsWith(".") && (n.endsWith(".txt") || !n.includes(".")));
  for (const name of names) {
    try {
      const p = fm.joinPath(d, name);
      let mtime = "";
      try { const t = fm.modificationDate(p) || fm.creationDate(p); mtime = t ? t.toISOString() : ""; } catch (e) {}
      // 날짜로 시작하는 파일명(yyyyMM…)은 이름으로, 그 외(간단 모드 "Text 3.txt" 등)는 수정시각으로 이번 달/전달만 읽는다
      const byName = /^\d{6}/.test(name) ? pres.some(pr => name.startsWith(pr)) : (mtime ? okMonths.has(core.monthInfo(mtime).ym) : true);
      if (!byName) continue;
      if (!fm.isFileDownloaded(p)) await fm.downloadFileFromiCloud(p);
      const text = fm.readString(p);
      if (text.length > 5000) { failed++; continue; } // 비정상적으로 큰 파일은 무시
      items.push({ name, text, mtime });
    } catch (e) { failed++; }
  }
  return failed;
}

async function load(now) {
  // 이번 달(KST 기준)과 전달 prefix(yyyyMM) 파일만 읽어 iCloud 부담을 줄인다.
  // 파일명은 폰 현지 시각이라, 폰 시간대가 한국이 아니어도 월 경계 파일을 놓치지 않도록 전달까지 읽는다(월 분리는 코어가 KST로 정확히 수행).
  const ym = core.monthInfo(now.toISOString()).ym;
  const pres = [ym.replace("-", ""), core.prevYm(ym).replace("-", "")];
  const okMonths = new Set([ym, core.prevYm(ym)]);
  if (!fm.fileExists(dir)) throw new Error("inbox 폴더 없음: iCloud Drive/Scriptable/CardLedger/inbox");
  const items = []; let failed = await readTxtDir(dir, now, okMonths, pres, items);
  // (2) 연결된 폴더(선택)
  try {
    if (fm.bookmarkExists("ShortcutsFolder")) {
      const bd = fm.bookmarkedPath("ShortcutsFolder");
      if (fm.fileExists(bd)) failed += await readTxtDir(bd, now, okMonths, pres, items);
    }
  } catch (e) { failed++; }
  // (3) 로그 파일: 없으면 빈 파일을 만들어 둔다(단축어의 "텍스트 파일에 추가"에서 고를 수 있도록)
  try {
    const lp = fm.joinPath(root, "log.txt");
    if (!fm.fileExists(lp)) fm.writeString(lp, "");
    else {
      if (!fm.isFileDownloaded(lp)) await fm.downloadFileFromiCloud(lp);
      items.push(...core.logItems(fm.readString(lp), now.toISOString()));
    }
  } catch (e) { failed++; }
  return { items, failed };
}

// 수동 보정: CardLedger/adjust.json  예) {"bc": -5000, "wr": 12000}  (이번 달에만 적용하려면 매월 갱신)
function loadAdjust() {
  try {
    const p = fm.joinPath(root, "adjust.json");
    if (!fm.fileExists(p)) return {};
    if (!fm.isFileDownloaded(p)) return {};
    return JSON.parse(fm.readString(p));
  } catch (e) { return {}; }
}


// ── 실적 퀘스트 화면 ──────────────────────────────────────────────────────
// 홈 위젯: 카드별 캐릭터 + 경험치 바 + 레벨. 앱에서 실행(위젯 탭): 애니메이션 전체 화면(WebView, 인터넷 없음).
const FS = 13;                                   // 글자 크기(중간 위젯 11~14 권장)
const man = v => (v / 10000).toFixed(2).replace(/\.?0+$/, "");
const won = v => Math.max(0, Math.floor(v)).toLocaleString() + "원";
const pctColor = (q) => q.max ? "#30d158" : q.pct >= 0.67 ? "#ffd60a" : q.pct >= 0.34 ? "#ff9f0a" : "#ff453a";

function barImage(pct, hex, w, h) {              // 둥근 막대 그림 (실패하면 호출한 쪽에서 글자 막대로 대체)
  const dc = new DrawContext(); dc.size = new Size(w, h); dc.opaque = false; dc.respectScreenScale = true;
  dc.setFillColor(new Color("#8e8e93", 0.35)); dc.addPath(Path.roundedRect(new Rect(0, 0, w, h), h / 2, h / 2)); dc.fillPath();
  if (pct > 0) { dc.setFillColor(new Color(hex)); dc.addPath(Path.roundedRect(new Rect(0, 0, Math.max(h, w * pct), h), h / 2, h / 2)); dc.fillPath(); }
  return dc.getImage();
}
function textBar(pct) { const k = Math.round(pct * 8); return "▰".repeat(k) + "▱".repeat(8 - k); }

// 지난번에 본 레벨(앱 화면 레벨업 연출 중복 방지). 달이 바뀌면 초기화, 첫 실행이면 연출 없음.
const stateFile = fm.joinPath(root, "quest-state.json");
function readState(ym) {
  try {
    if (!fm.fileExists(stateFile)) return null;
    const s = JSON.parse(fm.readString(stateFile));
    return s && s.ym === ym && s.levels && typeof s.levels === "object" ? s.levels : {};
  } catch (e) { return null; }
}
function writeState(ym, levels) { try { fm.writeString(stateFile, JSON.stringify({ ym, levels })); } catch (e) {} }

function viewHtml(data) {                         // 숫자·고정 문구만 주입한다(문자 원문은 넣지 않음)
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<style>
:root{color-scheme:dark light;--bg:#101018;--fg:#f2f2f7;--sub:#9a9aa5;--card:#1c1c28;--track:#33334a}
@media (prefers-color-scheme:light){:root{--bg:#f2f2f7;--fg:#1c1c1e;--sub:#6c6c70;--card:#fff;--track:#d8d8e0}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font-family:-apple-system,system-ui,sans-serif;padding:max(16px,env(safe-area-inset-top)) 16px 28px}
h1{font-size:20px;margin:6px 0 2px}#sub{color:var(--sub);font-size:13px;margin-bottom:14px}
.card{background:var(--card);border-radius:16px;padding:14px;margin-bottom:12px}
.row{display:flex;align-items:center;gap:12px}.emo{font-size:44px;line-height:1}.emo.hop{animation:hop .8s ease 3}
.nm{font-weight:700;font-size:16px}.lv{font-size:13px;color:var(--sub)}.amt{margin-left:auto;font-weight:700;font-variant-numeric:tabular-nums}
.track{height:14px;border-radius:7px;background:var(--track);overflow:hidden;margin-top:10px}.fill{height:100%;width:0;border-radius:7px;transition:width 1.2s cubic-bezier(.2,.8,.2,1)}
.note{font-size:12px;color:var(--sub);margin-top:6px}.badge{display:inline-block;padding:1px 8px;border-radius:9px;font-size:12px;font-weight:700;background:#30d158;color:#04210d;margin-left:6px}
#pv{display:none;background:#5e5ce6;color:#fff;border-radius:10px;padding:8px 12px;margin-bottom:12px;font-size:13px}
.dev{display:none;margin-top:8px}.dev input{width:100%}
.pop{position:fixed;left:0;right:0;top:34%;text-align:center;font-size:30px;font-weight:800;pointer-events:none;opacity:0}.pop.go{animation:pop 2.2s ease}
.p{position:fixed;top:-30px;font-size:24px;pointer-events:none;animation:fall 2.4s linear forwards}
@keyframes hop{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
@keyframes pop{0%{opacity:0;transform:scale(.6)}20%{opacity:1;transform:scale(1.15)}80%{opacity:1}100%{opacity:0;transform:scale(1)}}
@keyframes fall{to{transform:translateY(110vh) rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.fill{transition:none}.emo.hop,.pop.go,.p{animation:none}}
</style></head><body>
<h1 id="t">실적 퀘스트</h1><div id="sub"></div><div id="pv">🔧 미리보기: 실제 합계·저장 파일은 바뀌지 않습니다</div><div id="list"></div><div class="pop" id="pop"></div>
<script>
const D = ${json};
const questOf = ${questOf.toString()};
const fmtMan = v => (v / 10000).toFixed(2).replace(/\\.?0+$/, "");
const color = q => q.max ? "#30d158" : q.pct >= 0.67 ? "#ffd60a" : q.pct >= 0.34 ? "#ff9f0a" : "#ff453a";
let values = {}, taps = 0, preview = false;
D.cards.forEach(c => values[c.id] = c.value);
function celebrate(names) {
  const pop = document.getElementById("pop"); pop.textContent = "🎉 LEVEL UP! " + names.join(" · "); pop.classList.remove("go"); void pop.offsetWidth; pop.classList.add("go");
  for (let i = 0; i < 18; i++) { const p = document.createElement("div"); p.className = "p"; p.textContent = ["🎉","✨","⭐"][i % 3]; p.style.left = (Math.random() * 95) + "%"; p.style.animationDelay = (Math.random() * 0.8) + "s"; document.body.appendChild(p); setTimeout(() => p.remove(), 3600); }
}
function render(up) {
  const list = document.getElementById("list"); list.innerHTML = ""; let got = 0, total = 0; const ups = [];
  D.cards.forEach(c => {
    const q = questOf(c, values[c.id]); got += q.level; total += q.levels;
    const lvUp = up.includes(c.id); if (lvUp) ups.push(c.name);
    const el = document.createElement("div"); el.className = "card";
    const right = c.noTarget ? (values[c.id] > 0 ? Math.floor(values[c.id]).toLocaleString() + "원" : "0원") : fmtMan(Math.max(0, values[c.id])) + "만";
    const note = q.kind === "active" ? (q.level ? "이번 달 사용 중! (목표 없음)" : "아직 사용 내역이 없어요")
      : q.max ? "퀘스트 클리어!" : (fmtMan(q.toNext) + "만 더 쓰면 " + (q.level + 1 <= q.levels ? "Lv" + (q.level + 1) : "클리어") + " (목표 " + fmtMan(q.nextTarget) + "만)");
    el.innerHTML = '<div class="row"><div class="emo' + (lvUp ? " hop" : "") + '">' + c.emoji + '</div><div><div class="nm">' + c.name + (q.max ? '<span class="badge">' + q.label + '</span>' : '') + '</div><div class="lv">' + (q.kind === "active" ? q.label : q.label) + '</div></div><div class="amt">' + right + '</div></div>'
      + (q.kind === "tier" ? '<div class="track"><div class="fill" style="background:' + color(q) + '"></div></div>' : '') + '<div class="note">' + note + '</div>';
    list.appendChild(el);
    const f = el.querySelector(".fill"); if (f) requestAnimationFrame(() => requestAnimationFrame(() => { f.style.width = Math.round(q.pct * 100) + "%"; }));
  });
  document.getElementById("sub").textContent = D.month + "월 " + D.day + "일 현재 · 파티 레벨 " + got + "/" + total;
  if (ups.length) celebrate(ups);
  if (preview) { const dv = document.createElement("div"); dv.className = "card"; dv.innerHTML = "<div class='nm'>미리보기 (화면 시험용)</div>"; D.cards.forEach(c => { const mx = c.noTarget ? 50000 : Math.max.apply(null, c.tiers) * 1.2; const r = document.createElement("div"); r.innerHTML = "<div class='note'>" + c.name + "</div><input type='range' min='0' max='" + mx + "' step='" + Math.max(1, Math.round(mx / 120)) + "' value='" + Math.max(0, values[c.id]) + "'>"; r.querySelector("input").oninput = e => { const before = questOf(c, values[c.id]).level; values[c.id] = +e.target.value; const after = questOf(c, values[c.id]).level; render(after > before ? [c.id] : []); }; dv.appendChild(r); }); list.appendChild(dv); }
}
document.getElementById("t").onclick = () => { if (++taps >= 7 && !preview) { preview = true; document.getElementById("pv").style.display = "block"; render([]); } };
render(D.leveledUp);
</script></body></html>`;
}

const w = new ListWidget();
w.backgroundColor = typeof Color.dynamic === "function" ? Color.dynamic(new Color("#ffffff"), new Color("#1c1c1e")) : new Color("#1c1c1e");
w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000);
w.url = "scriptable:///run/" + encodeURIComponent(Script.name());   // 탭 → 앱에서 실행(애니메이션 화면)

try {
  const now = new Date();
  const { items, failed } = await load(now);
  const res = core.aggregate(items, now.toISOString(), loadAdjust());
  const { sum, unparsed, info } = res;
  const warn = unparsed + failed;
  const quests = {}; core.CARDS.forEach(c => { quests[c.id] = questOf(c, sum[c.id]); });
  const party = partyOf(core.CARDS, sum);

  if (!config.runsInWidget) {
    // 앱 실행: 레벨업 연출 대상 계산 → 상태 저장 → 전체 화면
    const prior = readState(info.ym);
    const levels = {}; core.CARDS.forEach(c => { levels[c.id] = quests[c.id].level; });
    const leveledUp = prior === null ? [] : core.CARDS.filter(c => levels[c.id] > (prior[c.id] || 0)).map(c => c.id);
    writeState(info.ym, levels);
    const data = { month: info.month, day: info.day, days: info.days, leveledUp,
      cards: core.CARDS.map(c => ({ id: c.id, name: SHORT[c.id], emoji: EMOJI[c.id], noTarget: !!c.noTarget, tiers: c.tiers, value: sum[c.id] })) };
    const wv = new WebView(); await wv.loadHTML(viewHtml(data)); await wv.present(true);
  }

  const title = w.addText(`${info.month}월 실적 퀘스트  파티 ${party.got}/${party.total}` + (warn ? `  ⚠︎${warn}` : ""));
  title.font = Font.boldSystemFont(FS - 1); title.textColor = Color.gray();
  w.addSpacer(4);
  for (const c of core.CARDS) {
    const q = quests[c.id], v = sum[c.id];
    const row = w.addStack(); row.centerAlignContent();
    const e = row.addText(EMOJI[c.id]); e.font = Font.systemFont(FS + 5);
    row.addSpacer(4);
    const ns = row.addStack(); ns.size = new Size(FS * 5.4, 0);
    const n = ns.addText(SHORT[c.id]); n.font = Font.systemFont(FS); n.lineLimit = 1;
    if (q.kind === "tier") {
      let img = null; try { img = barImage(q.pct, pctColor(q), 90, 8); } catch (err) { img = null; }
      if (img) { const im = row.addImage(img); im.imageSize = new Size(90, 8); }
      else { const tb = row.addText(textBar(q.pct)); tb.font = Font.systemFont(FS - 3); tb.textColor = new Color(pctColor(q)); }
    } else {
      const a = row.addText(q.level ? "활동 중" : "대기"); a.font = Font.systemFont(FS - 1); a.textColor = q.level ? Color.green() : Color.gray();
    }
    row.addSpacer();
    const r = row.addText(q.kind === "active" ? won(v) : `${q.label} · ${man(Math.max(0, v))}만`);
    r.font = Font.boldMonospacedSystemFont(FS - 1); r.textColor = q.max || q.level && q.kind === "active" ? Color.green() : Color.gray();
    w.addSpacer(3);
  }
  const todo = core.CARDS.filter(c => quests[c.id].kind === "tier" && !quests[c.id].max)
    .sort((a, b) => quests[b.id].pct - quests[a.id].pct)[0];
  const foot = w.addText((todo ? `다음: ${SHORT[todo.id]} ${man(quests[todo.id].nextTarget)}만까지 ${man(quests[todo.id].toNext)}만` : "모든 퀘스트 클리어!")
    + ` · ${info.month}월 ${info.day}일 ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
  foot.font = Font.systemFont(FS - 3); foot.textColor = Color.gray(); foot.lineLimit = 1;
} catch (e) {
  const t = w.addText("오류: " + e.message + (e.line ? " (줄 " + e.line + ":" + e.column + ")" : "")); t.font = Font.systemFont(11); t.textColor = Color.red();
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
