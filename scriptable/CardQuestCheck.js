// CardQuest 이 원본과 같은지 검사 (읽기만 함, 수정 없음)
const fm = FileManager.iCloud();
const p = fm.joinPath(fm.documentsDirectory(), "CardQuest.js");
if (!fm.isFileDownloaded(p)) await fm.downloadFileFromiCloud(p);
const lines = fm.readString(p).replace(/\r/g, "").replace(/\n+$/, "").split("\n");
const EXPECT = ["1bfuvw5","1etsac3","vop7sy","11t4tqp","1l2a2fp","1ywsck8","mf4f9t","1k7z0a6","1vw4455","1cl5xc0","xfbfp5","186hmyo","1vlea1r","wetsmb","w7xwza","1iy4bxf","gn2sfk","1azqvzc","11ppb1s","8serws","z52pl4","1eysook"];
function h(s) { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0; return x.toString(36); }
const bad = [];
for (let b = 0; b * 20 < Math.max(lines.length, EXPECT.length * 20); b++) {
  if (h(lines.slice(b * 20, b * 20 + 20).join("\n")) !== EXPECT[b]) bad.push(`${b * 20 + 1}~${b * 20 + 20}줄`);
}
const t = new UITable(); const r = new UITableRow();
r.addText(bad.length ? "다른 구간: " + bad.join(", ") : "원본과 완전히 같음 ✅", `총 ${lines.length}줄 (원본 ${440}줄)`);
t.addRow(r); await t.present(false);
Script.complete();
