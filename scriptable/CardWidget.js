// Scriptable 위젯. 같은 폴더(iCloud Drive/Scriptable)에 ledger-core.js 필요.
const core = importModule("ledger-core");
const fm = FileManager.iCloud();
const dir = fm.joinPath(fm.documentsDirectory(), "CardLedger/inbox");

async function load() {
  if (!fm.fileExists(dir)) return [];
  const names = fm.listContents(dir).filter(n => n.endsWith(".txt"));
  const out = [];
  for (const n of names) {
    const p = fm.joinPath(dir, n);
    if (!fm.isFileDownloaded(p)) await fm.downloadFileFromiCloud(p);
    out.push(fm.readString(p));
  }
  return out;
}

const { sum, cum, unparsed } = core.aggregate(await load(), new Date().toISOString());
const man = v => (v / 10000).toFixed(v % 10000 === 0 ? 0 : 1);

const w = new ListWidget();
w.backgroundColor = Color.dynamic(new Color("#ffffff"), new Color("#1c1c1e"));
w.refreshAfterDate = new Date(Date.now() + 5 * 60 * 1000); // 최소 요청값, 실제 주기는 iOS가 결정
// 탭하면 앱에서 스크립트가 실행되고, 끝에서 위젯 리로드를 요청한다(메서드가 없는 버전이면 건너뜀)
w.url = "scriptable:///run/" + encodeURIComponent(Script.name());
if (config.runsInApp && typeof Widget.reloadUserWidgets === "function") Widget.reloadUserWidgets();

const title = w.addText(`${new Date().getMonth() + 1}월 카드실적` + (unparsed ? `  ⚠︎${unparsed}` : ""));
title.font = Font.boldSystemFont(12);
title.textColor = Color.gray();
w.addSpacer(4);

for (const c of core.CARDS) {
  const v = sum[c.id], tgt = core.nextTarget(c, v), ok = v >= tgt;
  // 문자 누적이용액과 계산값이 다르면 * (제외항목·누락 문자 점검 신호)
  const row = w.addStack(); row.centerAlignContent();
  const n = row.addText(c.name + (c.confirmed ? "" : "?")); n.font = Font.systemFont(12); n.lineLimit = 1;
  row.addSpacer();
  const t = row.addText(`${cum[c.id] !== undefined && cum[c.id] !== v ? "*" : ""}${man(v)}/${man(tgt)}만`);
  t.font = Font.boldMonospacedSystemFont(12);
  t.textColor = ok ? Color.green() : Color.red();
  w.addSpacer(2);
}

if (config.runsInWidget) Script.setWidget(w); else await w.presentMedium();
Script.complete();
