// 네트워크/동적코드 사용이 없음을 정적으로 확인
const fs = require("fs"); const bad = [/\bfetch\s*\(/, /\bRequest\s*\(/, /XMLHttpRequest/, /https?:\/\//, /\beval\s*\(/, /new Function/, /WebView/, /Keychain/, /Pasteboard/, /\bMail\b/, /Contact/];
for (const f of ["scriptable/ledger-core.js", "scriptable/CardWidget.js", "scriptable/CardWidget.single.js"]) {
  const s = fs.readFileSync(f, "utf8");
  for (const re of bad) if (re.test(s)) { console.error("SECURITY FAIL", f, re); process.exit(1); }
}
console.log("SECURITY OK (no network/eval/clipboard/contacts access in scripts)");
