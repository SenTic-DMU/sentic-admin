import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNotice,
  deleteNotice,
  fetchNotice,
  fetchNotices,
  updateNotice,
} from "./api";
import type { NoticeInput } from "./types";

export function noticesQueryKey(page: number) {
  return ["notices", page] as const;
}

export function noticeQueryKey(id: string) {
  return ["notice", id] as const;
}

export function useNotices(page: number) {
  return useQuery({
    queryKey: noticesQueryKey(page),
    queryFn: () => fetchNotices({ page }),
  });
}

export function useNotice(id: string) {
  return useQuery({
    queryKey: noticeQueryKey(id),
    queryFn: () => fetchNotice(id),
    enabled: Boolean(id),
  });
}

export function useCreateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NoticeInput) => createNotice(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NoticeInput }) =>
      updateNotice(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: noticeQueryKey(variables.id) });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
    },
  });
}
