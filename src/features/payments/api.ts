import { apiClient } from "../../lib/apiClient";
import { mockFetchMemberPayments } from "./mock";
import type { Payment } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchMemberPayments(memberId: string): Promise<Payment[]> {
  if (USE_MOCK_API) {
    return mockFetchMemberPayments(memberId);
  }
  const { data } = await apiClient.get<Payment[]>(
    `/admin/members/${memberId}/payments`
  );
  return data;
}
