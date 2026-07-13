import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { useMembers, useUpdateMemberStatus } from "./hooks";
import * as api from "./api";
import type { Member, MemberListResponse } from "./types";

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
  id: "1",
  email: "a@b.com",
  nickname: "a",
  createdAt: "2026-01-01",
  status: "ACTIVE",
};

describe("useUpdateMemberStatus", () => {
  beforeEach(() => {
    vi.mocked(api.fetchMembers).mockReset();
    vi.mocked(api.updateMemberStatus).mockReset();
  });

  it("optimistically updates the cached member list before the request resolves", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue({
      content: [member],
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(api.updateMemberStatus).mockReturnValue(new Promise(() => {}));

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useMembers("", 0), {
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
      const cached = queryClient.getQueryData<MemberListResponse>([
        "members",
        "",
        0,
      ]);
      expect(cached?.content[0].status).toBe("INACTIVE");
    });
  });

  it("rolls back the optimistic update when the request fails", async () => {
    vi.mocked(api.fetchMembers).mockResolvedValue({
      content: [member],
      totalElements: 1,
      totalPages: 1,
    });
    vi.mocked(api.updateMemberStatus).mockRejectedValue(
      new Error("network error")
    );

    const { wrapper, queryClient } = createWrapper();
    const { result: listResult } = renderHook(() => useMembers("", 0), {
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

    const cached = queryClient.getQueryData<MemberListResponse>([
      "members",
      "",
      0,
    ]);
    expect(cached?.content[0].status).toBe("ACTIVE");
  });
});
