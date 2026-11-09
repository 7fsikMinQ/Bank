---
name: PDF 다운로드 잘림 이슈 해결 계획
description: EvlResultReport.tsx PDF 잘림 이슈 - 현재 적용 방식과 단계별 대안
type: project
originSessionId: 67d8384b-9de8-4577-a535-deb3a58c663a
---
현재 `spt/evl/EvlResultReport.tsx`에 block-by-block(html2canvas + jsPDF) 방식 적용 완료 (2026-04-21).

**Why:** html2pdf.js가 전체 HTML을 단일 이미지로 렌더링 후 픽셀 기준으로 자르는 구조적 한계로 한글 텍스트 잘림 발생.

**현재 구현**: 행(pdf-block) 단위로 html2canvas 렌더링 → 높이 측정 → 페이지에 안 들어가면 다음 페이지에 배치. 이미지 기반이지만 행 단위로 잘림 없음. 단일 행이 A4 한 장 초과 시 예외.

**단계별 대안 (방법 1은 불가)**:
- 1단계: 현재 구현 테스트 → 부족하면
- 2단계: 방법 2(@react-pdf/renderer) 또는 방법 3(서버사이드 Flying Saucer) 적용
- 대상 파일 총 12개 (`edm/rpt/` 9개, `spt/evl/EvlResultReport.tsx`, `spt/evl/EvlInspctChkDtl.tsx`, `spt/sys/SptRciptDtlModel.tsx`)

**How to apply:** PDF 관련 작업 시 현재 방식 먼저 확인, 추가 요청 시 방법 2/3 중 선택 진행.
