// 네트워크/동적코드 사용이 없음을 정적으로 확인
const fs = require("fs"); const bad = [/\bfetch\s*\(/, /\bRequest\s*\(/, /XMLHttpRequest/, /https?:\/\//, /\beval\s*\(/, /new Function/, /WebView/, /Keychain/, /Pasteboard/, /\bMail\b/, /Contact/];
for (const f of ["scriptable/ledger-core.js", "scriptable/CardWidget.js", "scriptable/CardWidget.single.js"]) {
  const s = fs.readFileSync(f, "utf8");
  for (const re of bad) if (re.test(s)) { console.error("SECURITY FAIL", f, re); process.exit(1); }
}
// CardQuest: 화면(WebView)을 쓰므로 WebView 만 허용하고 나머지 금지 패턴은 동일하게 검사. 외부 주소·외부 스크립트 금지.
const badQ = bad.filter(re => !/WebView/.test(String(re)));
for (const f of ["scriptable/quest-core.js", "scriptable/CardQuest.body.js", "scriptable/CardQuest.single.js"]) {
  const s = fs.readFileSync(f, "utf8");
  for (const re of badQ) if (re.test(s)) { console.error("SECURITY FAIL", f, re); process.exit(1); }
  if (/<script[^>]+src|<link|<iframe|window\.open|location\s*=/i.test(s)) { console.error("SECURITY FAIL (외부 리소스/이동)", f); process.exit(1); }
}
// 따옴표·주석 밖에 한글이 섞이지 않았는지(번역기/입력기 사고 방지)
for (const f of ["scriptable/CardWidget.single.js", "scriptable/CardQuest.single.js"]) {
  const strip = t => t.replace(/\/\/[^\n]*/g, "").replace(/`(?:\\.|[^`\\])*`/g, m => "``" + [...m.matchAll(/\$\{([^}]*)\}/g)].map(x => " " + x[1].replace(/"(?:\\.|[^"\\\n])*"/g, '""') + " ").join("")).replace(/"(?:\\.|[^"\\\n])*"/g, '""').replace(/\/(?![\/*])(?:\\.|\[[^\]]*\]|[^\/\n\\])+\/[gimsuy]*/g, "/r/");
  const o = strip(fs.readFileSync(f, "utf8"));
  const m = o.match(/.*[가-힣].*/g); if (m) { console.error("HANGUL OUTSIDE STRINGS", f, m); process.exit(1); }
}
console.log("SECURITY OK (no network/eval/clipboard/contacts access in scripts)");
