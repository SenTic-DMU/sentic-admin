import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMember, fetchMembers, updateMemberStatus } from "./api";
import type { Member, MemberStatus } from "./types";

export function membersQueryKey(keyword: string) {
  return ["members", keyword] as const;
}

export function memberQueryKey(id: string) {
  return ["member", id] as const;
}

export function useMembers(keyword: string) {
  return useQuery({
    queryKey: membersQueryKey(keyword),
    queryFn: () => fetchMembers({ keyword }),
  });
}

export function useMember(id: string) {
  return useQuery({
    queryKey: memberQueryKey(id),
    queryFn: () => fetchMember(id),
    enabled: Boolean(id),
  });
}

interface UpdateStatusVariables {
  id: string;
  status: MemberStatus;
}

interface MutationContext {
  previousMemberLists: [readonly unknown[], Member[] | undefined][];
  previousMember: Member | undefined;
  id: string;
}

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    scope: { id: "member-status-update" },
    mutationFn: ({ id, status }: UpdateStatusVariables) =>
      updateMemberStatus(id, status),
    onMutate: async ({ id, status }): Promise<MutationContext> => {
      await queryClient.cancelQueries({ queryKey: ["members"] });
      await queryClient.cancelQueries({ queryKey: memberQueryKey(id) });

      const previousMemberLists = queryClient.getQueriesData<Member[]>({
        queryKey: ["members"],
      });
      const previousMember = queryClient.getQueryData<Member>(
        memberQueryKey(id)
      );

      queryClient.setQueriesData<Member[]>({ queryKey: ["members"] }, (old) => {
        if (!old) return old;
        return old.map((member) =>
          String(member.id) === id ? { ...member, status } : member
        );
      });

      if (previousMember) {
        queryClient.setQueryData<Member>(memberQueryKey(id), {
          ...previousMember,
          status,
        });
      }

      return { previousMemberLists, previousMember, id };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;
      context.previousMemberLists.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      if (context.previousMember) {
        queryClient.setQueryData(
          memberQueryKey(context.id),
          context.previousMember
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: memberQueryKey(variables.id) });
    },
  });
}
