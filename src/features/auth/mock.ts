import type { LoginRequest, LoginResponse } from "./types";

const MOCK_LOGIN_ID = "admin";
const MOCK_PASSWORD = "admin1234";

function base64UrlEncode(value: unknown): string {
  return btoa(JSON.stringify(value))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function buildMockJwt(sub: string, role: string): string {
  const header = base64UrlEncode({ alg: "none" });
  const payload = base64UrlEncode({
    sub,
    role,
    exp: Math.floor(Date.now() / 1000) + 30 * 60,
  });
  return `${header}.${payload}.mock-signature`;
}

export async function mockLogin(payload: LoginRequest): Promise<LoginResponse> {
  await delay(300);
  if (payload.loginId !== MOCK_LOGIN_ID || payload.password !== MOCK_PASSWORD) {
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  }
  return {
    accessToken: buildMockJwt("1", "ADMIN"),
    refreshToken: "mock-refresh-token",
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
