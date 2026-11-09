---
name: pdf-methods-status
description: KIGTE PDF 다운로드 방법별 구현 현황 및 파일 위치 (2026-07-02 기준)
metadata: 
  node_type: memory
  type: project
  originSessionId: 0bba556c-cd82-4f88-b8c2-084ed77f5116
---

# PDF 구현 현황 (2026-07-02)

## 화면별 현재 적용 방법

| 화면 | 방법 | 라이브러리 | 주요 파일 |
|------|------|-----------|---------|
| 현장평가 결과보고서 | **방법3** (프론트엔드 벡터 PDF) | @react-pdf/renderer | `EvlResultReport.tsx`, `EvlResultReportPdf.tsx` |
| 방문심사 영수증 | **원본** (html2canvas 이미지 PDF) | html2pdf.js | `SptRciptDtlModel.tsx` |

## 방법1 백업

- **대상**: 현장평가 결과보고서 PDF (Java 서버사이드)
- **백업 파일**: `납품문서/260702_방법1_백업_EvlServiceImpl_generateEvlResultReportPdf.java`
- **원본 위치**: `src/main/java/kr/co/kigte/spt/evl/service/impl/EvlServiceImpl.java` (메서드 유지됨, API는 살아있음)
- **라이브러리**: openhtmltopdf 1.0.10 (Apache PDFBox 기반)

## 방법3 구현 상세 (현장평가 결과보고서)

- **신규 파일**: `src/main/webapp/src/pages/spt/evl/EvlResultReportPdf.tsx`
- **변경 파일**: `src/main/webapp/src/pages/spt/evl/EvlResultReport.tsx` — `onPdfDnload()` 만 교체
- **폰트**: NotoSansKR-Regular/Bold (webpack import, `src/fonts/notosanskr/`)
- **데이터**: 화면에 이미 로드된 `scoreData`, `reportData`, props 재사용 (API 추가 호출 없음)
- **테이블 열비율**: 기관정보 30/70, 환산점수 40/60, 섹션헤더 20/80
- **의견 본문**: 방법1-B' 독립 View 방식 → 줄 단위 분할, 글자 짤림 없음
- **빌드**: React ✅ Maven ✅ (2026-07-02 완료)

## 방법 비교

| | 방법1 (Java) | 방법3 (@react-pdf) | 원본 (html2pdf.js) |
|---|---|---|---|
| 생성 위치 | 서버 | 브라우저 | 브라우저 |
| 텍스트 품질 | 벡터 | 벡터 | 이미지(PNG) |
| 한국어 폰트 | classpath TTF | webpack TTF import | 브라우저 렌더링 |
| 글자 잘림 | 없음 | 없음 | 페이지 경계에서 발생 |

**Why:** 방법1은 개발서버 확인용으로 이미 배포됨. 방법3은 동일 품질을 프론트에서 구현하여 서버 부하 없이 처리.
**How to apply:** 다른 PDF 화면에 방법3 적용 시 `EvlResultReportPdf.tsx` 패턴 참고.
