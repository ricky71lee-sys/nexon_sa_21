# 서든어택 21주년 이벤트 페이지

퍼블리싱 + Vue 3 프로토타입. 서버 연동 시 **넥슨 SA 플랫폼팀**이 `event.js`의 get/post 만 연결하면 되도록 구성했습니다.

| 항목 | 내용 |
|------|------|
| 이벤트 기간 | **2026.08.06(목) 점검 후 ~ 08.27(목) 점검 전** (21일) |
| 보상 수령 마감 | **2026.09.03(목) 정기점검 전** |
| 기획 기준 | 이벤트페이지 기획안 **v3.3** / 마케팅 기획안 v1.9 정합 |
| 산출물 | `index.html` · `assets/scripts/*` · `assets/styles/style.css` · `assets/data/*.json` |

---

## 로컬 실행

```bash
npm install
npm run scss          # SCSS → style.css 1회
npm run dev           # SCSS watch
```

`file://` 로는 mock fetch가 막힐 수 있으니 **로컬 HTTP 서버**로 여세요.

```bash
npx serve .
```

스크립트 로드 순서 (변경 금지):

1. jQuery 3.x  
2. Vue 3 global (`vue.global.prod`)  
3. `assets/scripts/utils.js`  
4. `assets/scripts/control.js`  
5. `assets/scripts/event.js` ← 마지막 (`#app` mount)

`utils.js` / `control.js` 는 20주년 공용 원본 — **수정 없이 사용**.

---

## 개발자가 알아야 할 구조

### 데이터 흐름

```
① 액션(클릭·로드) → ② get/post 수신 → ③ reactive 상태 세팅 → ④ 자동 렌더
```

### 파일 역할

| 파일 | 역할 |
|------|------|
| `assets/scripts/event.js` | Vue 앱 · 상태 · API stub · 클릭 핸들러 |
| `assets/scripts/utils.js` | `Utils.alert` / `confirm` / `bodyScroll` |
| `assets/scripts/control.js` | `data-scroll-active` 네비 · `pageScroll` |
| `assets/data/*.json` | API 응답 계약 mock (`rtnCode` / `message` / `result`) |

### 섹션

| id | 이벤트 |
|----|--------|
| `#event01` | 메달 합체 (phase 1~4) |
| `#event02` | 21일 듀오 출석 |
| `#event03` | 21주년 쇼케이스 (정적) |

### 상태 요약

- **`user`** — `login` · `character` · `penalty`
- **`medal`** — `phase` · `code` · `quota` · `received` · `matched` · `claimed`
- **`attend`** — `state[21]` (`0`미출석 · `1`출석 · `2`동반 · `4`보충) · `makeup` · `streak`
- **`vault` / `ui`** — 보상함 드로어 · 유의사항 · toast · MO 메뉴

---

## API 연동 지점 (`event.js`)

응답 권장 규격: `{ rtnCode, message, result }` — `rtnCode !== "0000"` 이면 `Utils.alert` 후 중단 (`fetchApi`).

| 함수 | 시점 |
|------|------|
| `getMedalState()` | 로드 |
| `postIssueMedal()` | 발급 |
| `getPartner(code)` | 코드 조회 |
| `postSendRequest(p)` | 합체 신청 |
| `postAcceptMerge(p)` | 수락/완성 |
| `postClaimReward()` | EVENT1 기본 보상 |
| `getAttendance()` | 로드·갱신 |
| `getVaultRewards()` | 보상함 오픈 |

mock 경로: `DATA_BASE = "./assets/data"` → 배포 시 API base URL로 교체.

---

## 프론트에 이미 반영된 정책

### EVENT1 메달 합체

- 자격: 로그인 + SA 계정
- 신청 **1일 5회**, 매일 **오전 8시** 초기화
- **신청 취소 시 횟수 미복구**
- **다른 상대 재신청 시 이전 신청 자동 취소** (횟수 미복구)
- 받은 신청 최대 10 · 최신/오래된 정렬 · 수락/거절

### EVENT2 출석

- 판정: **게임 접속 1회** (웹 클릭 출석 아님)
- 하루 기준: **08:00 ~ 다음날 07:59**
- 보충권: 동반 출석 · 3일 연속 (각 최대 5)
- 보충(`state=4`) 날은 **연속·동반 집계 제외**
- 일자별·마일스톤 보상은 페이지에서 「받기」

### EVENT3 쇼케이스

- 정적 데이터(`showcase`) — 타임테이블 · 팀 · 중계진 · 시청 이벤트

---

## SCSS · 마크업 규칙

```bash
npm run scss
```

- 진입점: `assets/styles/style.scss`
- 브레이크포인트: `partials/_breakpoints.scss`
- 디자인 토큰: `partials/_variables.scss`
- viewport: `width=device-width, initial-scale=1`
