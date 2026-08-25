import type { LoginRequest, LoginResponse } from "./types";

const MOCK_LOGIN_ID = "admin";
const MOCK_PASSWORD = "admin1234";

export async function mockLogin(payload: LoginRequest): Promise<LoginResponse> {
  await delay(300);
  if (payload.loginId !== MOCK_LOGIN_ID || payload.password !== MOCK_PASSWORD) {
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
  return {
    accessToken: "mock-access-token",
    admin: {
      id: 1,
      loginId: MOCK_LOGIN_ID,
      email: "admin@sentic.com",
      nickname: "관리자",
      role: "ADMIN",
    },
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
