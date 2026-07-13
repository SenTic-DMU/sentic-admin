import type { LoginRequest, LoginResponse } from "./types";

const MOCK_EMAIL = "admin@sentic.com";
const MOCK_PASSWORD = "admin1234";

export async function mockLogin(payload: LoginRequest): Promise<LoginResponse> {
  await delay(300);
  if (payload.email !== MOCK_EMAIL || payload.password !== MOCK_PASSWORD) {
    throw new Error("Invalid credentials");
  }
  return {
    accessToken: "mock-access-token",
    admin: { id: "mock-admin-1", email: MOCK_EMAIL, name: "관리자" },
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
