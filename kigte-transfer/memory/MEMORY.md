# KIGTE Project Memory

## Project Overview
- **이름**: KIGTE v1.0.0 - 유전자검사 품질관리 시스템 (CEN Corporation)
- **Backend**: Spring 4.3.25 + eGov Framework RTE 3.10.0, Java 8, MyBatis 3.5.9, MariaDB, Tomcat 7(개발·빌드 기준 표기이며 운영 서버 실제는 Tomcat 8.5.88, 2026-11-06 로그 확인)
- **Frontend**: React 18.3.1, TypeScript 4.9.5, MUI 7.2.0, Axios
- **Build**: Maven (WAR), npm (React → JSP)
- **경로**: `C:\svn\dna\work\kigte`

## 주요 경로
- Java 소스: `src/main/java/kr/co/kigte/`
- SQL 매퍼: `src/main/java/kr/co/kigte/**/sql/*.xml` (classpath:/kr/co/kigte/**/sql/*.xml)
- MyBatis 설정: `src/main/resources/egovframework/sqlmap/kigte/sql-mapper-config.xml`
- Spring 설정: `src/main/resources/egovframework/spring/`
- Frontend: `src/main/webapp/src/`
- mapUnderscoreToCamelCase=true (DB 컬럼 → Java camelCase 자동 변환)

## DB 설계 규칙
- **테이블 접두사**: TN_(일반), TH_(이력), TS_(시스템)
- **PK**: varchar(20), TS_SEQUENCES로 채번
- **핵심 연결키**: CSTS_ID
- **공통 컬럼**: REGIST_ID, REGIST_DT, UPDT_ID, UPDT_DT (거의 모든 테이블)
- **파일 저장**: longblob (TN_ATCH_FILE, TN_EDM_ATCH_FILE, TN_SPT_ATCH_FILE)
- **삭제 검토 대상**: TN_CSTS_ETC, TN_DOC_EVL, TN_DVL

## 패키지 구조 (Java)
| 패키지 | 역할 |
|--------|------|
| cmmn | 공통 (코드, 첨부파일, 그리드VO) |
| main | 메인/대시보드, 알림메시지 |
| sys | 시스템관리 (사용자, 메뉴, BBS, 코드, 정책, 수수료, 개발정보) |
| csts | 검사기관 등록 (ce: 기관정보, cte: 검사항목) |
| dvl | 개발 (trgt: 대상선정, bfat: 서면평가, pert: 전문가평가, objc: 이의신청, clgn: 검증) |
| edm | 숙련도평가 (evl: 평가, result: 결과, sys: 시스템관리, rpt: 보고서, stat: 통계) |
| spt | 방문심사 (sys: 분류/문항, schdul: 일정, evl: 평가, thts: 의견, rcipt: 영수증) |
| stat | 통계 |

## 업무 흐름 / 매뉴얼
- [4대 업무흐름 + 역할·권한코드](business-workflow.md) — 현황조사→서면평가/현장평가/외부정도관리, 관리자(1000)/검사실담당(2001)/총괄책임자(2002,이의신청불가)/심사원(300x)
- [사용자 매뉴얼 원본 위치](reference-user-manual.md) — Downloads 폴더 HTML, 계정정보(ID/PW)는 메모리에 미저장(민감정보)

## PDF 이슈
- [PDF 다운로드 잘림 해결 계획](project_pdf_fix.md) — block-by-block 적용 완료, 부족 시 방법 2/@react-pdf 또는 방법 3/서버사이드로 전환 예정
- [PDF 방법별 구현 현황](pdf-methods-status.md) — 방법1(현장평가 결과보고서/Java백업), 방법3(현장평가 결과보고서/React적용) 상태

## 이슈 이력
- [이슈 이력 전체](issue-history.md) — 완료/미완료/제외 상태 추적 (최종 갱신: 2026-06-08)
- [260831 유지보수요청 진행상태](260831-maintenance-status.md) — **맨 아래 "2026-10-15 최신 기준"이 현재 상태**: 운영 반영 완료(연번 1~5·8·9 + 팝업, 운영 DB는 연번9 칸 추가), **6·7은 `src/main`에 재반영(운영 미반영, 운영 반영 시 DDL·메뉴·WAR 필요, 작업 폴더로 운영 빌드하면 6·7이 섞이므로 주의)**, 개선 제안 3건(미구현), 작업복사본 로컬 변경 6개; 위쪽 날짜별 섹션은 이력


## 문서 세트
- **문서 세트(2026-10-16 최종, `0831요구사항/`)**: `261016_1~9.md`·`261016_팝업.md`·`261016_통합.md`(전체·부록 A 이전↔최종 diff) + **`261016_개발서버_전수테스트.md`·`261016_개발서버_시험데이터.sql`(6·7 개발서버 전수 시험, 003E·999E 등 10곳, 시나리오 SC0~SC9, 원복 포함)** + `261016_WAR_점검.py`·`261016_서버시각_확인.py` + `구현안_연번6_7/`. 이전 날짜 문서·`1012/`·`1013/` HTML 폴더·작업 폴더 잔여물은 모두 삭제(백업 zip: Downloads `KIGTE_옛문서백업_1012_1013_잔여물_261016.zip`). 자동 대조 230건·재검토 10회 통과 **+ 6·7 전용 `261016_6_7_개발서버_테스트.md`/`_개발서버_시험.sql`, `261016_6_7_운영서버_반영_테스트.md`/`_운영서버_반영.sql`(DDL 우선·메뉴·빌드·반영·롤백)**

## 앞으로 할 작업
- [만족도 조사 레이어 팝업](project_popup_notice_plan.md) — **2026-10-15 운영 반영 완료**, 최종본 `0831요구사항/261016_팝업.md`: 서버 시각(Date 헤더) 판정, `BUILD_FOR` 한 줄 스위치(개발 `'dev'` / 운영 `'prod'` + 리스너 프로필 local/prod), 운영 10/19 00:00~10/30 24:00 KST, 검사실 대상, 그냥 닫으면 홈마다 다시 뜸(방식 B), 인증서 만료 2026-12-23
- [우선순위 상/중/하 + 누락사항](upcoming-tasks.md) — 25건/91일/1820만원 (2026-06-04 명세, 2026-06-05 최종본)

- [인수인계·매뉴얼 최종본 재작성](project_handover_rewrite.md) — 2026-10-19 시작, **2026-10-21 최종: 폴더가 `26년11월_인수인계`·`26년11월_유검평_사용자매뉴얼`·`26년11월_산출물`(안의 문서도 `26년11월_` 접두어)**, 현장평가 사유 수정 반영, 작업 도구·번호체계·SVN 상태; **2026-10-22 9차: 운영 DB 기준 반영(총괄책임자 11화면) + 매뉴얼 화면별 기능 설명 fd_01~08 적용, 워드 274쪽, 인수인계 빌드는 build2.py**

- [현장평가 대상 선정 사유 오류 2건 수정안](project_spt_trgt_resn_fix.md) — 2026-10-21 수정 후 src 반영·커밋, **2026-10-23 개발 반영, 운영 10/27~28 예정**, 최종 시험 가이드 `0831요구사항/261023_개발_운영_최종시험가이드.md`(개발 전수·운영 읽기 전용, 저장 부작용 백업 보강 발견), **개발 서버 통합 시험서 `261026_개발서버_통합_최종시험서.md`(이 문서 하나로 시험, SQL 부록 포함)**

## 협업 스타일
- [작업 방식 피드백](feedback_work_style.md) — 실제 src 수정은 지시 시에만(지시 후엔 바로 적용), 고객 답변 양식, 검증 보고 방식, 임시 시험 파일은 src에 두지 말고 빌드 전 삭제, 사용자가 직접 확정한 설정 존중
- [스크린샷 주석 스타일](feedback_screenshot_annotation_style.md) — 문서 삽입 시 이미지 전체+빨간박스 강조+우측 설명란 (크롭 금지)

## 상세 내용 참조
- VO + SQL 전체 상세: `vo-sql-summary.md`
- DB 테이블 구조: 연번6·7이 쓰는 테이블(TN_TRGT_SLCTN·TN_CSTS·TN_SPT_ATCH_FILE·TN_SPT_TRGT·TN_INSPCT·TN_INSTT·공통코드·메뉴)은 `0831요구사항/261016_6.md` 5장(근거 등급은 DB 조회 필요 항목을 5-8 쿼리로 확인), 그 외 전체 DB 구조 문서는 미작성
- [메일 실패 처리 수정·롤백 상태](project_email_fail_handling.md) — 2026-10-20 수정본 15개 파일 백업(Downloads `KIGTE_메일수정본백업_261020`) 후 SVN 원본으로 롤백, 911E 시험용. 남은 이슈·안 A~E·재적용 방법
- [사용자매뉴얼 최신화(1020→11월판)](project_manual_1020.md) — 최종 배포 폴더 2026년11월_유검평_사용자매뉴얼(html 9개·스크린샷 303장·**워드 1개 244쪽→2026-10-22 현재 274쪽**), 원본·작업자료는 Downloads zip, 개인정보 가림은 확대 OCR 보강(이름 목록 밖 이름은 육안 확인 권장), 3001·3003 재분류 요약 화면은 관리자 캡처 대체
- [개발 DB → 로컬 복제 상태](project_local_db_copy.md) — 2026-10-28 덤프(729MB) 노트북 Windows 3306·WSL 3308·Docker 3307 복원·검증 완료, **집 데스크탑은 WSL Docker(127.0.0.1:3307)만 복원·검증 완료**(Windows·WSL 직접은 안 함, 복원 절차는 `C:\kigte_backup\복원_가이드.md`), 남은 대상 리눅스 서버
- [재택 운영 접속 방안 검토](project_home_remote_access.md) — **2026-10-30 최신**: 사내 SSH 터널 시험 통과, 집 데스크탑 확인(공인 IP 218.38.112.105 전용 확정·공유기 자동 재부팅 비활성화), **11/2 집 IP로 SSH 접속 기록 확인(22번 등록은 이미 된 상태, 승인 경위는 미확인)**, SSH 보안 강화는 안 하기로 결정, 집 PC는 노트북(CEN-MK)과 별개
- [운영 서버 재부팅·톰캣 중단 사건(2026-11-06)](project_prod_reboot_20261106.md) — 00:43 재부팅, 톰캣 자동 시작 없어 약 9시간 중단, 09:47 수동 기동 복구, **기동은 /home/tomcat/bin에서 `sh startup.sh`(start.sh 없음)**, 재부팅 주체=Cafe24 계획 점검(00:00~03:00 순차 재부팅 공지 확인), 자동 시작 설정은 승인 후
