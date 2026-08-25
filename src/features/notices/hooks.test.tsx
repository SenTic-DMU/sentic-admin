import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { ReactNode } from "react";
import {
  useCreateNotice,
  useDeleteNotice,
  useNotices,
  useTogglePinNotice,
  useUpdateNotice,
} from "./hooks";
import * as api from "./api";

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

describe("notices hooks", () => {
  beforeEach(() => {
    vi.mocked(api.fetchNotices).mockReset();
    vi.mocked(api.createNotice).mockReset();
    vi.mocked(api.updateNotice).mockReset();
    vi.mocked(api.deleteNotice).mockReset();
    vi.mocked(api.togglePinNotice).mockReset();
  });

  it("invalidates the notices list after creating a notice", async () => {
    vi.mocked(api.fetchNotices).mockResolvedValue([]);
    vi.mocked(api.createNotice).mockResolvedValue({
      id: 1,
      title: "t",
      content: "c",
      pinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result: listResult } = renderHook(() => useNotices(), { wrapper });
    await waitFor(() => expect(listResult.current.data).toBeDefined());

    const { result: mutationResult } = renderHook(() => useCreateNotice(), {
      wrapper,
    });

    await act(async () => {
      await mutationResult.current.mutateAsync({ title: "t", content: "c" });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notices"] });
  });

  it("invalidates the notices list and detail after updating a notice", async () => {
    vi.mocked(api.updateNotice).mockResolvedValue({
      id: 1,
      title: "t2",
      content: "c2",
      pinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useUpdateNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        id: "1",
        input: { title: "t2", content: "c2" },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notices"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notice", "1"] });
  });

  it("invalidates the notices list after deleting a notice", async () => {
    vi.mocked(api.deleteNotice).mockResolvedValue(undefined);

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useDeleteNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("1");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notices"] });
  });

  it("invalidates the notices list after toggling pin", async () => {
    vi.mocked(api.togglePinNotice).mockResolvedValue({
      id: 1,
      title: "t",
      content: "c",
      pinned: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useTogglePinNotice(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("1");
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["notices"] });
  });
});
