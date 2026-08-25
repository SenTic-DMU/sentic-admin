// 로그인 요청/응답 필드는 백엔드 확인 전 임시 가정 (확인되면 이 파일만 수정)
export interface AdminUser {
  id: number;
  loginId: string;
  email: string;
  nickname: string;
  role: string;
}

export interface LoginRequest {
  loginId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  admin: AdminUser;
}
