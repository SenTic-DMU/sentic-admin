import { apiClient } from "../../lib/apiClient";
import { mockFetchMemberPayments, mockFetchPayments } from "./mock";
import type { FetchPaymentsParams, Payment, PaymentListResponse } from "./types";

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

export async function fetchPayments(
  params: FetchPaymentsParams
): Promise<PaymentListResponse> {
  if (USE_MOCK_API) {
    return mockFetchPayments(params);
  }
  const { data } = await apiClient.get<PaymentListResponse>("/admin/payments", {
    params: {
      status: params.status,
      memberId: params.memberId,
      page: params.page,
    },
  });
  return data;
}
