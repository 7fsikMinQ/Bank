---
name: project-prod-reboot-20261106
description: "2026-11-06 00:43 운영 서버(Cafe24 가상서버) 재부팅으로 톰캣 약 9시간 중단 — 톰캣 자동 시작 없음, 올바른 기동법(sh startup.sh), 서버 구조, 재부팅 주체=Cafe24 계획 점검(공지 확인)"
metadata:
  node_type: memory
  type: project
  originSessionId: e486b737-9a74-4c83-aa18-3436793bb5ca
  modified: 2026-11-09T09:26:05.688Z
---

**운영 서버 구조(2026-11-06 서버에서 직접 확인)**: hostname kigte8313, Rocky 8.10(커널 4.18.0-553.5.1), 가상서버(QEMU/KVM, 부팅 로그 BOCHS). 톰캣 8.5.88은 `/home/tomcat`(root 실행, 80/443, webapps/ROOT, 인증서 conf/ssl/pe.kigte.org.pfx). **기동은 `/home/tomcat/bin`에서 `sh startup.sh`**(이력 48회, `start.sh`는 없음). JVM 옵션(-Xms2048m -Xmx3072m)은 `catalina.sh`에 들어 있어 startup.sh로 기동하면 그대로 적용된다(10/27 기동과 동일 확인). 종료는 `sh shutdown.sh`를 써 왔으나 기동 후 8005 포트 리슨이 보이지 않았다(사유 미확인).
- DB는 `mariadb.service`가 enabled라 재부팅 시 자동 시작(23306). **톰캣은 systemd 서비스·crontab 부팅 실행이 없어 재부팅하면 수동으로 올려야 한다.**

