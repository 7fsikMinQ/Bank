// 사용자 아이폰의 실제 카드 문자 형식(2026-10-08 스크린샷, 이름·끝4자리는 가명)으로 검증
const assert = require("assert");
const { aggregate, classify } = require("../scriptable/ledger-core.js");
const raw = (text, mtime, name = "Text.txt") => ({ name, text, mtime });
const W = "[Web발신]\n";
const SMS = {
  wrChk:  W + "우리카드(1234)체크승인\n홍*동님\n9,900원\n10/08 09:31\n무신사",
  wrCan1: W + "우리카드(1234)승인취소\n홍*동님\n9,900원\n10/08 09:31\n무신사",
  wrOk:   W + "우리카드(1234) 승인\n홍*동님\n9,900원 일시불\n10/08 09:34\n총누적1,700,047원\n주식회사 무신사",
  wrCan2: W + "우리카드(1234)승인취소\n홍*동님\n9,900원\n10/08 09:34\n주식회사 무신사",
  bcOk:   W + "BC바로(5678) 승인\n홍*동님\n9,900원 일시불\n10/08 09:27\n무신사페이먼츠\n총누적1,120,900원",
  bcCan:  W + "BC바로(5678)승인취소\n홍*동님\n9,900원 (10/08 사용)\n10/08 09:27\n무신사페이먼츠",
  hdOk:   W + "현대 네이버 승인\n홍*동\n9,900원 일시불\n10/08 09:36\n무신사\n누적516,000원",
  hdCan:  W + "현대 네이버 취소\n홍*동\n9,900원 일시불\n10/08 09:36\n무신사\n누적506,100원",
  shOk:   W + "신한카드(9999)승인 홍*동 9,900원\n(일시불)10/08 09:40 무신사페이먼\n누적91,583원",
  shCan:  W + "신한카드(9999)취소 홍*동 9,900원\n(일시불)10/08 09:40 무신사페이먼\n누적81,683원",
  shFx:   W + "신한해외 카드번호입력승인 홍*동\n(9999) 08/25 16:00\n22.00 달러 (US)ANTHROPIC*",
  shChk:  W + "신한체크승인 홍*동(0000) 12,000원\n(일시불)10/08 10:00 편의점\n누적5,000원",   // 사용자의 다른 카드(신한 체크) → 세면 안 됨
};
const id = t => { const c = classify({ sender: "", body: t }); return `${c.status}:${c.card ? c.card.id : "-"}:${c.amt ?? ""}`; };
assert.strictEqual(id(SMS.wrChk), "ok:wr:9900");   assert.strictEqual(id(SMS.wrCan1), "ok:wr:-9900");
assert.strictEqual(id(SMS.wrOk), "ok:wr:9900");    assert.strictEqual(id(SMS.wrCan2), "ok:wr:-9900");
assert.strictEqual(id(SMS.bcOk), "ok:bc:9900");    assert.strictEqual(id(SMS.bcCan), "ok:bc:-9900");
assert.strictEqual(id(SMS.hdOk), "ok:hd:9900");    assert.strictEqual(id(SMS.hdCan), "ok:hd:-9900");
assert.strictEqual(id(SMS.shOk), "ok:sh:9900");    assert.strictEqual(id(SMS.shCan), "ok:sh:-9900");
assert.strictEqual(id(SMS.shFx), "ok:sh:29040");   // 22.00 달러 × 1320 = 29,040원 (고정 환율)
assert.strictEqual(id(SMS.shChk), "nocard:-:");    // 신한체크는 내 4개 카드가 아님 → 무시

