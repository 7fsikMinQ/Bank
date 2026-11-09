# 2026-05-19 현장평가 심사 점검표 버그 상세 분석

> **화면**: 현장평가 상세정보 > 심사 점검표 탭 (`EvlInspctChkDtl.tsx`)
> **계정**: 검사실 계정
> **증상 1**: 문항 순서 뒤죽박죽 (1.9.1 다음에 1.4.1 출력)
> **증상 2**: 일부 문항 섹션 전체 미표출

---

## 버그 1 — 문항 순서 뒤죽박죽

### 파일
`src/main/java/kr/co/kigte/spt/evl/sql/Evl.xml`

### 문제 코드 (수정 전, 727행)

```sql
ORDER BY MCLAS_ID, SCLAS_ID, LVL_PATH
```

### 수정 코드

```sql
ORDER BY LVL_PATH
```

---

### 원인 상세

#### 쿼리 구조 이해

`selectQesChkList`는 재귀 CTE(WITH RECURSIVE)로 문항 계층을 조회한다.

```sql
WITH RECURSIVE QES_TREE AS (
    -- Anchor: DEPTH=1 인 루트 문항
    SELECT
        SPT_QES_ID, DEPTH,
        CAST(LPAD(ORDR, 3, '0') AS CHAR(100)) AS LVL_PATH,
        ...
    FROM TN_SPT_QES
    WHERE DEPTH = 1 AND USE_AT = 'Y' AND LCLAS_ID = #{lclasId} ...

    UNION ALL

    -- Recursive: 자식 문항을 부모와 JOIN
    SELECT
        C.SPT_QES_ID, P.DEPTH + 1,
        CONCAT(P.LVL_PATH, '.', LPAD(C.ORDR, 3, '0')),  -- 경로 누적
        ...
    FROM TN_SPT_QES C
    JOIN QES_TREE P ON C.UPPER_SPT_QES_ID = P.SPT_QES_ID
    ...
)
```

`LVL_PATH` 생성 규칙:

| DEPTH | LVL_PATH 예시 | 의미 |
|-------|--------------|------|
| 1 | `001` | 1번째 대분류 문항 |
| 2 | `001.003` | 1번째 대분류의 3번째 중분류 문항 |
| 3 | `001.003.002` | 1>3>2 경로의 세부문항 |

즉, `LVL_PATH`를 문자열 정렬하면 계층 순서가 정확히 보장된다.

#### 왜 `MCLAS_ID, SCLAS_ID`로 정렬하면 망가지는가

`MCLAS_ID`, `SCLAS_ID`는 분류 테이블(`TN_SPT_CL`)의 PK 값(예: `'CL001'`, `'CL004'`)이다.
이 값은 **화면에 보이는 순서(ORDR)와 무관한 DB 식별자**이다.

예를 들어:

```
ORDR 기준 올바른 순서:
  001 (1번째 루트문항) → MCLAS_ID = CL001
    001.009 (1.9 중분류) → 이전평가비교
      001.009.001 (1.9.1) → 지난번 심사에서 지적된 사항 개선 여부
  002 (2번째 루트문항) → MCLAS_ID = CL002
    ...

MCLAS_ID, SCLAS_ID, LVL_PATH 기준 실제 정렬:
  → MCLAS_ID='CL001' 인 항목들이 먼저 묶임
  → MCLAS_ID='CL004' 인 항목들이 다음에 묶임
  → LVL_PATH는 같은 MCLAS_ID 내에서만 정렬됨
  → 결과: 1.9.1 다음에 1.4.1 등장 (1.4의 MCLAS_ID가 더 작거나 크면 순서 역전)
```

#### 심사원 화면(`selectQesList`)과 비교

심사원 화면(Evl.xml 445행)은 올바르게 작성되어 있다:

```sql
ORDER BY LCLAS_ID, LVL_PATH   -- ← 올바름
```

`LCLAS_ID`는 대분류 구분자(하나의 심사표 내에서는 동일)이고, `LVL_PATH`만으로 전체 계층 순서가 결정되므로 문제가 없었다. 검사실 전용 쿼리(`selectQesChkList`)를 작성할 때 잘못된 컬럼으로 ORDER BY를 작성한 것이 원인.

---

## 버그 2 — 마지막 섹션 전체 미표출

### 파일
`src/main/webapp/src/pages/spt/evl/EvlInspctChkDtl.tsx`

### 문제 코드 (수정 전, 338~341행)

