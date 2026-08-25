# 관리자 웹 - 실제 백엔드 API 연동 설계

- 날짜: 2026-08-25
- 배경: [2026-07-13-admin-web-design.md](./2026-07-13-admin-web-design.md)에서 "가정한 API 계약"으로 회원/공지/FAQ/결제 4개 도메인과 mock 모드를 구현해 두었다. 이번에 실제 백엔드 관리자 API 스펙이 확정되어, 각 도메인의 `api.ts`/`types.ts`/`mock.ts`/`hooks.ts`/페이지 컴포넌트를 실제 계약에 맞게 교체한다.
- 범위: 프론트엔드 코드만 수정한다. 백엔드는 이미 구현되어 있다고 가정.

## 1. 공통 응답 포맷 및 인증

모든 관리자 API는 `/api/admin/**` 경로이며 `Authorization: Bearer {token}` 헤더가 필요하다. 모든 응답은 다음 포맷으로 래핑된다.

```
성공: { "success": true, "data": ... }
실패: { "success": false, "message": "..." }
```

`lib/apiClient.ts`의 응답 인터셉터에서:
- HTTP 2xx이고 `success: true`면 `data`만 꺼내서 리턴한다 (`features/*/api.ts`는 지금처럼 `const { data } = await apiClient.get(...)`로 쓰되, 이 `data`가 이미 언래핑된 실제 payload가 되도록 한다).
- `success: false`면 `message`를 담은 에러로 reject한다.
- 401은 기존과 동일하게 토큰 제거 + `/login`으로 리다이렉트.
- 403(ADMIN 권한 없음)은 로그아웃시키지 않고, 호출부에서 에러 메시지를 그대로 표시한다.

로그인은 일반 로그인 API `POST /api/auth/login`을 그대로 사용한다. 실제 백엔드(ngrok)로 확인한 계약은 다음과 같다 (2026-08-25 확인):

- 요청: `{ loginId, password }`
- 성공 응답: `{ success: true, message: "success", data: { accessToken, refreshToken } }` — **사용자 프로필(닉네임/이메일 등)은 내려오지 않는다.** 대신 `accessToken`(JWT)의 클레임에 `sub`(사용자 id)와 `role`이 들어있어, 로그인 후 `features/auth/jwt.ts`의 `decodeJwt`로 이를 꺼내 쓴다. `role !== "ADMIN"`이면 로그인 실패로 처리한다.
- 토큰 재발급: `POST /api/auth/refresh`, **바디가 아니라 `Refresh-Token: {refreshToken}` 헤더**로 전달. 응답은 `{ success, data: { accessToken, refreshToken } }`(둘 다 새로 발급)이고, refreshToken이 만료/무효면 `401`을 반환한다. `lib/apiClient.ts`의 응답 인터셉터가 401을 받으면 이 엔드포인트로 자동 재발급을 시도하고, 성공하면 원래 요청을 한 번 재시도한다. 재발급도 실패하면 그때 토큰을 지우고 로그인 페이지로 보낸다 (동시에 여러 요청이 401을 맞아도 재발급 호출은 한 번만 나가도록 in-flight 프로미스를 공유한다).
- 매핑되지 않은 경로로 요청 시 처음엔 404 대신 500이 내려오는 문제가 있었으나, 백엔드에서 `GlobalExceptionHandler`의 `NoResourceFoundException` 처리를 수정해 해결됨.

## 2. 페이지네이션 제거

회원/공지/FAQ/결제 목록 API가 모두 페이지네이션 없이 전체 배열(`data: [...]`)을 반환한다. 기존 프론트는 `{ content, totalElements, totalPages }` 형태의 서버 페이지네이션을 가정하고 `Pagination` 컴포넌트 + `?page=` 쿼리스트링 동기화를 구현해뒀었는데, 이를 전부 제거한다.

- `FetchXxxParams`에서 `page` 제거
- `hooks.ts`의 쿼리 키에서 `page` 제거
- 페이지 컴포넌트에서 `Pagination` 렌더링 및 `page`/`setSearchParams` 페이지 로직 제거
- `components/common/Pagination.tsx`가 더 이상 쓰이지 않게 되면 삭제

## 3. 도메인별 변경

### 3.1 회원 관리 (`features/members`)

```
GET  /api/admin/users?keyword=      → data: Member[]
GET  /api/admin/users/{userId}      → data: Member
PUT  /api/admin/users/{userId}/status  { status: 'ACTIVE'|'INACTIVE'|'BANNED' } → data: Member
```

`Member` 타입:
```ts
interface Member {
  id: number;
  loginId: string;
  email: string;
  nickname: string;
  provider: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "BANNED";
  createdAt: string;
}
```

