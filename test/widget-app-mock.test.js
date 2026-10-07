// Scriptable API 를 흉내 내어 단독 실행 스크립트를 끝까지 실행
const fs = require("fs"), path = require("path"), os = require("os");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cl-")); const inbox = path.join(tmp, "CardLedger/inbox");
fs.mkdirSync(inbox, { recursive: true });
const d = new Date(); const pre = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
const iso = new Date().toISOString();
fs.writeFileSync(path.join(inbox, `${pre}01-101010-1111.txt`), `1588-4000\n${iso}\n비씨 신용 승인 350,000원 일시불 누적 350,000원`);
fs.writeFileSync(path.join(inbox, `${pre}02-101010-2222.txt`), `1544-7000\n${iso}\n현대카드 승인 100,000원`);
fs.writeFileSync(path.join(inbox, `${pre}02-101010-3333.txt`), `1544-7000\n${iso}\n현대카드 승인취소 20,000원`);
fs.writeFileSync(path.join(tmp, "CardLedger/adjust.json"), '{"sh": 12000}');
fs.writeFileSync(path.join(inbox, "199001-old.txt"), "x\ny\nz");
const rows = [];
const mk = () => ({ addText: t => { rows.push(t); return { font: 0, textColor: 0, lineLimit: 0 }; }, addStack() { return mk(); }, addSpacer() {}, centerAlignContent() {} });
global.FileManager = { iCloud: () => ({ documentsDirectory: () => tmp, joinPath: path.join, fileExists: fs.existsSync,
  listContents: p => fs.readdirSync(p), isFileDownloaded: () => true, downloadFileFromiCloud: async () => {}, readString: p => fs.readFileSync(p, "utf8") }) };
global.ListWidget = function () { Object.assign(this, mk()); this.presentMedium = async () => {}; };
global.Color = Object.assign(function () {}, { dynamic: () => 0, gray: () => 1, red: () => 2, green: () => 3 });
global.Font = { boldSystemFont: () => 0, systemFont: () => 0, boldMonospacedSystemFont: () => 0 };
global.config = { runsInWidget: false, runsInApp: true }; global.Script = { name: () => "CardWidget", setWidget() {}, complete() {} };
global.Widget = { reloadUserWidgets() { global.__reloaded = true; } };
global.UITable = function () { this.rows = []; this.addRow = r => this.rows.push(r); this.present = async () => { global.__diag = this.rows.map(r => r.t); }; };
global.UITableRow = function () { this.addText = (a, b) => { this.t = a + " / " + (b || ""); }; };
global.presentMedium = 0; global.encodeURIComponent = encodeURIComponent;
const src = fs.readFileSync(path.join(__dirname, "../scriptable/CardWidget.single.js"), "utf8");
new (Object.getPrototypeOf(async function () {}).constructor)(src)().then(() => {
  console.log(rows.join(" | "));
  const j = rows.join("|");
  const dm = new Date(Date.now() + 9 * 3600e3), dd = new Date(Date.UTC(dm.getUTCFullYear(), dm.getUTCMonth() + 1, 0)).getUTCDate();
  if (!j.includes(`${dm.getUTCMonth() + 1}월 1~${dd}일`) || !j.includes(`${dm.getUTCDate()}/${dd}일차`)) { console.error("MOCK FAIL month range/day-of-month label", j); process.exit(1); }
  if (!global.__reloaded || !global.__diag || !global.__diag.length) { console.error("APP MOCK FAIL diag/reload"); process.exit(1); }
  console.log(global.__diag.slice(0,4).join("\n"));
  if (!/35\/30만|35\/60만/.test(j) || !/8\/40만/.test(j) || !/1\.2\/30만/.test(j)) { console.error("MOCK FAIL"); process.exit(1); }
  console.log("APP MOCK OK");
});