```tsx
                                        sclasGroup.push(node);
                                    });       // ← forEach 종료

                                    return groupedItems;   // ← 마지막 그룹이 빠진 채 반환
```

### 수정 코드

```tsx
                                        sclasGroup.push(node);
                                    });

                                    // 루프 종료 후 마지막 그룹 flush
                                    pushSclasGroup();
                                    pushMclasGroup();

                                    return groupedItems;
```

---

### 원인 상세

#### 렌더링 로직 구조

문항 목록을 화면에 출력하기 위해 3단계 그룹핑을 사용한다:

```
groupedItems  (최종 출력 배열)
  └── mclasGroup  (중분류 헤더 + 하위 소분류들)
        └── sclasGroup  (소분류 헤더 + 하위 문항들)
              └── node  (개별 문항)
```

각 flush 함수의 역할:

```tsx
const pushSclasGroup = () => {
    // sclasGroup → mclasGroup으로 이동 (소분류 헤더 붙여서)
    if (sclasGroup.length > 0) {
        mclasGroup.push(<>{소분류헤더}{sclasGroup}</>);
        sclasGroup = [];
    }
};

const pushMclasGroup = () => {
    // mclasGroup → groupedItems로 이동 (중분류 헤더 붙여서)
    if (mclasGroup.length > 0) {
        groupedItems.push(<>{중분류헤더}{mclasGroup}</>);
        mclasGroup = [];
    }
};
```

#### forEach 루프에서 flush 타이밍

```tsx
data.forEach((item: any) => {
    ...
    if (item.mclasNm !== currentMclasNm) {
        pushSclasGroup();   // 이전 소분류 → mclasGroup
        pushMclasGroup();   // 이전 중분류 → groupedItems ← 여기서만 호출됨
        currentMclasNm = item.mclasNm;
    }
    if (item.sclasNm !== currentSclasNm) {
        pushSclasGroup();   // 이전 소분류 → mclasGroup
        currentSclasNm = item.sclasNm;
    }
    sclasGroup.push(node);
});
// 루프 종료
```

`pushMclasGroup()`은 **"새로운 중분류를 만났을 때"만** 호출된다. 즉:

```
데이터 순서 예시:
  [검사 수행 및 장비운용] ← 중분류 A
    [수질 관리 및 유리용기] ← 소분류 A1
      1.4.1 문항
      ...
  [이전평가비교] ← 중분류 B  ← 이 시점에 중분류 A가 groupedItems에 push됨
    1.9.1 문항
    ...
  ← forEach 종료  ← 중분류 B는 아무도 push해주지 않음!
```

마지막 중분류("이전평가비교" 또는 어떤 섹션이든)는 그 뒤에 새로운 중분류가 오지 않으므로 `pushMclasGroup()`이 한 번도 호출되지 않는다. 결과적으로 `mclasGroup` 배열에는 데이터가 있지만 `groupedItems`에는 포함되지 않은 채로 `return groupedItems`가 실행된다.

#### 실제 화면 영향

버그 1(ORDER BY)로 인해 순서가 `1.9.1 → 1.4.1`로 나왔는데, 이는 `이전평가비교`(1.9) 섹션이 마지막 중분류가 아니라 잘못된 위치에 끼어있었기 때문이다. 버그 2(flush 누락)로 인해 실제 마지막 중분류 섹션 전체가 화면에서 사라졌다.

두 버그가 동시에 발생하여 "순서 이상 + 일부 섹션 미표출"이 복합적으로 나타났다.

---

## 수정 요약

| 구분 | 파일 | 위치 | 수정 내용 |
|------|------|------|----------|
| 버그 1 | `spt/evl/sql/Evl.xml` | 727행 | `ORDER BY MCLAS_ID, SCLAS_ID, LVL_PATH` → `ORDER BY LVL_PATH` |
| 버그 2 | `spt/evl/EvlInspctChkDtl.tsx` | 339행 (forEach 종료 직후) | `pushSclasGroup(); pushMclasGroup();` 2줄 추가 |

---

## 참고 — 심사원 화면과의 쿼리 비교

| 구분 | 쿼리ID | 사용 화면 | ORDER BY |
|------|--------|----------|----------|
| 심사원 | `selectQesList` | `EvlDtl.tsx` | `ORDER BY LCLAS_ID, LVL_PATH` ✅ |
| 검사실 | `selectQesChkList` | `EvlInspctChkDtl.tsx` | `ORDER BY MCLAS_ID, SCLAS_ID, LVL_PATH` ❌ → `ORDER BY LVL_PATH` ✅ |
