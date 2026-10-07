// ledger-core.js + CardWidget.js → 붙여넣기 한 번으로 끝나는 단일 스크립트
const fs = require("fs");
let core = fs.readFileSync("scriptable/ledger-core.js", "utf8").replace(/\nif \(typeof module[\s\S]*$/, "\n");
let w = fs.readFileSync("scriptable/CardWidget.js", "utf8")
  .replace('const core = importModule("ledger-core");\n', "");
w = w.replace(/^\/\/ Scriptable 위젯[\s\S]*?\n(?=const fm)/, "");
const out = core + "\nconst core = { CARDS, nextTarget, aggregate };\n" + w;
fs.writeFileSync("scriptable/CardWidget.single.js", out);
console.log("wrote scriptable/CardWidget.single.js", out.split("\n").length, "lines");
