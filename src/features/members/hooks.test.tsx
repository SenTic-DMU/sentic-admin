import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMembers, useUpdateMemberStatus } from "./hooks";
import * as api from "./api";
import type { Member } from "./types";

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

const member: Member = {
  id: 1,
  loginId: "a",
  email: "a@b.com",
  nickname: "a",
  provider: "LOCAL",
  role: "USER",
  status: "ACTIVE",
  createdAt: "2026-01-01",
};

describe("useUpdateMemberStatus", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMembers).mockReset();
    vi.mocked(api.updateMemberStatus).mockReset();
  });

  it("optimistically updates the cached member list before the request resolves", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue([member]);
    vi.mocked(api.updateMemberStatus).mockReturnValue(new Promise(() => {}));

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useMembers(""), {
      wrapper,
    });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(
      () => useUpdateMemberStatus(),
      { wrapper }
    );

    act(() => {
      mutationResult.current.mutate({ id: "1", status: "INACTIVE" });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Member[]>(["members", ""]);
      expect(cached?.[0].status).toBe("INACTIVE");
    });
  });

  it("rolls back the optimistic update when the request fails", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue([member]);
    vi.mocked(api.updateMemberStatus).mockRejectedValue(
      new Error("network error")
    );

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useMembers(""), {
      wrapper,
    });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(
      () => useUpdateMemberStatus(),
      { wrapper }
    );

    act(() => {
      mutationResult.current.mutate({ id: "1", status: "INACTIVE" });
    });

    await waitFor(() => expect(mutationResult.current.isError).toBe(true));

    const cached = queryClient.getQueryData<Member[]>(["members", ""]);
    expect(cached?.[0].status).toBe("ACTIVE");
  });
});
