// 로그 파일(log.txt) 방식 + 연결 폴더(ShortcutsFolder) 방식 검증
const assert = require("assert"); const fs = require("fs"); const os = require("os"); const path = require("path");
const { aggregate, logItems, splitLog, daysInMonth } = require("../scriptable/ledger-core.js");
const { run } = require("./helpers/scriptable-mock");
const p2 = n => String(n).padStart(2, "0");
const sms = (card, md, hm, amt, cancel = false) => {
  const head = { bc: "BC바로(5678) " + (cancel ? "승인취소" : "승인"), hd: "현대 네이버 " + (cancel ? "취소" : "승인"), sh: "신한카드(9999)" + (cancel ? "취소" : "승인"), wr: "우리카드(1234)" + (cancel ? "승인취소" : "체크승인") }[card];
  return `[Web발신]\n${head}\n홍*동님\n${amt.toLocaleString()}원 일시불\n${md} ${hm}\n무신사`;
};

// 1 분리: "[Web발신]" 단위, 빈 로그·쓰레기 입력은 안전
assert.strictEqual(splitLog(sms("bc", "10/08", "09:27", 9900) + "\n" + sms("wr", "10/08", "09:31", 9900)).length, 2);
assert.strictEqual(splitLog("").length, 0); assert.strictEqual(splitLog("아무 문자\n[Web발신]").length, 0);
assert.deepStrictEqual(logItems("", "2026-10-08T12:00:00+09:00"), []);

// 2 핵심: 로그가 14개월(2025-09 ~ 2026-10) 쌓여도, 각 달을 "그 달 말일 정오"에 본 합계가 정답과 일치(같은 월/일이 해를 넘어 섞이지 않음)
const months = []; for (let y = 2025, m = 9; !(y === 2026 && m === 11); m === 12 ? (y++, m = 1) : m++) months.push([y, m]);
const entries = [], truth = {};
for (const [y, m] of months) {
  const ym = `${y}-${p2(m)}`; truth[ym] = 0;
  for (const [d, amt, cancel] of [[1, 1000], [8, 2000], [8, 2000, true], [15, 3000], [daysInMonth(y, m), 4000]]) {
    entries.push(sms("bc", `${p2(m)}/${p2(d)}`, "09:30", amt, !!cancel)); truth[ym] += cancel ? -amt : amt;
  }
}
months.forEach(([y, m], i) => {
  const ym = `${y}-${p2(m)}`, nowIso = `${ym}-${p2(daysInMonth(y, m))}T12:00:00+09:00`;
  const part = entries.slice(0, (i + 1) * 5).join("\n");                       // 그 시점까지 쌓인 로그
  assert.strictEqual(aggregate(logItems(part, nowIso), nowIso).sum.bc, truth[ym], ym);
});
// 3 작년 같은 날짜가 올해로 새지 않는다: 2026-10-08 12시에 본 로그(2025-09 ~ 2026-10-08)에서 10월 합계는 10/01(1000)뿐
const upTo = entries.slice(0, (months.length - 1) * 5 + 3).join("\n");           // 마지막 달은 10/01, 10/08 승인·취소까지
const nowOct = "2026-10-08T12:00:00+09:00";
assert.strictEqual(aggregate(logItems(upTo, nowOct), nowOct).sum.bc, 1000);
// 지난해 10월은 다른 달로 정확히 분리(2025-10 합계 = 1000+0+3000+4000 = 8000)
assert.strictEqual(truth["2025-10"], 8000);

// 4 날짜 없는 덩어리·윤일·연도 넘김
const odd = [sms("sh", "12/31", "23:50", 500), "[Web발신]\n신한카드(9999)승인 홍*동 777원 (일시불) 일시없음", sms("sh", "01/01", "00:10", 300)].join("\n");
const nowJan = "2027-01-15T12:00:00+09:00", ro = aggregate(logItems(odd, nowJan), nowJan);
assert.strictEqual(ro.sum.sh, 300 + 777);                 // 1월: 01/01 300 + (날짜 없는 777은 다음 문자 시각=1월로 간주)
const nowDec = "2026-12-31T23:59:00+09:00", rd = aggregate(logItems(sms("sh", "12/31", "23:50", 500), nowDec), nowDec);
assert.strictEqual(rd.sum.sh, 500);
assert.strictEqual(aggregate(logItems(sms("hd", "02/29", "10:00", 800), "2028-03-01T12:00:00+09:00"), "2028-02-29T12:00:00+09:00").sum.hd, 800);   // 윤일

// 5 위젯 실행(모의): 연결 폴더 + log.txt + inbox 를 함께 읽어 합산
const kst = new Date(Date.now() + 9 * 3600e3), md = `${p2(kst.getUTCMonth() + 1)}/${p2(kst.getUTCDate())}`;
const bm = fs.mkdtempSync(path.join(os.tmpdir(), "bm-"));
fs.writeFileSync(path.join(bm, "Text.txt"), sms("hd", md, "00:01", 100000));                     // 연결 폴더(Shortcuts 폴더)에 저장된 문자
fs.writeFileSync(path.join(bm, "Text 1.txt"), sms("hd", md, "00:02", 20000, true));
const logText = [sms("bc", md, "00:03", 350000), sms("wr", md, "00:04", 9900)].join("\n");     // 로그 파일에 이어 붙은 문자
(async () => {
  const r = await run({ runsInWidget: true, withFiles: false, bookmarkDir: bm, logText });
  const j = r.rows.join(" | ");
  for (const need of ["35/60만", "8/40만", "0.99/10만"]) assert.ok(j.includes(need), `${need} 없음: ${j}`);
  const empty = await run({ runsInWidget: true, withFiles: false });                              // 아무 것도 없을 때 log.txt 를 만들어 둔다
  assert.ok(fs.existsSync(path.join(empty.tmp, "CardLedger/log.txt")), "log.txt 자동 생성");
  assert.ok(!empty.rows.join("|").includes("오류"), "빈 상태에서 오류 없음");
  console.log("LOG MODE OK (14개월 로그 연도 복원·작년 날짜 비누출·연도 넘김·윤일·연결 폴더+log.txt+inbox 위젯 실행)");
})().catch(e => { console.error("LOG MODE FAIL", e.message); process.exit(1); });
