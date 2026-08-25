import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { useFaqs, useMoveFaqOrder } from "./hooks";
import * as api from "./api";
import type { Faq } from "./types";

vi.mock("./api");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

const faqs: Faq[] = [
  { id: 1, question: "q1", answer: "a1", orderNum: 1 },
  { id: 2, question: "q2", answer: "a2", orderNum: 2 },
];

describe("useMoveFaqOrder", () => {
  beforeEach(() => {
    vi.mocked(api.fetchFaqs).mockReset();
    vi.mocked(api.moveFaqOrder).mockReset();
  });

  it("optimistically swaps adjacent faq order before the request resolves", async () => {
    vi.mocked(api.fetchFaqs).mockResolvedValue(faqs);
    vi.mocked(api.moveFaqOrder).mockReturnValue(new Promise(() => {}));

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useFaqs(), { wrapper });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(() => useMoveFaqOrder(), {
      wrapper,
    });

    act(() => {
      mutationResult.current.mutate({ id: "2", direction: "UP" });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Faq[]>(["faqs"]);
      expect(cached?.[0].id).toBe(2);
      expect(cached?.[1].id).toBe(1);
    });
  });

  it("rolls back the optimistic swap when the request fails", async () => {
    vi.mocked(api.fetchFaqs).mockResolvedValue(faqs);
    vi.mocked(api.moveFaqOrder).mockRejectedValue(new Error("network error"));

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useFaqs(), { wrapper });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(() => useMoveFaqOrder(), {
      wrapper,
    });

    act(() => {
      mutationResult.current.mutate({ id: "2", direction: "UP" });
    });

    await waitFor(() => expect(mutationResult.current.isError).toBe(true));

    const cached = queryClient.getQueryData<Faq[]>(["faqs"]);
    expect(cached?.[0].id).toBe(1);
    expect(cached?.[1].id).toBe(2);
  });
});
