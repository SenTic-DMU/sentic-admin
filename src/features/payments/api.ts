import { apiClient } from "../../lib/apiClient";
import type { Payment } from "./types";

export async function fetchMemberPayments(memberId: string): Promise<Payment[]> {
  const { data } = await apiClient.get<Payment[]>(
    `/admin/members/${memberId}/payments`
  );
  return data;
}
