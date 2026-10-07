// 카드 실적 집계 코어 (Scriptable/Node 공용). 파싱 규칙은 CARDS/패턴만 고치면 된다.
// ※ 문자 형식은 "가정"이다. 실제 문자 샘플로 match/exclude/패턴을 반드시 보정할 것.

// tiers: 혜택 구간(원, 오름차순). confirmed:false = 조사로 확인 못 한 임시값 → 위젯에 "?"
// match 는 "발신번호 + 문자 앞부분(HEAD_LEN자)"에만 적용 → 가맹점명(현대백화점 등) 오분류 방지
const CARDS = [
  { id: "bc", name: "BC바로KPASS", match: /BC|비씨/,       tiers: [300000, 600000], confirmed: true,  exclude: [] },
  { id: "hd", name: "현대ED3",     match: /현대카드/,      tiers: [400000],         confirmed: true,  exclude: [] },
  { id: "sh", name: "신한",        match: /신한/,          tiers: [300000],         confirmed: false, exclude: [] },
  { id: "wr", name: "우리다모아",  match: /우리카드|우리\s*\(?카드/, tiers: [300000], confirmed: false,
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

// 입력: {name,text} 또는 문자열. 파일 형식: 1행 발신자 / 2행 ISO일시 / 3행~ 본문
function parseFile(item) {
  const text = typeof item === "string" ? item : item.text;
  const name = typeof item === "string" ? "" : item.name || "";
  const lines = text.split(/\r?\n/);
  let iso = lines[1] || "";
  if (!iso || isNaN(new Date(iso))) iso = isoFromName(name); // 2행이 비정상이면 파일명으로 복구
  return { sender: (lines[0] || "").slice(0, 60), iso, body: lines.slice(2).join("\n").slice(0, MAX_BODY) };
}

// 파일명 yyyyMMdd-HHmmss(-난수).txt 는 기기 로컬(KST) 시각
function isoFromName(name) {
  const m = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/.exec(name);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+09:00` : "";
}

function classify(rec) {
  // 1순위: 단축어가 1행에 적어 준 카드 태그(예: "신한")가 카드 1개와 정확히 일치하면 그 카드
  const tagHits = CARDS.filter(c => c.match.test(rec.sender));
  const byTag = tagHits.length === 1 ? tagHits[0] : null;
  // 2순위: 카드명은 "승인/취소/결제/이용" 키워드 앞(머리말)에서만 찾는다 → 뒤쪽 가맹점명 영향 차단
  const cut = rec.body.search(/승인|취소|결제|이용/);
  const head = rec.sender + "\n" + rec.body.slice(0, cut > 0 ? Math.min(cut, HEAD_LEN) : HEAD_LEN);
  const hits = byTag ? [byTag] : CARDS.filter(c => c.match.test(head));
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

// KST 기준 "YYYY-MM"
function ymKST(iso) {
  const k = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return k.toISOString().slice(0, 7);
}

// adjust: {카드id: 원} 수동 보정(누락 문자 등). dedupe: 같은 발신자+본문+같은 분(分)은 1건
function aggregate(items, nowIso, adjust = {}) {
  const ym = ymKST(nowIso);
  const sum = Object.fromEntries(CARDS.map(c => [c.id, 0]));
  const cum = {}, cumAt = {}, lastSeen = new Map(), rows = [];
  let unparsed = 0, dup = 0;
  const recs = items.map(parseFile).sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : 0));
  for (const rec of recs) {
    if (!rec.iso || isNaN(new Date(rec.iso))) { unparsed++; rows.push({ rec, status: "baddate" }); continue; }
    if (ymKST(rec.iso) !== ym) continue;
    const key = rec.sender + "|" + rec.body.trim(), t = new Date(rec.iso).getTime();
    if (lastSeen.has(key) && t - lastSeen.get(key) < 60000) { dup++; rows.push({ rec, status: "dup" }); continue; }
    lastSeen.set(key, t);
    const r = classify(rec);
    rows.push({ rec, status: r.status, card: r.card, amt: r.amt });
    if (r.status === "ok") {
      sum[r.card.id] += r.amt;
      const cm = CUMUL.exec(rec.body);
      if (cm && (!cumAt[r.card.id] || rec.iso > cumAt[r.card.id])) {
        cumAt[r.card.id] = rec.iso; cum[r.card.id] = parseInt(cm[1].replace(/,/g, ""), 10);
      }
    } else if (r.status === "noamount" || r.status === "ambiguous") unparsed++;
  }
  for (const [id, v] of Object.entries(adjust || {}))
    if (id in sum && typeof v === "number" && Number.isFinite(v) && Math.abs(v) <= MAX_ADJUST) sum[id] += v;
  return { ym, sum, cum, unparsed, dup, rows };
}


const core = { CARDS, nextTarget, aggregate };
const fm = FileManager.iCloud();
const root = fm.joinPath(fm.documentsDirectory(), "CardLedger");
const dir = fm.joinPath(root, "inbox");

async function load(now) {
  // 이번 달 prefix(yyyyMM, 기기 로컬=KST) 파일만 읽어 iCloud 다운로드/속도 부담을 줄인다
  const pre = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  if (!fm.fileExists(dir)) throw new Error("inbox 폴더 없음: iCloud Drive/Scriptable/CardLedger/inbox");
  const items = []; let failed = 0;
  for (const name of fm.listContents(dir).filter(n => n.startsWith(pre) && n.endsWith(".txt"))) {
    try {
      const p = fm.joinPath(dir, name);
      if (!fm.isFileDownloaded(p)) await fm.downloadFileFromiCloud(p);
      const text = fm.readString(p);
      if (text.length > 5000) { failed++; continue; } // 비정상적으로 큰 파일은 무시
      items.push({ name, text });
    } catch (e) { failed++; }
  }
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

async function showDiag(cards, rows) {
  const t = new UITable(); t.showSeparators = true;
  const head = new UITableRow(); head.isHeader = true;
  head.addText("최근 문자 읽기 결과 (최신순, 30건)"); t.addRow(head);
  const label = { ok: "OK", nocard: "카드 못 찾음", noamount: "금액 못 찾음", ambiguous: "카드 모호", excluded: "제외", dup: "중복", baddate: "날짜 오류" };
  for (const r of rows.slice(-30).reverse()) {
    const row = new UITableRow(); row.height = 56;
    const amt = r.amt === undefined ? "" : (r.amt < 0 ? "−" : "+") + Math.abs(r.amt).toLocaleString() + "원";
    row.addText(`${label[r.status] || r.status} ${r.card ? r.card.name : ""} ${amt}`, r.rec.body.replace(/\s+/g, " ").slice(0, 60));
    t.addRow(row);
  }
  if (!rows.length) { const row = new UITableRow(); row.addText("이번 달 문자 파일이 없습니다 (inbox 폴더 확인)"); t.addRow(row); }
  await t.present(false);
}

const man = v => (v / 10000).toFixed(v % 10000 === 0 ? 0 : 1);
const w = new ListWidget();
w.backgroundColor = Color.dynamic(new Color("#ffffff"), new Color("#1c1c1e"));
w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000); // 요청값일 뿐, 실제 주기는 iOS가 결정
w.url = "scriptable:///run/" + encodeURIComponent(Script.name()); // 탭 → 앱에서 재실행
if (config.runsInApp && typeof Widget.reloadUserWidgets === "function") Widget.reloadUserWidgets();

try {
  const now = new Date();
  const { items, failed } = await load(now);
  const res = core.aggregate(items, now.toISOString(), loadAdjust());
  const { sum, cum, unparsed } = res;
  var diagRows = res.rows;
  const warn = unparsed + failed;
  // 앱에서 직접 실행하면(위젯 아님) 진단표를 먼저 보여준다: 어떤 문자가 어떻게 읽혔는지 확인용
  if (!config.runsInWidget) await showDiag(core.CARDS, diagRows);
  const title = w.addText(`${now.getMonth() + 1}월 카드실적` + (warn ? `  ⚠︎${warn}` : ""));
  title.font = Font.boldSystemFont(12); title.textColor = Color.gray();
  w.addSpacer(4);
  for (const c of core.CARDS) {
    const v = sum[c.id], tgt = core.nextTarget(c, v), ok = v >= tgt;
    const row = w.addStack(); row.centerAlignContent();
    const n = row.addText(c.name + (c.confirmed ? "" : "?")); n.font = Font.systemFont(12); n.lineLimit = 1;
    row.addSpacer();
    const star = cum[c.id] !== undefined && cum[c.id] !== v ? "*" : ""; // 문자 누적액과 불일치
    const t = row.addText(`${star}${man(v)}/${man(tgt)}만`);
    t.font = Font.boldMonospacedSystemFont(12);
    t.textColor = ok ? Color.green() : Color.red();
    w.addSpacer(2);
  }
  const foot = w.addText(`갱신 ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
  foot.font = Font.systemFont(9); foot.textColor = Color.gray();
} catch (e) {
  const t = w.addText("오류: " + e.message); t.font = Font.systemFont(11); t.textColor = Color.red();
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
