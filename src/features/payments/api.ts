import { apiClient } from "../../lib/apiClient";
import { mockFetchMemberPayments, mockFetchPayments } from "./mock";
import type { FetchPaymentsParams, Payment } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchMemberPayments(userId: string): Promise<Payment[]> {
  if (USE_MOCK_API) {
    return mockFetchMemberPayments(userId);
  }
  const { data } = await apiClient.get<Payment[]>(
    `/api/admin/payments/user/${userId}`
  );
  return data;
}

export async function fetchPayments(
  params: FetchPaymentsParams
): Promise<Payment[]> {
  if (USE_MOCK_API) {
    return mockFetchPayments(params);
  }
  const { data } = await apiClient.get<Payment[]>("/api/admin/payments", {
    params: { status: params.status },
  });
  return data;
}
