// 사용자 실제 파일 이름 형태: 20261008_131014 (밑줄, 확장자 있음/없음), 내용은 문자 원문
const assert = require("assert"); const path = require("path");
const { run } = require("./helpers/scriptable-mock");
const kst = new Date(Date.now() + 9 * 3600e3), q = n => String(n).padStart(2, "0");
const ymd = `${kst.getUTCFullYear()}${q(kst.getUTCMonth() + 1)}${q(kst.getUTCDate())}`, md = `${q(kst.getUTCMonth() + 1)}/${q(kst.getUTCDate())}`;
const W = "[Web발신]\n";
(async () => {
  const files = {
    [`${ymd}_131014.txt`]: W + `현대 네이버 승인\n홍*동\n9,900원 일시불\n${md} 13:10\n무신사\n누적516,000원`,
    [`${ymd}_131030`]: W + `현대 네이버 취소\n홍*동\n9,900원 일시불\n${md} 13:10\n무신사\n누적506,100원`,           // 확장자 없음
    [`${ymd}_131200.txt`]: W + `BC바로(5678) 승인\n홍*동님\n350,000원 일시불\n${md} 13:12\n무신사페이먼츠\n총누적1,120,900원`,
    [`${ymd}_131300.txt`]: W + `우리카드(1234)체크승인\n홍*동님\n9,900원\n${md} 13:13\n무신사`,
    [`${ymd}_131400.txt`]: W + `신한카드(9999)승인 홍*동 12,000원\n(일시불)${md} 13:14 무신사페이먼\n누적91,583원`,
  };
  const r = await run({ runsInWidget: false, withFiles: false, extraFiles: files });
  const d = r.diag.join("\n"), j = r.rows.join("|");
  for (const need of ["OK 현대ED3 +9,900원", "OK 현대ED3 −9,900원", "OK BC바로KPASS +350,000원", "OK 우리다모아 +9,900원", "OK 신한 +12,000원"]) assert.ok(d.includes(need), need + "\n" + d);
  for (const need of ["35/60만", "0/40만", "0.99/10만", "12,000원"]) assert.ok(j.includes(need), need + " in " + j);
  console.log("USER FILE NAMES OK (20261008_131014 형태, 확장자 있음/없음, 4개 카드)");
})().catch(e => { console.error("FAIL", e.message); process.exit(1); });
