// 문서·코드 동기화 검사: 설계서 부록 코드 == 배포 파일, 옛 규칙·옛 표현이 문서에 남아 있지 않은지
const fs = require("fs"); const assert = require("assert");
const single = fs.readFileSync("scriptable/CardWidget.single.js", "utf8");
const design = fs.readFileSync("docs/카드실적-위젯-설계서.md", "utf8");
const appendix = design.split("```javascript\n")[1].split("\n```")[0] + "\n";
assert.strictEqual(appendix, single, "설계서 부록 코드가 scriptable/CardWidget.single.js 와 다름 (npm run build 후 문서 갱신 필요)");
const docs = ["README.md", "docs/초보자-따라하기-가이드.md", "docs/카드실적-위젯-설계서.md"].map(f => [f, fs.readFileSync(f, "utf8").replace(/```javascript[\s\S]*?```/g, "")]);
const stale = [/임시 30만/, /신한·우리다모아의 실적 구간/, /메시지에 포함\*\* 칸에 `승인`/, /"비씨"와 "신용"이 \*\*둘 다\*\* 나오는지/, /confirmed: false/, /Widget\.reloadUserWidgets/, /BC바로=문자 본문에 "비씨/];
for (const [f, t] of docs) for (const re of stale) assert.ok(!re.test(t), `${f}: 옛 표현 남음 ${re}`);
for (const [f, t] of docs) for (const must of ["1,320", "10만"]) if (f !== "README.md") assert.ok(t.includes(must) || t.includes(must.replace(",", "")), `${f}: '${must}' 설명 없음`);
console.log("DOCS SYNC OK (부록 코드 일치, 옛 표현 없음)");
