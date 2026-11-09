---
name: popup-notice-plan
description: "사용자 만족도 조사 레이어 팝업 — 2026-10-15 운영 반영 완료(최종본 문서 0831요구사항/261016_팝업.md). 서버 시각(Date 헤더) 판정, 운영 10/19 00:00~10/30 24:00(KST), BUILD_FOR 한 줄 스위치, 검사실 대상, 그냥 닫으면 홈마다 다시 뜸(방식 B)"
metadata:
  node_type: memory
  type: project
  originSessionId: e486b737-9a74-4c83-aa18-3436793bb5ca
  modified: 2026-10-15T08:50:14.156Z
---

## 현재 상태 (2026-10-15, 이 노트가 기준)
- 고객 요청: 평가시스템에 **2026-10-19(월) 00:00 ~ 10-30(금) 24:00(한국시간)** 동안 이미지 팝업, "바로가기" → `https://forms.gle/ZY4oXRU45cNqroco9`.
- **운영 서버 반영 완료(2026-10-15 17시 이후)**: 운영 주소가 내려주는 번들 `main.84cd75c4.js`, `testHooks:!1`(운영용). 개발 서버는 `main.2f5436d0.js`(`testHooks:!0`), 개발 기간 10/15 10:00부터. DB·서버(Java/XML)·JSP 변경 없음.
- SVN: r1055 팝업 화면·규칙·이미지·`Main.tsx` / r1057 설정 파일 / r1058 방식 B·날짜 기억 `SurveyPopup.tsx`. 작업 폴더의 `BUILD_FOR`는 개발 서버용 `'dev'`(운영 빌드 때만 `'prod'`).
- **최종본 문서: `0831요구사항/261016_팝업.md`**(소스 전문은 실제 파일에서 가져와 자동 점검). 이전 `1014_팝업.md`·완료 메일 초안은 삭제함.

## 소스 (`src/main/webapp/src` 아래)
- 신규 `component/comn/SurveyPopup.tsx`(MUI Modal), `popupRule.ts`(순수 함수), `surveyPopupConfig.ts`(설정), `images/survey_popup_20261019.webp`(1254×1254, 157,926바이트). 수정 `pages/Main.tsx`(import 1줄 + `<SurveyPopup />` 1줄, CRLF). 새 파일도 CRLF.
- 이미지 안 "바로가기" 버튼 위에 투명 버튼(left 30.5%·top 87.8%·가로 39.1%·세로 8.2%). 팝업은 화면 정중앙, 너비 `min(92vw,520px)`.

## 설정 (`surveyPopupConfig.ts`) — 사용자가 직접 확정한 값
- `const BUILD_FOR: 'dev' | 'prod'` 한 줄 스위치. `WINDOWS.dev`는 사용자가 개발 서버 확인용으로 수시로 바꿈(2026-10-15 현재 10/15 10:00 ~ 10/31 00:00 미만), `WINDOWS.prod = 2026-10-19T00:00:00+09:00 ~ 2026-10-31T00:00:00+09:00`(30일 24시 = 31일 0시, 종료 미만). 날짜 문자열 오타(`T:14:00`)는 NaN이 되어 팝업이 조용히 안 뜸(이 경우 `261016_서버시각_확인.py`는 기본값으로 판정해 "뜹니다"로 잘못 나올 수 있음).
- **운영 빌드는 `'prod'` + 리스너 기본 프로필 `"prod"`**, 개발 빌드는 `'dev'` + `"local"`(운영용을 개발 서버에 올리면 운영 DB로 접속 시도). 구분은 번들 `testHooks:!1`(운영)/`!0`(개발) 또는 `261016_WAR_점검.py --target prod|dev`(운영 번들에는 두 기간 문자열이 모두 있어 날짜 검색으로는 구분 불가).
- `testHooks: (BUILD_FOR as string) === 'dev'` — `as string`은 필수: `BUILD_FOR='prod'`일 때 `TS2367`로 빌드가 실패하기 때문. `targets: ['2']`(검사실만, 관리자·심사원 포함 여부는 확인 요청 사항). `key: 'survey2026'`(저장 키, 다음 팝업 때 변경).

