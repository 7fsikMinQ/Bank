// 앱에서 직접 실행(진단표 + 미리보기). 파일이 하나도 없는 경우도 오류 없이 동작해야 한다
const { run } = require("./helpers/scriptable-mock");
(async () => {
  const { rows, diag } = await run({ runsInWidget: false });
  if (!diag.length || !diag.some(d => d.includes("OK BC바로KPASS +350,000원"))) { console.error("APP MOCK FAIL diag", diag); process.exit(1); }
  console.log(diag.slice(0, 4).join("\n"));
  const empty = await run({ runsInWidget: false, withFiles: false });
  if (empty.rows.join("|").includes("오류") && !empty.rows.join("|").includes("카드실적")) { console.error("APP MOCK FAIL empty"); process.exit(1); }
  console.log("APP MOCK OK");
})().catch(e => { console.error("APP MOCK FAIL (script threw):", e.message); process.exit(1); });
