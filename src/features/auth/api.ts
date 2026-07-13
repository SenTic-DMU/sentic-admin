import { apiClient } from "../../lib/apiClient";
import type { LoginRequest, LoginResponse } from "./types";

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>(
    "/admin/auth/login",
    payload
  );
  return data;
}
