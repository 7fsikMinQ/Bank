---
name: upcoming-tasks
description: "KIGTE 앞으로 할 작업 — 우선순위상/중/하 및 개발누락사항 (260604 기준, 2026-06-05 유지보수 최종본 반영)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 0bba556c-cd82-4f88-b8c2-084ed77f5116
---

# KIGTE 앞으로 할 작업

> 문서 기준: `납품문서/260604_우선순위상.md`, `260604_우선순위중.md`, `260604_우선순위하.md`, `260604_개발누락사항.md`, `260605_유지보수.md`
> 총합: 25건 / 91일 / 1,820만원 (1MD = 20만원)

---

## 2026-06-08 즉시 처리 대상 (버그수정)

| # | 파일 | 내용 |
|---|------|------|
| 1 | `UserServiceImpl.java` selectJudgList | 심사원명 검색: AES 암호화→복호화 후 Java 포함검색 |
| 2 | `UserServiceImpl.java` selectInspctList | 검사실 이름: 검사실명+책임자명 복호화 후 포함검색 |
| 3 | `EvlResultMngr.tsx:54` | 환산점수 toFixed(0) → toFixed(1) |
| 4 | `SptDtl.tsx` handleTabChange | 안내팝업 문구+줄바꿈 \n→</br> |
| 6 | `EvlDtl.tsx:921` | 유사문항 링크 "유사한 타범주 문항 답변 보기" |
| 7 | `EvlModal.tsx:135` | 팝업제목 "다른 심사원이 입력한 유사문항 답변" |

---

## 우선순위 상 (13건 / 44일)

| # | 항목 | 기간 | 핵심 파일 |
|---|------|------|---------|
| 1.1 | 현황조사 목록 다운로드/업로드 | 2일 | `CeController.java`, `Ce.xml`, `CstsMngr*.tsx` |
| 1.2 | 근거논문 파일명 자동 변경 | 2일 | `CstsDpSnpEtcServiceImpl.java:150/190`, `CstsNiSnpEtcServiceImpl.java:160/196` |
| 1.3 | 심사원 기관현황 팝업+다운로드+심사원 추가 | 5일 | `SchdulController.java`, `Schdul.xml`, `JudgInsttModal.tsx` |
| 1.4 | 평가일 변경 시 심사원 메일 발송 | 3일 | `SchdulController.java` saveSptInspctEvlday |
| 1.5 | 현재·이전 심사팀 비교 컬럼+엑셀 | 3일 | `JudgManage.tsx`, `Schdul.xml` |
| 1.6 | 심사 협의완료 해제 기능 ✅완료(260609) | 4일 | `EvlController.java` cancelDscssAt, `SptDtl.tsx` — 단일버튼 토글, resetPresentnAt 포함. 상세: 납품문서/260609_...md |
| 1.7 | 심사원 공문 업로드/다운로드 | 3일 | `TN_SPT_JUDG_FILE` 신규, `SchdulController.java` |
| 1.8 | 현장평가 결과보고서 수령여부 컬럼+엑셀 | 3일 | `EvlResultMngr.tsx`, `Evl.xml` |
| 1.9 | 외부정도관리 결과 엑셀 다운로드 (2화면) | 3일 | `ResultController.java`, `Result.tsx` |
| 1.10 | 외부정도관리 통계 엑셀 다운로드 | 3일 | `EdmStatController.java`, `StatIndex/StatSctn.tsx` |
| 1.11 | 외부정도관리 최종 제출 후 수정 가능 ✅완료(260609) | 4일 | `edm/evl/EvlServiceImpl.insertPresentn` deletePresentn 선삭제 + `GeneList.tsx` "수정 제출" 버튼. 기간체크는 onPresentn 기존 로직 재사용. 상세: 납품문서/260609_...md |
| 1.12 | 외부정도관리 통계 합계 표 추가 | 3일 | `EdmStatController.java` selectStatSummaryList, `StatItem.tsx` |
| 1.13 | 외부정도관리 범주5 STR marker 통계 | 5일 | `EdmStatController.java`, `StatInspctIdrchMttrDtl.tsx` |

---

## 우선순위 중 (7건 / 30일)

| # | 항목 | 기간 | 핵심 파일 |
|---|------|------|---------|
| 2.1 | 심사원 활동 확인서 발급 | 5일 | `SchdulController.java`, `TN_JUDG_AGRE` ALTER, `JudgCnfrmIndex.tsx` |
| 2.2 | 검사실 계정 결과조회 메뉴 추가 | 4일 | `InspctEvlResult.tsx` (신규 화면) |
| 2.3 | 검사실 주차 가능 여부 입력/조회 | 2일 | `CstsInstt.tsx`, 기관 테이블 ALTER |
| 2.4 | 검사실 결과 제출자 정보 조회 | 4일 | `InspctEvlResultRcept.tsx` 신규 |
| 2.5 | 범주5 자동 채점 (난이도 최상) | 6일 | `ResultController.java` grdngIdrch, `TN_EDM_IDRCH_STR_RESULT` |
| 2.6 | 세포수 계산 표(Matrix) 입력 | 6일 | `TypeGTable.tsx` 신규, DB 컬럼 추가 |
| 2.7 | 수령증(외부정도관리) PDF 출력 | 3일 | `ResultController.java`, PDF 서식 고객 확정 필요 |

---

## 우선순위 하 (5건 / 17일)

| # | 항목 | 기간 | 핵심 파일 |
|---|------|------|---------|
| 3.1 | 검사실 인증/인력현황 화면 연동 | 5일 | `CeController.java`, `HnfModal.tsx` 신규 |
| 3.2 | SNP EffectSize(OR/Beta) 컬럼 추가 | 2일 | `TN_DISSPD_SNP_ETC`/`TH_` ALTER, `TnDisspdSnpEtcVO.java` |
| 3.3 | 현장평가 완료 처리 (일괄 체크박스) | 3일 | `EvlController.java` updateAudtCompt, `EvlResultMngr.tsx` |
| 3.4 | 심사추가정보 기입 | 2일 | `SptDtl.tsx`/`EvlDtl.tsx`, DB 컬럼 추가 (고객 확인 필요) |
| 3.5 | 분석수당(외부정도관리) 신규 기능 | 5일 | `TN_EDM_ANLYS_RSLT` 신규, `AnlysController.java`, `AnlysIndex.tsx` |

---

## 공통 구현 패턴

- **엑셀 다운로드**: response에 직접 write (`XSSFWorkbook`), `URLEncoder.encode` 파일명
- **엑셀 업로드**: 파싱→list 반환(DB 저장X)→프론트 setList→기존 [저장] 버튼으로 반영
- **메일 발송**: `ThEmailTrnsmisVO` + `commonService.sendEmail(evo)`
- **PDF 생성**: `openhtmltopdf` + `PdfRendererBuilder` (기존 `generateEvlResultReportPdf` 참고)
- **엑셀 드롭다운 255자 우회**: `createFormulaListConstraint` (숨긴 시트 참조)
- **권한 분기**: 관리자=`'1000'`, 심사원=`3xxx`, 검사실=`2001`/`2002`
- **AlertModal**: `dangerouslySetInnerHTML` → 줄바꿈은 `\n` 아닌 `</br>` 사용
- **신규 화면**: `TN_MENU` 테이블 INSERT + `App.tsx` 라우터 등록 필수
