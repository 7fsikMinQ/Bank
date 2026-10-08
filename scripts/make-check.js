// 단일 스크립트 → 폰에서 원본 대조용 검사 스크립트(20줄 단위 해시) 생성. 빌드 때마다 자동 갱신된다.
const fs = require("fs");
function h(s) { let x = 5381; for (let i = 0; i < s.length; i++) x = ((x * 33) ^ s.charCodeAt(i)) >>> 0; return x.toString(36); }
module.exports = function makeCheck(srcFile, scriptName, outFile) {
  const src = fs.readFileSync(srcFile, "utf8").replace(/\n+$/, "").split("\n");
  const ex = []; for (let b = 0; b * 20 < src.length; b++) ex.push(h(src.slice(b * 20, b * 20 + 20).join("\n")));
  const t = fs.readFileSync("scripts/check-template.js", "utf8").replace("__TITLE__", scriptName).replace("__FILE__", scriptName + ".js")
    .replace("__EXPECT__", JSON.stringify(ex)).replace("__LINES__", String(src.length));
  fs.writeFileSync(outFile, t);
};