- 목록 검색은 `keyword`만 쿼리로 보낸다 (페이지 없음).
- 목록 테이블에 `provider` 뱃지를 추가 표시.
- 상세 페이지에 `loginId`, `role` 표시.
- 상태 변경은 PUT (기존 PATCH에서 변경), 상태값이 3개(ACTIVE/INACTIVE/BANNED)가 되므로 기존의 단순 토글 버튼 대신 `<select>` 드롭다운으로 전환한다 (변경 시 바로 `updateMemberStatus` 호출).
- `updateMemberStatus`의 낙관적 업데이트 로직(`hooks.ts`)은 페이지네이션 제거에 맞춰 `MemberListResponse`(객체) 대신 `Member[]`(배열) 캐시를 갱신하도록 수정.

### 3.2 공지사항 (`features/notices` → 백엔드 명칭은 announcements이지만 프론트 폴더/변수명은 기존 `notices`를 유지)

```
GET    /api/admin/announcements                    → data: Notice[]
POST   /api/admin/announcements   { title, content } → data: Notice
PUT    /api/admin/announcements/{id}  { title, content } → data: Notice
DELETE /api/admin/announcements/{id}
PUT    /api/admin/announcements/{id}/pin            → data: Notice
```

`Notice` 타입: `isPinned` → `pinned`로 필드명 변경 외 동일 (`{ id, title, content, pinned, createdAt, updatedAt }`).

- 작성/수정 폼(`NoticeFormPage`)의 요청 바디에서 `pinned` 제외 (title/content만).
- 목록의 "상단 고정" 토글 버튼은 `updateNotice`가 아니라 별도의 `togglePinNotice`(pin 전용 엔드포인트) 호출로 변경.
- 정렬(고정 항목 먼저, 이후 최신순)은 프론트에서 계속 처리.

### 3.3 FAQ (`features/faq`)

```
GET    /api/admin/faq                       → data: Faq[]
POST   /api/admin/faq      { question, answer } → data: Faq
PUT    /api/admin/faq/{id} { question, answer } → data: Faq
DELETE /api/admin/faq/{id}
PUT    /api/admin/faq/{id}/order  { orderNum } → data: Faq
```

- `moveFaqOrder(id, direction)`의 시그니처는 유지하되, 내부 구현을 "인접 항목과 direction 방향으로 orderNum을 swap"하는 걸로 변경: 현재 목록에서 index를 찾고, 이동 대상 인접 항목과 각각의 `orderNum` 값을 교환하여 두 번의 `PUT .../order` 호출을 수행한다 (기존에 서버가 swap을 처리해주던 것과 달리 프론트가 두 항목의 새 orderNum을 계산해서 각각 보낸다).
- `useMoveFaqOrder`의 낙관적 업데이트 로직은 이미 로컬에서 orderNum을 swap하는 방식이라 큰 변경 없이 재사용 가능.

### 3.4 결제 내역 (`features/payments`)

```
GET /api/admin/payments?status=            → data: Payment[]
GET /api/admin/payments/user/{userId}      → data: Payment[]
```

`Payment` 타입:
```ts
interface Payment {
  id: number;
  userId: number;
  planId: number;
  amount: number;
  status: "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";
  paymentMethod: string;
  paidAt: string;
  expiresAt: string;
  createdAt: string;
}
```

- `memberEmail`/`memberNickname`/`planName` 필드가 없으므로 목록 테이블에는 `userId`, `planId`를 그대로 표시한다 (추가 조인 조회 없음). `userId`는 `/members/{userId}`로 링크.
- 상태 필터(`status`)는 쿼리 파라미터로 유지. `memberId` 쿼리 필터는 제거하고, 회원별 조회는 `fetchMemberPayments(userId)`가 `/api/admin/payments/user/{userId}`를 호출하도록 변경 (기존과 동일한 함수, 엔드포인트만 변경).
- `PaymentsListPage`의 `?memberId=` 쿼리스트링 필터 UI(및 "필터 해제" 버튼)는 그대로 유지하되, 내부적으로 `memberId`가 있으면 `fetchMemberPayments`를, 없으면 `fetchPayments`를 호출하도록 `usePayments`/`hooks.ts`를 조정한다.

## 4. Mock 모드

`VITE_USE_MOCK_API=true`일 때 쓰는 각 도메인의 `mock.ts`도 위 3장의 새 타입/필드명에 맞게 함께 수정한다 (백엔드 없이 데모가 계속 동작해야 하므로).

## 5. 테스트

기존 `*.api.test.ts`, `*.hooks.test.tsx`, 페이지 `*.test.tsx`는 옛 계약(페이지네이션 객체, `isPinned`, UP/DOWN 등) 기준이므로 새 계약에 맞게 함께 갱신한다.

## 6. 범위 밖

- 로그인 요청/응답 실제 필드명 확정 (백엔드팀 확인 필요 — 확인되면 `features/auth/api.ts`, `types.ts`만 수정)
- 결제 내역에 회원/플랜 이름을 보여주기 위한 추가 API 연동
- 페이지네이션이 추후 백엔드에 추가될 경우의 재도입
