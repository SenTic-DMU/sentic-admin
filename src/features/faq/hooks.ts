import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFaq, deleteFaq, fetchFaqs, moveFaqOrder, updateFaq } from "./api";
import type { Faq, FaqDirection, FaqInput } from "./types";

export const FAQS_QUERY_KEY = ["faqs"] as const;

function sortFaqs(faqs: Faq[]): Faq[] {
  return [...faqs].sort((a, b) => a.orderNum - b.orderNum);
}

export function useFaqs() {
  return useQuery({
    queryKey: FAQS_QUERY_KEY,
    queryFn: fetchFaqs,
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FaqInput) => createFaq(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FaqInput }) =>
      updateFaq(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFaq(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
    },
  });
}

interface MoveFaqVariables {
  id: string;
  direction: FaqDirection;
}

export function useMoveFaqOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    scope: { id: "faq-order-move" },
    mutationFn: ({ id, direction }: MoveFaqVariables) =>
      moveFaqOrder(id, direction),
    onMutate: async ({ id, direction }) => {
      await queryClient.cancelQueries({ queryKey: FAQS_QUERY_KEY });
      const previousFaqs = queryClient.getQueryData<Faq[]>(FAQS_QUERY_KEY);

      queryClient.setQueryData<Faq[]>(FAQS_QUERY_KEY, (old) => {
        if (!old) return old;
        const sorted = sortFaqs(old);
        const index = sorted.findIndex((f) => String(f.id) === id);
        const targetIndex = direction === "UP" ? index - 1 : index + 1;
        if (index === -1 || targetIndex < 0 || targetIndex >= sorted.length) {
          return old;
        }
        const swapped = [...sorted];
        const currentOrderNum = swapped[index].orderNum;
        swapped[index] = { ...swapped[index], orderNum: swapped[targetIndex].orderNum };
        swapped[targetIndex] = { ...swapped[targetIndex], orderNum: currentOrderNum };
        return sortFaqs(swapped);
      });

      return { previousFaqs };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousFaqs) {
        queryClient.setQueryData(FAQS_QUERY_KEY, context.previousFaqs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: FAQS_QUERY_KEY });
    },
  });
}