// 스크린샷 시나리오: 4개 카드 모두 "9,900원 승인 → 취소" = 순 0원. 우리는 체크승인/취소 + 승인/취소 두 쌍
const NOW = "2026-10-08T05:00:00+09:00";
const t = (m) => `2026-10-08T${m}:00+09:00`;
let r = aggregate([
  raw(SMS.wrChk, t("09:31"), "Text.txt"), raw(SMS.wrCan1, t("09:31"), "Text 1.txt"),
  raw(SMS.wrOk, t("09:34"), "Text 2.txt"), raw(SMS.wrCan2, t("09:34"), "Text 3.txt"),
  raw(SMS.bcOk, t("09:27"), "Text 4.txt"), raw(SMS.bcCan, t("09:27"), "Text 5.txt"),
  raw(SMS.hdOk, t("09:36"), "Text 6.txt"), raw(SMS.hdCan, t("09:36"), "Text 7.txt"),
  raw(SMS.shOk, t("09:40"), "Text 8.txt"), raw(SMS.shCan, t("09:40"), "Text 9.txt"),
  raw(SMS.shChk, t("10:00"), "Text 10.txt"),
], "2026-10-08T12:00:00+09:00");
assert.deepStrictEqual(r.sum, { bc: 0, hd: 0, sh: 0, wr: 0 });
// 카드사 "총누적/누적" 금액은 그달 누적이 아니므로 합계에 영향을 주지 않는다(위 순 0원이 그 증거)

// 승인만 하고 취소 안 한 경우 합산
r = aggregate([raw(SMS.bcOk, t("09:27")), raw(SMS.hdOk, t("09:36"), "Text 1.txt"), raw(SMS.shOk, t("09:40"), "Text 2.txt"), raw(SMS.wrOk, t("09:34"), "Text 3.txt")], "2026-10-08T12:00:00+09:00");
assert.deepStrictEqual(r.sum, { bc: 9900, hd: 9900, sh: 9900, wr: 9900 });

// 월별 보정(월 중간부터 사용 시작한 경우의 "시작 잔액"): 지정한 달에만 적용, 다음 달엔 자동으로 사라짐
const adj = { "2026-10": { bc: 1111000, hd: 506100, sh: 81683, wr: 1690147 }, "2026-11": { bc: 5 } };
r = aggregate([raw(SMS.bcOk, t("09:27"))], "2026-10-08T12:00:00+09:00", adj);
assert.deepStrictEqual(r.sum, { bc: 1111000 + 9900, hd: 506100, sh: 81683, wr: 1690147 });
r = aggregate([raw(SMS.bcOk.replace("10/08 09:27", "11/02 09:27"), "2026-11-02T09:27:00+09:00")], "2026-11-03T12:00:00+09:00", adj);
assert.deepStrictEqual(r.sum, { bc: 9900 + 5, hd: 0, sh: 0, wr: 0 });   // 11월엔 10월 보정이 적용되지 않음
r = aggregate([], "2026-10-08T12:00:00+09:00", { bc: 100 });            // 예전 방식(모든 달 적용)도 유지
assert.strictEqual(r.sum.bc, 100);
console.log("REAL SMS OK (BC바로·현대 네이버·신한·우리 실제 문자 10종 + 월별 보정)");

