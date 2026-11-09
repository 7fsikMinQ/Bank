---
name: project-email-fail-handling
description: 메일 발송 실패 처리 수정(15개 파일)의 내용·해결 방식·분석 결과·백업/롤백 상태·재적용 방법·남은 이슈(2026-10-19~20)
metadata:
  node_type: memory
  type: project
  originSessionId: e486b737-9a74-4c83-aa18-3436793bb5ca
  modified: 2026-10-20T00:19:10.251Z
---

## 한 줄 상태 (2026-10-20)
**최신: 롤백 후 Email.java 한 파일에만 '로그 보강'을 다시 넣음(동작·반환값은 원본과 같음). 사용자가 "메일 에러 원인은 로그에 남기는 건 그대로 작업"을 요청.** 로그 내용: 수신자/발신 계정 거절 구분, 무효 주소, 서버 응답(550 5.1.1 등, 줄바꿈 제거), 접속 실패 원인(getNextException). 백업 폴더 `로그만_적용분\`·`로그만_적용.bat`·`Email.java.diff.txt` 참고. `원본_복원.bat`을 실행하면 이 로그 보강도 사라짐.

다른 세션이 만든 "메일 실패 처리 수정 15개 파일"을 사용자가 직접 시험하려고 **SVN 원본(수정 전)으로 롤백**함. 수정본은 백업돼 있어 언제든 다시 적용 가능.
- 백업 폴더: `C:\Users\USER\Downloads\KIGTE_메일수정본백업_261020\` (`수정본\`, `원본\`, `diff\`, `manifest.txt`, `수정본_적용.bat`, `원본_복원.bat`)
- 원본 출처: `C:\svn\dna\.svn\wc.db` + `.svn\pristine`(svn.exe 없음, sqlite로 BASE 조회). 작업본 루트가 `C:\svn\dna` 상위에 있음.
- 롤백 대상은 메일 관련 15개 파일만. 같은 시기 다른 로컬 변경 6개(App.tsx, package-lock.json, index.jsp, EgovWebServletContextListener.java, sql-mapper-config.xml, log4j2.xml)는 건드리지 않음.

## 수정 내용(롤백된 것) — 파일별
백엔드(8): Email.java(발송 실패 사유 failMsg·rejectReason 5종 변환·failSummary/failLines·SMTP 서버응답 로그·sender 거절 구분), CommonServiceImpl.java(sendEmail/sendEmailbyEmail/edmSendEmail/hnfTrgtSendEmail: 거절·주소없음·한도초과·연결실패면 이력(TH_EMAIL_TRNSMIS) 저장 안 하고 null 반환, 주소 없으면 예전 "send" 오판 제거), ThEmailTrnsmisVO(failMsg 필드, DB 미저장), UserController(검사실/심사원 등록·재발송 응답에 failMsg), CeController(현황조사 요청 메일 실패 목록→failMsg), EdmTrgtController·EdmTermController(외부정도관리 안내 실패 목록), SchdulController(일정 안내 3개 엔드포인트가 실패 목록 반환).
화면(7): InspctModal·JudgModal(사용자 등록·재발송 실패 알림), Mngr.tsx(현황조사 요청), EdmTrgtModal·EdmPtmEmailModal·EvlEmailModal(+AlertModal 추가)·spt/schdul/Index.tsx(일정 안내).

## 해결하려던 문제(수정 전 동작, 로컬 재현으로 확인)
메일 서버가 수신 주소를 거절(550 5.1.1 등)·형식오류·주소없음이어도 `Email.sendEmail`이 true → 서비스가 이력 저장 + "send" 반환 → 화면 "전송되었습니다"(Snackbar 3초) + 계정 재발송이면 **비밀번호가 바뀜**. 거절 경고 로그 `recipient rejected by SMTP server ... Invalid Addresses`는 수정 전부터 있었음. 일일 건수(selectEmailCnt=이력 행 수)에도 거절 건이 포함됨.
재현 방법: scratchpad `h/`에 SVN 원본 Email.java와 수정본 Email.java를 javac로 컴파일, 가짜 SMTP(127.0.0.1:25, 주소 앞글자 bad/full/spam/temp로 550/552/550 5.7.1/451 응답)로 실행 → 수정 전은 전부 성공·이력 저장, 수정본은 사유 안내·저장 안 함.

## 수정본에 남아 있던 이슈(A~E 안, 사용자 허락 전 수정 금지)
- `JudgModal.tsx` 310·372행: `smsButton ? A : true && emailButton ? B : true` 연산자 우선순위 → 문자 성공 시 메일 실패가 성공 처리됨(기본값 둘 다 체크). 수정 전부터 있던 버그. 해결안: `(!smsButton||smsOk) && (!emailButton||emailOk)`.
- 일부 실패 후 모달이 열려 있어 재전송하면 중복 발송(CeController는 reqstSubmit 알림도 중복). 단순안: 알림 `확인`(callback)에서 모달 닫기 + 성공/실패 건수 표시. "실패 대상만 재전송"은 외부정도관리 주소가 인력(hnfmail) 데이터라 관리자가 못 고치고 모달 주소가 낡아 비권장.
- `hnfTrgtSendEmail`은 받는 주소 없는 대상을 실패로 안 잡고 건너뜀. 엑셀 일괄등록(inspctUpload/judgUpload) 메일 실패는 안내 없음(successCnt/failCnt만).
- 실패 건은 이력 화면에 안 남음(문자 SMS도 실패 미저장이라 일관). DB 컬럼 추가(안 D)는 고객 요구 시. 계정 안내 메일 본문(임시 비밀번호 평문)이 TH_EMAIL_TRNSMIS.EMAIL_CN에 저장됨(기존 문제).
- Email.java에 SMTP 접속/응답 timeout 없음. 짧게 두면 전달 후 오판→다음 계정 재발송(중복) 위험, 연결 timeout만 안전.
- 서버가 받은 뒤 나중에 반송하는 경우는 감지 불가. 개발 DB에는 실제 검사실 주소(003E 등)가 있어 시험 시 실제 메일이 나갈 수 있음(본인 주소만 쓸 것).

## 사용자 결정·이력
- 사용자 요구: 911E로 모든 메일 흐름·모든 조건을 수정 전 코드에서 시험해 이슈를 재현한 뒤 판단. 그래서 롤백 요청(2026-10-20).
- 제안한 안: A(①②④ 최소 수정, 추천) / B(안내 단순화) / C(전체 롤백) / D(이력 컬럼 DDL) / E(평문 비밀번호 저장 개선). 사용자는 시험 후 결정 예정. 이메일 초안(고객사용·이사님용)은 "운영 로그"라는 표현 없이 작성(이번 로그는 개발 시험 중 것, 운영 빈도 미확인).
- 운영 빈도 확인법: 운영 서버 `/home/tomcat/logs/catalina.out`에서 `recipient rejected` 건수 검색.

## 다시 적용/되돌리기
수정본 재적용: 백업 폴더 `수정본_적용.bat` 실행(또는 수정본\ 폴더를 `C:\svn\dna\work\kigte`에 덮어쓰기). 원본 복원: `원본_복원.bat`. 적용 후 IntelliJ 재빌드, 화면은 `npm run build`.

## 관련
- [[project-handover-rewrite]] 인수인계 문서 재작성(같은 시기 작업)

## 메일 발송 흐름 전체 목록(원본 코드 기준, 시험용 · 2026-10-20 조사)
수정 전 코드에서 911E로 시험할 대상(모두 `CommonServiceImpl.sendEmail/sendEmailbyEmail/edmSendEmail/hnfTrgtSendEmail` → `Email.sendEmail` 경유):
검사실 가입/재발송 UserController.insertInspct·sendInspctInfo(수신 TN_INSPCT.EMAIL, AES), 심사원 insertJudg·sendJudgInfo(문자 병행), 엑셀 일괄 inspctUpload·judgUpload, 현황조사 요청 CeController.sendEmail(+reqstSubmit 내부 알림), 외부정도관리 안내 EdmTrgtController.sendEmail(011)·결과 통보 EdmTermController.sendEmail, 현장평가 일정 조사 saveInspctEvlym/List(004 자동 메일+문자)·시행 안내 sptEvlStartSendEmail(003)·월 재발송·일정 확정 안내(EvlEmailModal), 심사원 배정 안내 saveSptJudg(팀장/팀원), 배정 거부·일정 변경 알림(수신 admin), 심사소감문 작성 안내 EvlController 최종제출(006), 현장평가 결과 통보 SptTermController.updateResult(007), 이의신청 상태 메일 EdmObjc(014)·SptObjc(008).
- 인력(TN_HNF) 이메일 기반 흐름(hnf): 수신자는 `selectHnfTrgtMailList`(TN_HNF.EMAIL, HNF_SE_CD 001~004, CSTS_ID 기준). 이메일은 AES 암호화라 SQL로 직접 못 바꾸고 현황조사 인력현황 화면에서 바꿔야 함.
- 소스상 의심(시험으로 확인 필요): EvlController `emailList.forEach(v -> sptJdgmnCompSendMail(vo))`가 목록 크기만큼 같은 주소로 반복 발송(중복 가능), EdmObjc/SptObjc는 `setCstsId(objcPdId)`로 수신자를 조회해 ID가 csts와 일치하지 않으면 수신자가 비어 아무도 못 받을 수 있음.
- 롤백 후 확인: target/classes의 수정본 컴파일 클래스 8개(failMsg 포함)는 삭제함(재빌드 필요). React build 폴더는 원래부터 수정본 메시지를 포함하지 않음.

## 운영 DB·로그 분석 결과 (2026-10-20, 사용자가 운영 DB에서 직접 조회)
- 운영 DB(kigte8313.cafe24.com, 이력 2,468건 2025-01-07~2026-10-19, 수신자 958곳). 이력 유형: 001 계정 1,122, 002 현황조사 요청 225, 003·004·005·007·013·014 인력 이메일 기반 1,121. 911E는 운영 DB에 없음(개발 DB 전용).
- 거절 로그(`recipient rejected`)는 3건(038E 2026-07-08 외 003E 2026-10-19 2건)이고 거절된 주소가 이력에 "보냄"으로 저장됨을 확인. 비율 약 0.27%(10/19 일괄 178통 중 2건).
- 거절 주소는 다른 날엔 정상 수신(038E는 6/15·8/3·10/19, 003E dowgene@daum.net은 3/30~8/28 5회) → 영구 불량 주소가 아니라 일시 거절 또는 사서함 문제. 서버 응답은 보강 로그를 운영에 넣어야 확인 가능.
- 한도 400 초과는 2026-04-30(432건) 하루뿐, 계정 3개 사용(403/27/2).
- 운영 로그 grep: `sendEmail success` 0(INFO 미출력), `sendEmail failed` **104건**(접속·인증 실패, 다음 계정 재시도 경로), `mail counter exceeded` 0, `skipped` 1. 6/18 14:15~6/22 15:05 사이 첫 계정(hFRRU...)이 한 건도 안 쓰이고 세 번째 계정(NBIE...)으로 36통 발송된 것으로 보아 그 기간 첫·둘째 계정 장애 추정. 104건의 날짜·메시지는 사용자에게 grep으로 요청 중.
- 재전송 중복은 흔함: 6/15 004 일정 조사 안내가 약 19개 검사실에 6분 간격 2회, 005 배정 안내가 같은 심사원에게 같은 날 2~4회. 실패 재시도가 아니라 운영자 재저장 때문. 같은 주소·제목 20회(5/4)는 공통/내부 주소 추정.
- 암호화는 고정 키·고정 IV(`Aes.java`)라 같은 주소=같은 암호문(SQL로 중복 집계 가능, 보안상 약점).
- 014 이의신청 메일 29건은 SENR_ID(발신자)가 공란. 008·006 유형은 운영에서 발송 이력 0건.

## 최종 분석 (2026-10-20, 운영 로그 확보 후)
- 운영 catalina.out은 2025-05-07부터 있음(약 17개월). `recipient rejected` 3건, `skipped` 1건(2026-04-30 lab215, 한 칸에 주소 2개 `a@x,b@y`라 형식 오류인데 BASE는 성공 처리), `sendEmail failed` 104건(2026-06-18 4, 06-19 88, 06-22 12), `all accounts failed` 10건, `mail counter exceeded` 0건, 모든 로그에 `timeout -1`(접속 시간 제한 없음).
- 발송 계정 암호문 대조: hFRRU=kigtepe@kigte.org(1번), 9pii=kigtepe1(4/30 문서가 "존재하지 않는 계정"이라 한 옛 2번, 4/30에 27통), zSjw=kigtepe2, NBIE=kigtepe3.
- 6/18~6/22: kigtepe·kigtepe2 `535 authentication failed`(약 4일), kigtepe3으로 36통 발송(계정 전환 작동). 접속 불가(`Couldn't connect smtp.cafe24.com:25`)는 3계정 동시 7회. 3계정 모두 실패 10회는 메일 미발송·이력 없음·판사/관리자 알림 흐름은 결과 무시라 화면 알림도 없음.
- **핵심 위험(BASE=운영 코드)**: `CommonServiceImpl.hnfTrgtSendEmail`(운영 일괄 메일 1,121통 경로: 003·004·005·007·013·014)은 `Email.sendEmail` 반환값을 무시하고, 계정 전환(fallback) 없이 건수로 고른 한 계정만 쓰며, 이력은 무조건 저장함. SMTP 계정 장애가 일괄 발송 중에 나면 전부 미발송인데 이력은 "보냄". 6/18~6/22 장애 때 일괄 발송이 없어 실제 발생은 안 했음(근접 사례).
- 수정 제안 최종: 백업본(이력 제외·화면 알림) + hnfTrgtSendEmail에 fallback 적용(4곳 중복된 계정 순환 코드를 하나로 합치기) + 접속 timeout 신중히 + 3계정 실패 시 "메일 서버 오류" 문구 + 로그 보강 운영 반영 + 운영 모니터링(grep). 사용자 허락 전 수정 금지.