## 판정 로직
- **서버 시각 기준**: 메인 진입 시 `HEAD manifest.json?_=ts`(`no-store`, 3초 제한) → 응답 `Date`(GMT, 초 단위) + 0.5초·요청 중간 보정으로 **offset(서버−PC)만 접속당 1회 기억**, 홈에 들어올 때마다 `Date.now()+offset`으로 지금 시각을 새로 계산. 실패·헤더 없음·3초 초과 → PC 시각. `manifest.json`: `public/` → `build/` → `dispatcher-servlet.xml`의 `mvc:resources`(`/api/**`만 인증).
- 기간 `start <= now < end`. **방식 B(2026-10-15 사용자 결정)**: 체크 없이 닫으면 홈에 들어올 때마다 다시 뜸. "오늘 하루 보지 않기"를 체크하고 닫으면 `popup.survey2026.hideDate.<userId>` = 한국 날짜 저장 + 메모리 변수 `hiddenInThisVisit`('사용자ID|날짜')로 같은 접속·같은 날 숨김(새로고침 없이 자정이 지나면 다시 뜸).
- 시험 키(개발 빌드 한정): `popup.survey2026.force`='1', `popup.survey2026.now`=ISO 시각.

## 검증 요약
- 방식 B 동작 시험 21건 × PC 시간대 3종(63건) 통과, 옛 동작(방식 A)에 돌리면 6건 실패, 개발·운영 각각 실제 프로덕션 빌드 성공(`testHooks` 각각 `!0`/`!1`), WAR 점검 실패 0건, 풀린 폴더·WAR 파일 일치(classes 459·build 42·jar 100), 실제 서버 번들 확인. 시험 중 발견: 방식 B 초안은 체크 후 새로고침 없이 자정을 넘기면 안 뜨는 문제 → 날짜까지 기억하도록 수정.
- 한계: 운영의 실제 표시는 10/19 00:00 이후 검사실 계정으로 확인해야 함(운영 빌드는 시험 키 무시). 서버 `Date` 헤더가 초 단위라 경계 ±1초.

## 관련 서버 메모 (2026-10-15 확인)
- 운영 `https://pe.kigte.org/`: HTTP(80)도 그대로 200(서버는 HTTPS 이동 안 시킴, 브라우저가 HTTPS로 올림, HSTS 있음). 운영 Tomcat 8.5.88 `/home/tomcat`, `webapps/ROOT`, 443은 Tomcat이 직접 처리(`pe.kigte.org.pfx`). **인증서 만료 2026-12-23**. HTTPS 강제 설정은 변경하지 않기로 결정(백업 파일은 삭제함). 개발 서버는 8180 HTTP만 있고 HTTPS 입구 없음(HTTPS 강제 설정은 개발에 적용하면 안 됨).

## 이력 (설계가 바뀐 과정)
- 2026-10-14 요청 접수·안 1(고정형) 구현 → 판정 방식 PC 날짜 → KST 시각 → **서버 시각** → 시험용 키 개발 빌드 한정 → 2026-10-15 방식 B + 날짜 기억 + `TS2367` 수정 → 운영 반영.
- 공수는 사용자가 요청할 때만 언급(이전 합의 안은 2.0 M/D).

## 주의
- 빌드 중 `src`에 import 없는 임시 test 파일이 있으면 TS1208로 빌드 실패 → 임시 시험 파일은 `src` 밖(임시 복사본)에서만, `node_modules`는 junction으로 연결하고 삭제할 때는 junction부터 `rmdir`.
- 사용자가 직접 수정한 설정값은 존중(내가 바꾸지 않음).
