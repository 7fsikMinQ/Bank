#!/bin/sh
# 전체 테스트를 여러 시간대(한국/UTC/미국서부/UTC+14)에서 반복 실행 — 월 경계가 폰·서버 시간대에 흔들리지 않는지 확인
# 하나라도 실패하면 즉시 종료(exit 1). 출력 필터로 실패를 가리지 않는다.
set -eu
cd "$(dirname "$0")/.."
node scripts/build-single.js
node scripts/build-quest.js
for tz in Asia/Seoul UTC America/Los_Angeles Pacific/Kiritimati; do
  echo "== TZ=$tz"
  for t in ledger real-sms tiers body-date month-sim log-mode file-names user-file-names simple-mode security globals cards-fuzz dates widget-mock widget-app-mock quest-core quest-widget docs-sync; do
    out=$(TZ=$tz node "test/$t.test.js") || { echo "FAILED: test/$t.test.js (TZ=$tz)"; echo "$out"; exit 1; }
    echo "   $(echo "$out" | grep -E 'OK' | tail -1)"
  done
done
echo "ALL SUITES PASSED"
