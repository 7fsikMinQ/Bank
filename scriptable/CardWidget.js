// Scriptable 위젯 (단독 실행 버전은 `node scripts/build-single.js` 로 생성).
// 같은 폴더(iCloud Drive/Scriptable)에 ledger-core.js 필요.
const core = importModule("ledger-core");
const fm = FileManager.iCloud();
const root = fm.joinPath(fm.documentsDirectory(), "CardLedger");
const dir = fm.joinPath(root, "inbox");

// 문자 파일을 읽는 위치 3가지:
//  (1) CardLedger/inbox 폴더  (2) Scriptable 설정 > File Bookmarks 에 "ShortcutsFolder" 이름으로 연결한 폴더(예: iCloud Drive/Shortcuts)
//  (3) CardLedger/log.txt  ("텍스트 파일에 추가" 동작으로 한 파일에 이어 붙인 경우)
async function readTxtDir(d, now, okMonths, pres, items) {
  let failed = 0;
  for (const name of fm.listContents(d).filter(n => n.endsWith(".txt"))) {
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

async function showDiag(cards, rows) {
  const t = new UITable(); t.showSeparators = true;
  const head = new UITableRow(); head.isHeader = true;
  head.addText("최근 문자 읽기 결과 (최신순, 30건)"); t.addRow(head);
  const label = { ok: "OK", nocard: "카드 못 찾음", noamount: "금액 못 찾음", ambiguous: "카드 모호", excluded: "제외", dup: "중복", baddate: "날짜 오류" };
  for (const r of rows.slice(-30).reverse()) {
    const row = new UITableRow(); row.height = 56;
    const amt = r.amt === undefined ? "" : (r.amt < 0 ? "−" : "+") + Math.abs(r.amt).toLocaleString() + "원" + (r.fx ? " (달러 환산)" : "");
    row.addText(`${label[r.status] || r.status} ${r.card ? r.card.name : ""} ${amt}`, r.rec.body.replace(/\s+/g, " ").slice(0, 60));
    t.addRow(row);
  }
  if (!rows.length) { const row = new UITableRow(); row.addText("이번 달 문자 파일이 없습니다 (inbox 폴더 확인)"); t.addRow(row); }
  await t.present(false);
}

const man = v => (v / 10000).toFixed(2).replace(/\.?0+$/, ""); // 만원 단위, 소수 2자리까지(9,900원 → 0.99)
const w = new ListWidget();
// Color.dynamic 이 없는 버전이어도 죽지 않게 방어
w.backgroundColor = typeof Color.dynamic === "function" ? Color.dynamic(new Color("#ffffff"), new Color("#1c1c1e")) : new Color("#1c1c1e");
w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000); // 요청값일 뿐, 실제 주기는 iOS가 결정
w.url = "scriptable:///run/" + encodeURIComponent(Script.name()); // 탭 → 앱에서 실행(최신 계산 결과 + 진단표)

try {
  const now = new Date();
  const { items, failed } = await load(now);
  const res = core.aggregate(items, now.toISOString(), loadAdjust());
  const { sum, unparsed, info } = res;
  var diagRows = res.rows;
  const warn = unparsed + failed;
  // 앱에서 직접 실행하면(위젯 아님) 진단표를 먼저 보여준다: 어떤 문자가 어떻게 읽혔는지 확인용
  if (!config.runsInWidget) await showDiag(core.CARDS, diagRows);
  const title = w.addText(`${info.month}월 1~${info.days}일 카드실적` + (warn ? `  ⚠︎${warn}` : ""));
  title.font = Font.boldSystemFont(12); title.textColor = Color.gray();
  w.addSpacer(4);
  for (const c of core.CARDS) {
    const v = sum[c.id];
    const tgt = c.noTarget ? 0 : core.nextTarget(c, v);
    const ok = c.noTarget ? v > 0 : v >= tgt;           // 신한: 0원만 아니면 달성(초록)
    const row = w.addStack(); row.centerAlignContent();
    const n = row.addText(c.name + (c.confirmed ? "" : "?")); n.font = Font.systemFont(12); n.lineLimit = 1;
    row.addSpacer();
    const t = row.addText(c.noTarget ? `${v.toLocaleString()}원` : `${man(v)}/${man(tgt)}만`);
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