**사건**: 2026-11-06 00:43:22 톰캣 정상 종료 로그 → 00:43 서버 reboot → 09:47:52 수동 기동(`Server startup in 7293 ms`, 80/443 리슨 확인)으로 복구, 중단 약 9시간 4분. 브라우저 접속은 사용자가 확인함(11/6, 화면 세부는 미기록).
- **재부팅 주체는 Cafe24 계획 점검으로 판단됨(11/6 사용자가 공지 확인)**. 서버 내부 기록만으로는 미확인이었음: 새 커널 설치 없음(마지막 2024-06-11), dnf-automatic 타이머 없음, /etc/cron*·/var/spool/cron에 reboot 없음, root .bash_history에 reboot 없음, 00:43 SSH 로그인 없음, /var/log/messages에 종료 구간(00:43:20~45) 기록 없음, 이전 부팅 journal 없음. Cafe24 공지 '2026년 11월 6일(금) 리눅스 가상서버 호스팅 일부 서버 점검 안내'(help.cafe24.com/notice/system-notice/20261106_linux-vps-maintenance): 점검 00:00~03:00, 설정 변경 적용을 위한 순차적 서버 재부팅, 점검대상 확인 페이지에 pe.kigte.org ID가 대상으로 표시됨 → 서버 기록(00:43)이 그 시간대 안. Cafe24는 개별 서버의 정확한 작업 시각은 공지하지 않음(직접 확인받은 것은 아님). 공지 게시일·사전 수신 여부는 미확인. Cafe24 공지는 '재부팅 후 서비스 자동 정상화'라 하지만 톰캣 같은 앱 기동은 해당 없음(자동 시작 설정 필요). Cafe24는 정기적으로 점검·보안 업데이트를 하므로 재부팅이 반복될 수 있음.
- 앱 내부 예약 작업은 소스상 매년 1/1 00:03 한 건뿐이라 중단 중 놓친 작업 없음(작업 복사본 기준, 운영 WAR 동일 여부 미확인).
- **소스 전수 검색(2026-11-06, 패턴 기반)**: Java 381개·매퍼 XML 74개·JSP 7개·web.xml·dispatcher-servlet.xml·pom.xml·React src에서 프로세스 실행(Runtime/ProcessBuilder)·System.exit·shutdown/reboot·백업/dump·위험 SQL 없음 → 소스가 재부팅·톰캣 종료·백업을 일으키는 코드는 없음. 예약 작업은 `CommonTaskController`(@Scheduled "0 3 0 1 1 ?", `<task:annotation-driven/>`는 dispatcher-servlet.xml) 1건뿐. 참고: `EgovWebServletContextListener.contextDestroyed`가 `System.setProperty(key, null)`을 호출해 소스상 NPE 가능, 그러나 11/6 00:43 운영 종료 로그에는 흔적 없음(운영 WAR와 소스 일치 여부 미확인, 수정 안 함).
- **운영 DB 백업(서버 cron, 소스 아님)**: root cron `00 02 * * *` → `/root/script/db_backup.sh`. 내용: `mariadb-dump`(-u kigte, 비밀번호 명령줄 평문)로 `kigte` DB를 `/home/db_backup/kigte-backup_YYYYMMDD.sql`에 덤프한 뒤 `find -newermt 어제 ! -newermt 오늘 -exec rm`으로 어제 수정된 파일 삭제 → 최신 1개만 남는 구조, 덤프 성공 확인 없음, `--single-transaction`·`--hex-blob` 안 보임, 같은 서버 디스크. 11/6 02:00:01 실행 기록 확인(`/var/log/cron`), 백업 파일 존재는 사용자 확인. 재부팅(00:43)이 백업(02:00)보다 먼저라 백업이 원인 아님.
- **디스크(11/6 확인)**: `/`는 ext4(LVM centos-root) 144G 중 사용 90G(67%), 여유 47G. `/home`은 별도 파티션이 아니라 루트와 같은 디스크. `/var/lib/mysql` 40G, `/home/db_backup` 40G(단일 파일 kigte-backup_20261106.sql, 02:09:33 `Dump completed`), `/home/tomcat` 2.1G, `/home/temp` 462M, `/var/log` 64M. 백업은 새 덤프를 쓴 뒤 어제 파일을 지우는 구조라 02시 직후 두 파일(약 80G)이 공존하고, 현재 여유로 보면 다음 피크에 약 7G가 남는다는 단순 계산(증가 속도는 기록이 없어 미확인). 개선안 초안(성공 시에만 삭제·7일 보관·옵션 파일로 비밀번호 분리·`--single-transaction --hex-blob`·압축·외부 복사)은 이사님 승인 후, 미시험, 중단 보고 메일과는 별도 안건으로 분리하기로 함.
- 인수인계 `26년11월_인수인계/26년11월_11_운영유지보수지침서`(.md 67행, .html 135행)에 "재부팅 후 startup.sh 직접 실행"이 이미 기재되어 있음(알려진 한계였음).
- 이사님 보고 메일 최종 구성(발송 여부는 사용자 몫, 미확인): 요약·Cafe24 점검 공지 확인·시각표·톰캣 로그 8줄·확인한 내용·요청(톰캣 자동 시작 승인, 점검 공지 확인 체계). 공지의 게시일과 사전 수신 여부는 미확인.
- /var/log/secure에 20초 간격 `kex_exchange_identification: Connection closed` 반복(출처 IP 미확인, 점검 도구일 수 있음). catalina.out의 `/.aws/config`·`/manager/html` 404는 인터넷 탐색 봇.

**남은 일**: 이사님 보고(메일 초안 재작성함, 원인=Cafe24 점검), 공지 사전 수신 여부·관리자 연락처 확인, 톰캣 자동 시작(systemd) 설정은 승인 후에만(초안만 제시, 미시험). 02:00 백업은 사용자가 백업 파일 존재를 확인함(파일 날짜·크기 세부는 미기록, 스크립트 내용엔 비밀번호가 있을 수 있어 붙여넣지 않음).

**Why:** 재부팅 후 톰캣이 자동으로 안 올라와 서비스가 장시간 중단됨. **How to apply:** 운영 톰캣 기동·점검 안내는 `sh startup.sh`(/home/tomcat/bin) 기준으로 하고, 서버 설정 변경(자동 시작 등)은 이사님 승인 전에 권하지 않는다. 연관: [[project-home-remote-access]]
