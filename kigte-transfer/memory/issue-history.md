---
name: issue-history
description: KIGTE 프로젝트 버그/요청 이력 (완료/미완료/제외 상태 추적)
metadata: 
  node_type: memory
  type: project
  originSessionId: 0bba556c-cd82-4f88-b8c2-084ed77f5116
---

# KIGTE 이슈 이력

> 상태: ✅ 완료 | ⏳ 미완료 | ➖ 제외

---

## 최근 완료 (2026-07-01 ~ 2026-07-02)

| # | 상태 | 날짜 | 내용 |
|---|------|------|------|
| - | ✅ | 2026-07-01 | 현장평가 결과보고서 PDF 글자 잘림 → 방법1(openhtmltopdf) Java 서버사이드로 해결, 개발서버 배포 완료 |
| - | ✅ | 2026-07-02 | 현장평가 결과보고서 PDF → 방법3(@react-pdf/renderer) 프론트엔드로 전환 (`EvlResultReport.tsx`, `EvlResultReportPdf.tsx` 신규) |
| - | ✅ | 2026-07-02 | 방법1 Java 코드 백업 → `납품문서/260702_방법1_백업_EvlServiceImpl_generateEvlResultReportPdf.java` |

---

## 최근 완료 (2026-06-05 ~ 2026-06-08)

| # | 상태 | 날짜 | 내용 |
|---|------|------|------|
| - | ✅ | 2026-06-05 | 엑셀 다운로드 IllegalArgumentException — 드롭다운 255자 초과 → 숨긴 시트 참조(`createFormulaListConstraint`) 방식으로 수정 (EvlController, ResultController, EdmSysController, BfatController 4파일) |
| - | ✅ | 2026-06-05 | 현장평가 심사원 영수증 집계/금액 불일치 — SptRcipt.xml 3개 쿼리 정비(DISTINCT 정제) + SptRciptServiceImpl.saveSptRcipt에 updateSptRcipt 추가 (기존 insert-only → insert+update) |

---

## 2026-06-08 수정 요청사항 (현재 작업 대상)

| # | 상태 | 화면 | 내용 | 수정파일 |
|---|------|------|------|---------|
| 1 | ⏳ | 시스템관리 > 심사원관리 | 심사원명 검색 정확일치만 됨 — AES 암호화 컬럼 LIKE 불가, selectJudgList에서 복호화 후 Java 포함검색으로 변경 | `sys/user/service/impl/UserServiceImpl.java` |
| 2 | ⏳ | 시스템관리 > 검사실관리 | "이름" 검색 시 책임자명 검색 안 됨 — 동일 원인, selectInspctList에서 검사실명+책임자명 복호화 후 포함검색 | `sys/user/service/impl/UserServiceImpl.java` |
| 3 | ⏳ | 현장평가 > 평가결과 조회 | 심사 환산점수 소수점 미표출 — toFixed(0) → toFixed(1) | `spt/evl/EvlResultMngr.tsx:54` |
| 4 | ⏳ | 현장평가 > 심사원 보고서 | 안내 팝업 문구 수정 + \n → </br> | `spt/evl/SptDtl.tsx` handleTabChange |
| 5 | ➖ | 현장평가 > 영수증 상세 | 2개 검사실인데 1개 기준 금액 — 06-05 기 수정 건과 동일, 중복 |  |
| 6 | ⏳ | 현장평가 > 심사상세 | 유사문항 링크 명칭 변경 → "유사한 타범주 문항 답변 보기" | `spt/evl/EvlDtl.tsx:921` |
| 7 | ⏳ | 현장평가 > 심사상세 유사문항 팝업 | 팝업 제목 변경 → "다른 심사원이 입력한 유사문항 답변" | `spt/evl/EvlModal.tsx:135` |

---

## 방문심사 (SPT) 이슈

| # | 상태 | 날짜 | 내용 |
|---|------|------|------|
| #127 | ✅ | 2026-06-04 | 심사원 [제출] 클릭 시 TooManyResultsException — MIN() 집계로 수정 (`Evl.xml`) |
| #126 | ✅ | 2026-06-02 | 팀원 심사원 거부 시 관리자 메일 미발송 (`SchdulController.java`) |
| #125 | ✅ | 2026-06-02 | 현장평가 통계 엑셀 통계 행 컬럼 초과 (`SptStatController.java`) |
| #124 | ✅ | 2026-06-02 | 대상선정관리 엑셀 외부정도관리 대상여부 오표시 (`TrgtController.java`) |
| #123 | ➖ | 2026-06-02 | 심사원 영수증 미표출 — 정상 동작 안내 |
| #122 | ✅ | 2026-06-02 | 비의료기관 심사 중 의료기관 전용 문항 표출 (`Evl.xml`) |
| #121 | ✅ | 2026-06-02 | 저장 후 범주2 1번 문항으로 이동 (`EvlDtl.tsx`) |
| #120 | ✅ | 2026-06-02 | 분자유전 미심사 후 여러 문제 4가지 수정 (`EvlDtl.tsx`, `EvlServiceImpl.java`) |
| #119 | ✅ | 2026-06-02 | 분자유전 세부문항 예 선택 시 점수 칸 표출 (`EvlDtl.tsx`, `EvlCmmn.tsx`) |
| #118 | ✅ | 2026-06-02 | 세부분야 팝업 닫기 버튼 부재 (`EvlClosModal.tsx`, `EvlDtl.tsx`) |
| #117 | ✅ | 2026-06-02 | 심사원 보고서 탭 이동 시 안내 팝업 미표출 (`SptDtl.tsx`) |
| #116 | ✅ | 2026-06-01 | 영수증 관리 심사원 상세 조회 오류 — `TN_JUDG` IH_FIRST/IH_LAST 컬럼 누락 |
| #115 | ✅ | 2026-05-29 | 동의서 미제출 시 차단 누락 + UPSERT 처리 |
| #114 | ✅ | 2026-05-29 | 0.5점 문항 아니오 감점 합산 미반영 (`SptStat.xml`) |
| #113 | ✅ | 2026-05-29 | C타입 해당없음 체크 시 통계 오표시 (`SptStat.xml`) |
| #112 | ✅ | 2026-05-29 | 소수점 감점 통계 표시 누락 (`SptStat.xml`, `SptStatController.java`) |
| #111 | ✅ | 2026-05-27 | 관리자 협의완료 처리 시 상태값 미변경 (`SchdulServiceImpl.java`) |
| #110 | ✅ | 2026-05-27 | 심사원 거부 메일 수신자 오류 — DB 수정 |

---

## 숙련도평가 (EDM) 이슈

| 상태 | 날짜 | 내용 |
|------|------|------|
| ✅ | 2026-05-26 | FISH 결과보고서 유전자 목록·평가문항 중복 표시 (#109) |
| ✅ | 2026-04-21 | 현장평가통계 공란 답변이 "예"로 표시 |
| ✅ | 2026-04-13 | 이전 결과지 문항 불러오기 시 첫 번째 평가물질 문항으로만 등록 |

---

## 시스템 이슈

| 상태 | 날짜 | 내용 |
|------|------|------|
| ✅ | 2026-05-26 | 이메일 전송이력 "전체" 선택 시 페이징 불가 (#108) |
