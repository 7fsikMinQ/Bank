// Scriptable 실행 환경 모의. 격리된 vm 컨텍스트에서 실행하므로, 코드가 Scriptable에 없는 전역(예: Widget)을
// 쓰면 아이폰에서처럼 ReferenceError("Can't find variable")로 실패한다. 허용 전역 = 실제 Scriptable API 중 우리가 쓰는 것만.
const fs = require("fs"), path = require("path"), os = require("os"), vm = require("vm");

function run({ runsInWidget, withFiles = true, file = "scriptable/CardWidget.single.js" }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cl-")); const inbox = path.join(tmp, "CardLedger/inbox");
  fs.mkdirSync(inbox, { recursive: true });
  const kst = new Date(Date.now() + 9 * 3600e3);
  const pre = `${kst.getUTCFullYear()}${String(kst.getUTCMonth() + 1).padStart(2, "0")}`;
  const iso = new Date().toISOString();
  if (withFiles) {
    fs.writeFileSync(path.join(inbox, `${pre}01-101010-1111.txt`), `비씨\n${iso}\n비씨 신용 승인 350,000원 일시불 누적 350,000원`);
    fs.writeFileSync(path.join(inbox, `${pre}02-101010-2222.txt`), `현대카드\n${iso}\n현대카드 승인 100,000원`);
    fs.writeFileSync(path.join(inbox, `${pre}02-101010-3333.txt`), `현대카드\n${iso}\n현대카드 승인취소 20,000원`);
    fs.writeFileSync(path.join(tmp, "CardLedger/adjust.json"), '{"sh": 12000}');
    fs.writeFileSync(path.join(inbox, "199001-old.txt"), "x\ny\nz");
  }
  const rows = [], diag = [];
  const mk = () => ({ addText: t => { rows.push(t); return { font: 0, textColor: 0, lineLimit: 0 }; }, addStack() { return mk(); }, addSpacer() {}, centerAlignContent() {} });
  const fm = { documentsDirectory: () => tmp, joinPath: path.join, fileExists: fs.existsSync, listContents: p => fs.readdirSync(p),
    isFileDownloaded: () => true, downloadFileFromiCloud: async () => {}, readString: p => fs.readFileSync(p, "utf8") };
  const sandbox = {
    FileManager: { iCloud: () => fm },
    ListWidget: function () { Object.assign(this, mk()); this.presentMedium = async () => {}; },
    Color: Object.assign(function () {}, { dynamic: () => 0, gray: () => 1, red: () => 2, green: () => 3 }),
    Font: { boldSystemFont: () => 0, systemFont: () => 0, boldMonospacedSystemFont: () => 0 },
    UITable: function () { this.rows = []; this.addRow = r => this.rows.push(r); this.present = async () => { this.rows.forEach(r => diag.push(r.t)); }; },
    UITableRow: function () { this.addText = (a, b) => { this.t = a + " / " + (b || ""); }; },
    config: { runsInWidget, runsInApp: !runsInWidget },
    Script: { name: () => "CardWidget", setWidget() {}, complete() {} },
    encodeURIComponent, Date, JSON, Math, Promise, Number, String, Array, Object, Set, Map, RegExp, Error, isNaN, parseInt, console,
  };
  const src = "(async () => {\n" + fs.readFileSync(path.join(__dirname, "../..", file), "utf8") + "\n})()";
  return vm.runInNewContext(src, sandbox).then(() => ({ rows, diag }));
}
module.exports = { run };
