import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNotice,
  deleteNotice,
  fetchNotice,
  fetchNotices,
  togglePinNotice,
  updateNotice,
} from "./api";
import type { NoticeInput } from "./types";

export const NOTICES_QUERY_KEY = ["notices"] as const;

export function noticeQueryKey(id: string) {
  return ["notice", id] as const;
}

export function useNotices() {
  return useQuery({
    queryKey: NOTICES_QUERY_KEY,
    queryFn: fetchNotices,
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
      queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: NoticeInput }) =>
      updateNotice(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: noticeQueryKey(variables.id) });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });
    },
  });
}

export function useTogglePinNotice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => togglePinNotice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTICES_QUERY_KEY });
    },
  });
}
