import { useQuery } from "@tanstack/react-query";
import { fetchMemberPayments, fetchPayments } from "./api";
import type { PaymentStatus } from "./types";

export function useMemberPayments(memberId: string) {
  return useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: () => fetchMemberPayments(memberId),
    enabled: Boolean(memberId),
  });
}

export function usePayments(
  status: PaymentStatus | undefined,
  memberId: string | undefined,
  page: number
) {
  return useQuery({
    queryKey: ["payments", status ?? "", memberId ?? "", page],
    queryFn: () => fetchPayments({ status, memberId, page }),
  });
}
