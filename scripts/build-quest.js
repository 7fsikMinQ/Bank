// ledger-core + quest-core + (CardWidget 의 파일 읽기 구간) + CardQuest.body → 붙여넣기 한 번으로 끝나는 CardQuest.single.js
const fs = require("fs");
const strip = s => s.replace(/\nif \(typeof module[\s\S]*$/, "\n");
const core = strip(fs.readFileSync("scriptable/ledger-core.js", "utf8"));
const quest = strip(fs.readFileSync("scriptable/quest-core.js", "utf8"));
const widget = fs.readFileSync("scriptable/CardWidget.js", "utf8");
const a = widget.indexOf("const fm = FileManager.iCloud();"), b = widget.indexOf("async function showDiag");
if (a < 0 || b < 0 || b < a) throw new Error("CardWidget.js 구간 표식을 찾지 못함");
const shared = widget.slice(a, b);                       // fm/root/dir, readTxtDir, load, loadAdjust (단일 출처: CardWidget.js)
const body = fs.readFileSync("scriptable/CardQuest.body.js", "utf8");
const out = core + "\n" + quest + "\nconst core = { CARDS, nextTarget, aggregate, monthInfo, prevYm, logItems };\n" + shared + body;
fs.writeFileSync("scriptable/CardQuest.single.js", out);
console.log("wrote scriptable/CardQuest.single.js", out.split("\n").length, "lines");

require("./make-check.js")("scriptable/CardQuest.single.js", "CardQuest", "scriptable/CardQuestCheck.js");
