// 파일 이름 변형: 확장자 없는 파일("텍스트"), iCloud 미다운로드 placeholder(".이름.icloud"), 숨김 파일 무시
const assert = require("assert");
const { run } = require("./helpers/scriptable-mock");
const kst = new Date(Date.now() + 9 * 3600e3), p2 = n => String(n).padStart(2, "0"), md = `${p2(kst.getUTCMonth() + 1)}/${p2(kst.getUTCDate())}`;
const W = "[Web발신]\n";
(async () => {
  const r = await run({
    runsInWidget: false, withFiles: false,
    extraFiles: { "텍스트": W + `현대 네이버 승인\n홍*동\n100,000원 일시불\n${md} 00:01\n무신사`, "텍스트 1": W + `현대 네이버 취소\n홍*동\n20,000원 일시불\n${md} 00:02\n무신사`, ".DS_Store": "쓰레기", "adjust.json": "{}" },
    placeholder: { name: "Text 7.txt", text: W + `BC바로(5678) 승인\n홍*동님\n350,000원 일시불\n${md} 00:03\n무신사페이먼츠` },
  });
  const d = r.diag.join("\n");
  assert.ok(d.includes("OK 현대ED3 +100,000원"), "확장자 없는 파일 읽기\n" + d);
  assert.ok(d.includes("OK 현대ED3 −20,000원"), "확장자 없는 파일(취소)\n" + d);
  assert.ok(d.includes("OK BC바로KPASS +350,000원"), "iCloud 미다운로드 파일(.icloud) 내려받아 읽기\n" + d);
  assert.ok(!d.includes("쓰레기"), "숨김 파일 무시");
  const j = r.rows.join("|"); assert.ok(j.includes("8/40만") && j.includes("35/60만"), "합계 반영: " + j);
  console.log("FILE NAMES OK (확장자 없는 파일·iCloud placeholder·숨김 파일 무시)");
})().catch(e => { console.error("FILE NAMES FAIL", e.message); process.exit(1); });
