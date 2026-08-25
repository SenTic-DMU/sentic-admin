// 실제 백엔드(POST /api/auth/login)로 확인된 형태. 응답에는 사용자 프로필이 없고
// accessToken의 JWT 클레임(sub, role)만 내려온다 — 자세한 내용은 jwt.ts 참고.
export interface AdminUser {
  id: string;
  role: string;
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
}
