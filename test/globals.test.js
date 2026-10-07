// 정적 검사: 스크립트가 참조하는 대문자 시작 전역(Widget 같은 것)이 Scriptable/JS 에 실제로 있는 것뿐인지 확인한다.
// 실행되지 않는 분기(오류 처리 등)에 숨은 "Can't find variable" 도 잡는다.
const fs = require("fs");
const allowed = new Set(["FileManager", "ListWidget", "Color", "Font", "UITable", "UITableRow", "Script", "Date", "JSON", "Math", "Promise",
  "Number", "String", "Array", "Object", "Set", "Map", "RegExp", "Error", "Infinity", "NaN", "Boolean"]);
const strip = s => s.replace(/\/\/[^\n]*/g, "").replace(/`(?:\\.|[^`\\])*`/g, "``").replace(/"(?:\\.|[^"\\\n])*"/g, '""').replace(/'(?:\\.|[^'\\\n])*'/g, "''").replace(/\/(?![*/])(?:\\.|\[(?:\\.|[^\]\\])*\]|[^/\\\n])+\/[gimsuy]*/g, "/re/");
let bad = [];
for (const f of ["scriptable/CardWidget.single.js"]) {
  const src = strip(fs.readFileSync(f, "utf8"));
  const declared = new Set([...src.matchAll(/\b(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/g)].map(m => m[1]));
  for (const m of src.matchAll(/(?<![.\w$])([A-Z][A-Za-z0-9_]*)\s*(?=[.(])/g)) {
    const id = m[1]; if (!allowed.has(id) && !declared.has(id)) bad.push(`${f}: ${id}`);
  }
  for (const m of src.matchAll(/new\s+([A-Z][A-Za-z0-9_]*)/g)) if (!allowed.has(m[1]) && !declared.has(m[1])) bad.push(`${f}: new ${m[1]}`);
}
if (bad.length) { console.error("GLOBALS FAIL (Scriptable에 없을 수 있는 이름):", [...new Set(bad)]); process.exit(1); }
console.log("GLOBALS OK (only known Scriptable/JS names are referenced)");
