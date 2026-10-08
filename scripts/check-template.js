// __TITLE__ 이 원본과 같은지 검사 (읽기만 함, 수정 없음)
const fm = FileManager.iCloud();
const p = fm.joinPath(fm.documentsDirectory(), "__FILE__");
if (!fm.isFileDownloaded(p)) await fm.downloadFileFromiCloud(p);
const lines = fm.readString(p).replace(/\r/g, "").replace(/\n+$/, "").split("\n");
const EXPECT = __EXPECT__;
function h(s) { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0; return x.toString(36); }
const bad = [];
for (let b = 0; b * 20 < Math.max(lines.length, EXPECT.length * 20); b++) {
  if (h(lines.slice(b * 20, b * 20 + 20).join("\n")) !== EXPECT[b]) bad.push(`${b * 20 + 1}~${b * 20 + 20}줄`);
}
const t = new UITable(); const r = new UITableRow();
r.addText(bad.length ? "다른 구간: " + bad.join(", ") : "원본과 완전히 같음 ✅", `총 ${lines.length}줄 (원본 ${__LINES__}줄)`);
t.addRow(r); await t.present(false);
Script.complete();
