# sentic-admin

SenTic 영어 회화 학습 앱의 관리자 웹.

## 실행

```bash
npm install
npm run dev
```

## 테스트

```bash
npm test
```

## 더미 데이터로 실행 (백엔드 없이 화면 확인용)

`.env.development.local` 파일을 만들고 아래 내용을 넣으면, 실제 서버 없이도
로그인/회원 목록/상태 전환을 눈으로 확인할 수 있습니다.

```
VITE_API_BASE_URL=http://localhost:4000
VITE_USE_MOCK_API=true
```

로그인 계정: `admin@sentic.com` / `admin1234`

실제 백엔드가 준비되면 `VITE_USE_MOCK_API` 줄을 지우거나 `false`로 바꾸면 됩니다.
