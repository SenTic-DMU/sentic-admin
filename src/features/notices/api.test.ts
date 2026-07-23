import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import {
  createNotice,
  deleteNotice,
  fetchNotice,
  fetchNotices,
  updateNotice,
} from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("notices api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.put).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it("fetchNotices requests the notices list with page", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { content: [], totalElements: 0, totalPages: 0 },
    });
    const result = await fetchNotices({ page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith("/admin/notices", {
      params: { page: 1 },
    });
    expect(result.totalPages).toBe(0);
  });

  it("fetchNotice requests a single notice by id", async () => {
    const notice = {
      id: "1",
      title: "t",
      content: "c",
      isPinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: notice });
    const result = await fetchNotice("1");
    expect(apiClient.get).toHaveBeenCalledWith("/admin/notices/1");
    expect(result).toEqual(notice);
  });

  it("createNotice posts the notice input", async () => {
    const input = { title: "t", content: "c", isPinned: true };
    const notice = { id: "1", ...input, createdAt: "2026-01-01", updatedAt: "2026-01-01" };
    vi.mocked(apiClient.post).mockResolvedValue({ data: notice });
    const result = await createNotice(input);
    expect(apiClient.post).toHaveBeenCalledWith("/admin/notices", input);
    expect(result).toEqual(notice);
  });

  it("updateNotice puts the notice input", async () => {
    const input = { title: "t2", content: "c2", isPinned: false };
    const notice = { id: "1", ...input, createdAt: "2026-01-01", updatedAt: "2026-01-02" };
    vi.mocked(apiClient.put).mockResolvedValue({ data: notice });
    const result = await updateNotice("1", input);
    expect(apiClient.put).toHaveBeenCalledWith("/admin/notices/1", input);
    expect(result).toEqual(notice);
  });

  it("deleteNotice deletes the notice", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    await deleteNotice("1");
    expect(apiClient.delete).toHaveBeenCalledWith("/admin/notices/1");
  });
});
