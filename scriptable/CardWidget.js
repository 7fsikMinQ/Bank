// Scriptable 위젯 (단독 실행 버전은 `node scripts/build-single.js` 로 생성).
// 같은 폴더(iCloud Drive/Scriptable)에 ledger-core.js 필요.
const core = importModule("ledger-core");
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
      items.push({ name, text: fm.readString(p) });
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

const man = v => (v / 10000).toFixed(v % 10000 === 0 ? 0 : 1);
const w = new ListWidget();
w.backgroundColor = Color.dynamic(new Color("#ffffff"), new Color("#1c1c1e"));
w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000); // 요청값일 뿐, 실제 주기는 iOS가 결정
w.url = "scriptable:///run/" + encodeURIComponent(Script.name()); // 탭 → 앱에서 재실행
if (config.runsInApp && typeof Widget.reloadUserWidgets === "function") Widget.reloadUserWidgets();

try {
  const now = new Date();
  const { items, failed } = await load(now);
  const { sum, cum, unparsed, dup } = core.aggregate(items, now.toISOString(), loadAdjust());
  const warn = unparsed + failed;
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
