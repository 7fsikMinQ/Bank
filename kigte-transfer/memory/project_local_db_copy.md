---
name: project-local-db-copy
description: "개발 DB 전체를 내 Windows 로컬 MariaDB 10.11.19로 복제한 상태(2026-10-28 백업, 검증 완료)와 남은 대상(WSL·Docker·리눅스)"
metadata:
  node_type: memory
  type: project
  originSessionId: e486b737-9a74-4c83-aa18-3436793bb5ca
  modified: 2026-11-09T09:25:52.763Z
---

개발 DB(211.169.38.6:8182, 스키마 kigte)를 2026-10-28 17:59 시점으로 mariadb-dump(`--single-transaction --hex-blob --skip-add-drop-table`) 해서 로컬 Windows MariaDB 10.11.19(127.0.0.1:3306)에 복원했다.

- 백업 파일: `C:\kigte_backup\kigte_dev_20261028.sql`(729MB), 계정 스크립트 `C:\kigte_backup\01_user.sql`(kigte@%, 개발과 동일 비밀번호는 해시로 복제, 평문·해시는 메모리에 저장하지 않음)
- 로컬 my.ini: latin1 서버 기본값, 개발과 같은 sql_mode, max_allowed_packet=1G, lower_case_table_names=2(Windows라 표 이름이 소문자로 보임), bind-address=127.0.0.1
- 검증 완료(개발=로컬 일치): 표 184 / 칼럼 3356 / 칼럼설명 3236 / 인덱스 157 / 외래키 1 / 루틴 5 / ZZ표 38 / 주요 7개 표 행수 / latin1 표 4개(TN_DOC_EVL·TN_OBJC·TN_OBJC_PD·TS_SEQUENCES) CHECKSUM TABLE 동일(TN_DOC_EVL은 0행이라 0)
- DBeaver 연결명 `LOCAL-복사본(3306)`, 개발 연결과 구분하려고 연결 유형·색 다르게 설정 권장
- 앱을 로컬 DB로 붙이려면 `local.properties`의 dataSource.url을 로컬 사본에서만 바꾼다(커밋 금지)

- 2026-10-29 추가 복원·검증: WSL 직접 설치(MariaDB 10.11.19 Ubuntu 24.04, 포트 3308, 구조 일치, 체크섬 미확인) / WSL Docker(`~/kigte-docker`, mariadb:10.11.19, 포트 3307, init 폴더 자동 적재, 구조+체크섬 4개 일치)
- 포트 정리: Windows 3306 / WSL Docker 3307 / WSL 직접 3308 / 개발 8182 / 운영 23306, `local.properties` 주석에 주소 목록 추가(2026-10-29, url 값은 개발 주소 유지)

- **집 데스크탑(Windows 11 Home, 호스트 home, 사용자 7fsik) 복원 완료(2026-11-02 이전, 정확한 날짜 미기록)**: 사용자가 Windows(3306)·WSL 직접(3308) 복제는 하지 않기로 하고 **WSL Ubuntu-24.04의 Docker Engine(공식 apt 저장소, Docker Desktop은 완전 삭제)에 `~/kigte-docker`(mariadb:10.11.19, 127.0.0.1:3307, init 폴더 자동 적재, named volume `kigte-docker_kigte_data`)로만** 복원. 표 184·행수·CHECKSUM 일치, Windows에서 127.0.0.1:3307 연결 확인, 백업 SHA-256이 노트북과 동일. 자동 시작은 `docker update --restart always kigte-mariadb` 권장 + 로그인 시 WSL 유지 작업(schtasks)이며 실제 적용·재부팅 시험 여부는 미확인. DBeaver 연결은 MariaDB 127.0.0.1:3307/DB kigte/계정 kigte(비밀번호는 사용자가 직접 입력), 연결명 `DOCKER-복사본(3307)`, 다른 색 연결 유형. 남은 정리: `C:\kigte_backup`·메일 사본 삭제(실제 개발 데이터), `docker compose down -v`는 데이터 삭제이므로 금지.

**Why:** 개발 서버에는 1도 영향이 없어야 해서 읽기 전용 덤프만 사용. 개발에서 `SEQ_NEXTVAL_ID` 호출 금지(시퀀스 증가).
**How to apply:** 개발과 비교할 때는 개수 조회·CHECKSUM TABLE(작은 표)만 개발에 실행. 남은 대상은 자체 리눅스 서버 직접 설치와 리눅스 Docker 자동 적재(WSL 때 쓴 절차와 같은 파일 사용, 사용자가 요청할 때 진행). 연관: [[project-spt-trgt-resn-fix]]