## 현재 상태 기준 재분석 (2026-10-20, 사용자: 8~9월 이전 이슈는 해결된 것으로 봄)
- `all accounts failed` 10건은 모두 2026-06-19 10:54~12:38(path083, lab180, path193 4회, lab004 3회, lab295). path083·path193·lab004는 이후 재저장으로 도착, **lab295와 lab180은 이후 성공 이력이 없음**(미도착 가능). 6/19 한 시간 반 동안 운영자가 같은 배정을 여러 번 저장함.
- 4/30 kigtepe1(존재하지 않던 옛 2번) 27통: path051~059(10:06~10:08 가입 안내 9명), gene001 3통, 999E, lab351 약 12통(재전송 반복), lab352, lab264. 실제 미도착 가능성 높음. lab351은 같은 안내가 하루 12번 반복(운영자 재전송 추정). 18:36 이후 kigtepe2로 수정 배포.
- lab215(심사원)는 4/30 `a@x,b@y` 한 칸 2주소로 안내 메일이 건너뛰어짐(이력은 보냄). 현재도 계정 이메일 암호문 길이 64 이상은 **심사원 lab215, 검사실 416E 두 건뿐**(416E는 화면 확인 필요).
- 현재 구간(2026-08~10): 메일 444통(001 11, 004 6, 005 76, 013 144, 014 29, 007 178), SMTP 실패 0건, 거절 2건(10/19 003E), 한도 근접 없음(최대 177/일), 모두 1번 계정 kigtepe로 발송. 6/22 15:05 이후 4개월 안정.
- 014 이의신청 메일 29건 SENR_ID 공란 원인: `EdmObjcController.updateOjbc`(updateObjc.do)의 로그인 사용자 조회 블록(`SecurityContextHolder`, auth==null이면 AccessDeniedException)이 주석 처리되어 `userId=""`. 그래서 TN_EDM_OBJC UPDT_ID·알림 발신자도 공란. URL 보안 설정에서 이 경로가 보호되는지는 미확인(사용자 요청으로 확인 중단).
- 구조 위험(hnfTrgtSendEmail 결과 무시·fallback 없음)은 현재도 남음. 사고는 4/30(옛 2번 계정 설정 오류)과 6/18~22(계정 인증 실패)로 6개월에 2번. Cafe24 호스팅 만료 2026-11-07, 인증서 2026-12-23 갱신 시 SMTP 계정 점검 필요.

