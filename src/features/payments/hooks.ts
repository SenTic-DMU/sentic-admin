import { useQuery } from "@tanstack/react-query";
import { fetchMemberPayments } from "./api";

export function useMemberPayments(memberId: string) {
  return useQuery({
    queryKey: ["member-payments", memberId],
    queryFn: () => fetchMemberPayments(memberId),
    enabled: Boolean(memberId),
  });
}
