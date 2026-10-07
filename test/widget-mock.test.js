// 위젯 모드(홈 화면)로 단독 스크립트를 끝까지 실행하고 화면 문구를 검증
const { run } = require("./helpers/scriptable-mock");
(async () => {
  const { rows } = await run({ runsInWidget: true });
  const j = rows.join(" | "); console.log(j);
  const dm = new Date(Date.now() + 9 * 3600e3), dd = new Date(Date.UTC(dm.getUTCFullYear(), dm.getUTCMonth() + 1, 0)).getUTCDate();
  const need = [`${dm.getUTCMonth() + 1}월 1~${dd}일`, `${dm.getUTCDate()}/${dd}일차`, "35/60만", "8/40만", "1.2/30만"];
  for (const n of need) if (!j.includes(n)) { console.error("MOCK FAIL: missing", n, "in", j); process.exit(1); }
  if (j.includes("오류")) { console.error("MOCK FAIL: error shown"); process.exit(1); }
  console.log("WIDGET MOCK OK");
})().catch(e => { console.error("MOCK FAIL (script threw):", e.message); process.exit(1); });
