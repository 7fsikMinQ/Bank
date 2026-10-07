// Scriptable 위젯 (단독 실행 버전은 `node scripts/build-single.js` 로 생성).
// 같은 폴더(iCloud Drive/Scriptable)에 ledger-core.js 필요.
const core = importModule("ledger-core");
const fm = FileManager.iCloud();
const root = fm.joinPath(fm.documentsDirectory(), "CardLedger");
const dir = fm.joinPath(root, "inbox");

async function load(now) {
  // 이번 달(KST 기준)과 전달 prefix(yyyyMM) 파일만 읽어 iCloud 부담을 줄인다.
  // 파일명은 폰 현지 시각이라, 폰 시간대가 한국이 아니어도 월 경계 파일을 놓치지 않도록 전달까지 읽는다(월 분리는 코어가 KST로 정확히 수행).
  const ym = core.monthInfo(now.toISOString()).ym;
  const pres = [ym.replace("-", ""), core.prevYm(ym).replace("-", "")];
  if (!fm.fileExists(dir)) throw new Error("inbox 폴더 없음: iCloud Drive/Scriptable/CardLedger/inbox");
  const items = []; let failed = 0;
  for (const name of fm.listContents(dir).filter(n => pres.some(pr => n.startsWith(pr)) && n.endsWith(".txt"))) {
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
  const { sum, cum, unparsed, info } = res;
  var diagRows = res.rows;
  const warn = unparsed + failed;
  // 앱에서 직접 실행하면(위젯 아님) 진단표를 먼저 보여준다: 어떤 문자가 어떻게 읽혔는지 확인용
  if (!config.runsInWidget) await showDiag(core.CARDS, diagRows);
  const title = w.addText(`${info.month}월 1~${info.days}일 카드실적` + (warn ? `  ⚠︎${warn}` : ""));
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
  const foot = w.addText(`${info.day}/${info.days}일차 · 갱신 ${now.getHours()}:${String(now.getMinutes()).padStart(2, "0")}`);
  foot.font = Font.systemFont(9); foot.textColor = Color.gray();
} catch (e) {
  const t = w.addText("오류: " + e.message); t.font = Font.systemFont(11); t.textColor = Color.red();
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
