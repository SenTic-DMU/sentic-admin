import { apiClient } from "../../lib/apiClient";
import { mockLogin } from "./mock";
import type { LoginRequest, LoginResponse } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK_API) {
    return mockLogin(payload);
  }
  const { data } = await apiClient.post<LoginResponse>(
    "/api/auth/login",
    payload
  );
  return data;
}