// ── 달러 결제: 고정 환율 1320 ──────────────────────────────────────────────
const { FX_USD_KRW } = require("../scriptable/ledger-core.js");
assert.strictEqual(FX_USD_KRW, 1320);
const fx = body => { const c = classify({ sender: "", body: W + body }); return `${c.status}:${c.card ? c.card.id : "-"}:${c.amt ?? ""}`; };
assert.strictEqual(fx("신한해외 카드번호입력승인 홍*동\n(9999) 08/25 16:00\n22.00 달러 (US)ANTHROPIC*"), "ok:sh:29040");  // 실제 문자
assert.strictEqual(fx("신한해외 카드번호입력취소 홍*동\n(9999) 08/25 16:00\n22.00 달러 (US)ANTHROPIC*"), "ok:sh:-29040");  // 해외 취소
assert.strictEqual(fx("우리카드(1234) 해외승인\n홍*동님\nUSD 10.50\n10/08 09:34\nAMAZON"), "ok:wr:13860");
assert.strictEqual(fx("BC바로(5678) 해외승인\n홍*동님\n$5\n10/08 09:34\nOPENAI"), "ok:bc:6600");
assert.strictEqual(fx("현대 네이버 승인\n홍*동\n1,234.56 달러\n10/08 09:36\nAPPLE"), "ok:hd:1629619");  // 1234.56×1320=1,629,619.2 → 반올림
assert.strictEqual(fx("현대 네이버 승인\n홍*동\n9,900원 일시불\n10/08 09:36\nAPPLE 10 달러"), "ok:hd:9900");   // 원 금액이 있으면 원 금액 우선(환산 안 함)
assert.strictEqual(fx("신한카드(9999)승인 홍*동 12.50 엔\n10/08 09:40 일본"), "noamount:sh:");               // 달러 외 통화는 계산 안 함 → 위젯 ⚠︎
let rr = aggregate([raw(W + "신한해외 카드번호입력승인 홍*동\n(9999) 08/25 16:00\n22.00 달러 (US)ANTHROPIC*", "2026-10-08T09:00:00+09:00"),
                    raw(W + "신한카드(9999)승인 홍*동 9,900원\n(일시불)10/08 09:40 무신사페이먼\n누적91,583원", "2026-10-08T09:40:00+09:00", "Text 1.txt")], "2026-10-08T12:00:00+09:00");
assert.strictEqual(rr.sum.sh, 29040 + 9900); assert.strictEqual(rr.unparsed, 0);
assert.strictEqual(rr.rows.find(x => x.fx).amt, 29040);

// ── 우리 "두 가지 표기" 모두: (A) "우리카드(…)체크승인/승인" (B) "BC 체크 …" ────────────────
const wr = body => { const c = classify({ sender: "", body: W + body }); return `${c.status}:${c.card ? c.card.id : "-"}:${c.amt ?? ""}`; };
assert.strictEqual(wr("우리카드(1234)체크승인\n홍*동님\n9,900원\n10/08 09:31\n무신사"), "ok:wr:9900");           // A (실제 문자)
assert.strictEqual(wr("우리카드(1234) 승인\n홍*동님\n9,900원 일시불\n10/08 09:34\n총누적1,700,047원\n무신사"), "ok:wr:9900");
for (const label of ["BC체크(1234)", "BC 체크(1234)", "비씨체크(1234)", "비씨 체크(1234)", "[BC체크]"]) {       // B (BC 체크 표기 변형 전부)
  assert.strictEqual(wr(`${label} 승인\n홍*동님\n3,000원 일시불\n10/08 09:34\n카페`), "ok:wr:3000", label);
  assert.strictEqual(wr(`${label} 승인취소\n홍*동님\n3,000원\n10/08 09:34\n카페`), "ok:wr:-3000", label);
}
assert.strictEqual(wr("BC체크(1234) 해외승인\n홍*동님\n10.00 달러\n10/08 09:34\nOPENAI"), "ok:wr:13200");      // B + 달러
assert.strictEqual(wr("BC바로(5678) 승인\n홍*동님\n3,000원\n10/08 09:34\n우리약국"), "ok:bc:3000");              // BC바로는 우리로 안 샘 (가맹점 '우리약국' 무시)
assert.strictEqual(wr("BC체크(1234) 승인\n홍*동님\n3,000원\n10/08 09:34\nBC바로마트"), "ok:wr:3000");           // BC체크는 BC바로로 안 샘 (가맹점 'BC바로마트' 무시)
// 두 표기가 같은 달에 섞여도 우리 한 카드로 합산
rr = aggregate([raw(W + "우리카드(1234)체크승인\n홍*동님\n9,900원\n10/08 09:31\n무신사", "2026-10-08T09:31:00+09:00"),
                raw(W + "BC체크(1234) 승인\n홍*동님\n3,000원 일시불\n10/08 09:34\n카페", "2026-10-08T09:34:00+09:00", "Text 1.txt")], "2026-10-08T12:00:00+09:00");
assert.strictEqual(rr.sum.wr, 12900); assert.strictEqual(rr.sum.bc, 0);
console.log("FX + WOORI(두 표기) OK");
