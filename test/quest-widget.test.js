// CardQuest 위젯/앱 모의 실행: 오류 없이 끝나고, 확정 목표 기준 레벨·문구가 맞는지, WebView 주입 데이터·레벨업 상태 파일 동작 확인
const fs = require("fs"), path = require("path"), assert = require("assert");
const { run } = require("./helpers/scriptable-mock");
const F = "scriptable/CardQuest.single.js";
(async () => {
  // 1) 위젯 모드
  let r = await run({ runsInWidget: true, file: F, scriptName: "CardQuest" });
  const j = r.rows.join(" | "); console.log(j);
  const dm = new Date(Date.now() + 9 * 3600e3);
  for (const n of [`${dm.getUTCMonth() + 1}월 실적 퀘스트`, "파티 2/5", "Lv1 · 35만", "Lv0 · 8만", "12,000원", "Lv0 · 0.99만", "다음: 현대ED3 40만까지 32만"]) assert.ok(j.includes(n), `위젯 문구 없음: ${n}\n${j}`);
  assert.ok(!j.includes("오류"), "오류 표시");
  assert.strictEqual(r.bars.length, 3, "막대 그림 3개(BC·현대·우리)"); assert.strictEqual(r.webs.length, 0, "위젯 모드는 WebView 없음");
  // 2) DrawContext 없을 때: 글자 막대로 대체
  r = await run({ runsInWidget: true, file: F, scriptName: "CardQuest", noDraw: true });
  const j2 = r.rows.join(" | "); assert.ok(/▰+▱*/.test(j2) && !j2.includes("오류"), "글자 막대 대체 실패: " + j2); assert.strictEqual(r.bars.length, 0);
  // 3) 앱 모드: WebView 주입 + 상태 파일(첫 실행은 레벨업 연출 없음)
  r = await run({ runsInWidget: false, file: F, scriptName: "CardQuest" });
  assert.strictEqual(r.webs.length, 1); const html = r.webs[0];
  const D = JSON.parse(/const D = (\{.*\});/.exec(html)[1]);
  assert.deepStrictEqual(D.leveledUp, []); assert.strictEqual(D.cards.length, 4);
  assert.deepStrictEqual(D.cards.map(c => c.emoji), ["🦊", "🐻", "🐱", "🐰"]);
  assert.deepStrictEqual(D.cards.map(c => c.name), ["BC바로", "현대ED3", "신한", "우리다모아"]);
  assert.strictEqual(D.cards[0].value, 350000); assert.deepStrictEqual(D.cards[0].tiers, [300000, 600000]); assert.strictEqual(D.cards[2].noTarget, true);
  const st = JSON.parse(fs.readFileSync(path.join(r.tmp, "CardLedger/quest-state.json"), "utf8"));
  assert.strictEqual(st.levels.bc, 1); assert.strictEqual(st.levels.hd, 0); assert.strictEqual(st.levels.sh, 1);
  // HTML 안전: 외부 주소·외부 스크립트·네트워크 호출 없음, questOf 가 그대로 삽입됨
  for (const re of [/https?:\/\//, /<script[^>]+src/i, /\bfetch\s*\(/, /XMLHttpRequest/, /\beval\s*\(/, /WebSocket/, /<link/i]) assert.ok(!re.test(html), "HTML 금지 패턴 " + re);
  assert.ok(html.includes("function questOf(card, v)"), "questOf 삽입 안 됨");
  // 4) 레벨업 연출: 지난번 레벨보다 올랐을 때만 표시, 달이 바뀌면 초기화, 깨진 상태 파일은 안전
  const ym = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 7);
  const lvl = async pre => JSON.parse(/const D = (\{.*\});/.exec((await run({ runsInWidget: false, file: F, scriptName: "CardQuest", preState: pre })).webs[0])[1]).leveledUp;
  assert.deepStrictEqual(await lvl(JSON.stringify({ ym, levels: { bc: 0, hd: 0, sh: 0, wr: 0 } })), ["bc", "sh"]);
  assert.deepStrictEqual(await lvl(JSON.stringify({ ym, levels: { bc: 1, hd: 0, sh: 1, wr: 0 } })), []);
  assert.deepStrictEqual(await lvl(JSON.stringify({ ym: "1999-01", levels: { bc: 2 } })), ["bc", "sh"]);   // 지난 달 기록 → 이번 달 0에서 시작
  assert.deepStrictEqual(await lvl("{깨진 json"), []);                                                  // 읽을 수 없으면 연출 없이 새로 기록
  // 5) 화면 안의 스크립트: 문법 검사 + 가짜 DOM에서 끝까지 실행(모르는 이름 참조 방지)
  const vm = require("vm");
  const inline = /<script>([\s\S]*)<\/script>/.exec(html)[1];
  new vm.Script(inline);
  const dom = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => "" : k === "length" ? 0 : k === "style" || k === "classList" ? dom() : dom(), apply: () => dom(), set: () => true });
  vm.runInNewContext(inline, { document: Object.assign(dom(), {}), requestAnimationFrame: f => f(), setTimeout: f => 0, Math, JSON, Number, Array, String, Object });
  // 6) 설정 연동: 위젯이 쓰는 목표는 CARDS 설정(ledger-core)과 같다
  const src = fs.readFileSync(F, "utf8"); assert.ok(src.includes("tiers: [300000, 600000]") && src.includes("tiers: [400000]") && src.includes("tiers: [100000]"));
  console.log("QUEST WIDGET OK (위젯·글자 막대 대체·앱 WebView·상태 파일·HTML 안전)");
})().catch(e => { console.error("QUEST FAIL:", e.message); process.exit(1); });
