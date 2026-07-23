import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMemberPayments, usePayments } from "./hooks";
import * as api from "./api";

vi.mock("./api");

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useMemberPayments", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMemberPayments).mockReset();
    vi.mocked(api.fetchPayments).mockReset();
  });

  it("does not fetch when memberId is empty", () => {
    renderHook(() => useMemberPayments(""), { wrapper });
    expect(api.fetchMemberPayments).not.toHaveBeenCalled();
  });

  it("fetches payments when memberId is provided", async () => {
    vi.mocked(api.fetchMemberPayments).mockResolvedValue([]);
    const { result } = renderHook(() => useMemberPayments("1"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchMemberPayments).toHaveBeenCalledWith("1");
  });
});

describe("usePayments", () => {
  beforeEach(() => {
    vi.mocked(api.fetchPayments).mockReset();
  });

  it("fetches payments with the given status, memberId, and page", async () => {
    vi.mocked(api.fetchPayments).mockResolvedValue({
      content: [],
      totalElements: 0,
      totalPages: 0,
    });
    const { result } = renderHook(() => usePayments("SUCCESS", "1", 0), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(api.fetchPayments).toHaveBeenCalledWith({
      status: "SUCCESS",
      memberId: "1",
      page: 0,
    });
  });
});