## 2026-10-20 후속 확정 (운영 DB·SVN 메타 대조)
- 4/30 kigtepe1 27통 중 이후 메일 없던 9명(path051,053~059,lab264): 같은 시각(4/30 10:05~10:06) **문자(TH_SMS_TRNSMIS 001)는 전원 발송됨** → 계정 정보는 문자로 받음. PW_CHG_AT: path059만 Y(5/6), 나머지 N(아직 로그인·비번변경 안 함) → 메일 미수신 문제 아님, 조치 불필요(선택).
- lab180/lab295 6/19 실패 건: 이후 문자 기록 없음(6/19 이후 SMS 0건). 메일 1통 유실, 영향 경미.
- SVN 메타(wc.db): CommonServiceImpl·Email.java 마지막 커밋 rev985 = 2026-06-22 13:24, UserController rev951 = 2026-05-04, EdmObjcController rev861 = 2025-12-17. 계정 사고(4/30, 6/18~22)는 6/22 이후 SMTP 실패 0 → "8~9월"이 아니라 6월 하순에 종료. 8~9월엔 메일 코드 변경 없음.
- lab215: 한 칸 2주소 → Email.java `new InternetAddress(addr).validate()`가 AddressException(여러 주소) → "skipped: invalid recipient email format" 로그 + true 반환(이력엔 '보냄'). catalina.out `grep -c skipped`=1이 이 건으로 추정(줄 확인 필요).
- EdmObjcController.insertObjc/updateObjc 둘 다 userId="" (principal 조회 주석) → 014 메일 SENR_ID 공란 29건, TN_EDM_OBJC·첨부 REGIST_ID/UPDT_ID 공란. dvl/spt 쪽은 정상 조회.
- hnfTrgtSendEmail 호출처 6곳(SchdulController 511/548/588, SptTermController 236, SptObjcController 314, EdmObjcController 315).
- 보안: /api/** isAuthenticated()만, 역할 제한 없음(별건). 일 1200통 이상이면 모든 흐름이 조용히 미발송(일 최대 432라 현재 무관).
- 최종 판단: 필수 코드 수정 없음. 하면 좋음 A(로그)·C(이의신청 ID)·B(일괄메일 결과확인/전환). D(역할제한)는 별건 과제.

## 정정 (2026-10-20): 암호문 길이 64 ≠ 주소 2개
- 416E 실제 이메일은 단일 주소 32자(사용자 확인) → AES/CBC/PKCS5는 32바이트 입력에 패딩 블록 16바이트가 더해져 48바이트 → Base64 64자. 즉 길이 64 = 평문 32~47자. 길이만으로 "주소 2개" 판정 불가.
- 따라서 lab215도 단일 긴 주소일 수 있음(주소 2개라는 이전 추정은 길이 기준일 뿐 미확정). 확인 방법: 화면에서 lab215 이메일 확인 / catalina.out `grep skipped` 줄의 rcverId 확인.
- 416E는 조치 불필요. "lab215·416E 데이터 정리" 필수 조치 항목은 lab215 확인 결과에 따라 결정.

## 2026-10-20 비밀번호 재발송 "메일 안 왔다" 분석 (소스 확인)
- 흐름 3종: (1) 관리자 재발송 UserController.sendInspctInfo/sendJudgInfo = 메일 먼저 → 성공(non-null)이면 그때 DB 비번 변경(PW_CHG_AT=N). 수신거절·형식오류도 true라 "성공" → 비번만 바뀌고 메일 미도착 가능(운영 001 거절 로그는 없음). (2) 로그인화면 비밀번호 찾기 LoginController.selectUserPw = 메일 없음, DB 비번 변경 후 화면에 임시비번 표시. (3) 관리자 초기화 mngrResetPw = 메일 없음, 설정값(user.reset.passwd)으로 초기화.
- InspctModal은 3계정 모두 실패(null) 시 "당일 이메일 전송 제한량을 초과" 문구만 표시(오해 소지). 재발송은 계정 이메일(TN_INSPCT/TN_JUDG.EMAIL)로 가고, 일괄 통보는 인력 이메일(TN_HNF)로 감 → 둘이 다를 수 있음.
- 재발송 반복 시 직전 메일 비번은 무효(lab351 4/30 12회 재발송 사례). 이력 EMAIL_CN에 임시비번 평문 저장됨(보안 참고).

## 2026-10-20 주석 정리 (6·7·Email.java)
- 6·7 파일(BfdocRslt*·TnDocRsltVO·BfdocRslt.xml·BfdocRslt*.tsx)의 PDF 쪽수 표기(8쪽·9페이지·11쪽 등) 삭제, Email.java 로그 보강 주석의 "[로그만 보강]" 공정 표기를 한 줄 설명으로 정리. 주석만 변경(코드 8/8 동일 자동 확인, 줄바꿈 유지). 백업: scratchpad/cmt_bak(수정 전), Downloads KIGTE_메일수정본백업_261020/로그만_적용분의 Email.java·diff 갱신.
