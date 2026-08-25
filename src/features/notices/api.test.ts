import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import {
  createNotice,
  deleteNotice,
  fetchNotice,
  fetchNotices,
  togglePinNotice,
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

  it("fetchNotices requests the announcements list", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchNotices();
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/announcements");
    expect(result).toEqual([]);
  });

  it("fetchNotice requests a single notice by id", async () => {
    const notice = {
      id: 1,
      title: "t",
      content: "c",
      pinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: notice });
    const result = await fetchNotice("1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/announcements/1");
    expect(result).toEqual(notice);
  });

  it("createNotice posts the notice input without pinned", async () => {
    const input = { title: "t", content: "c" };
    const notice = {
      id: 1,
      ...input,
      pinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-01",
    };
    vi.mocked(apiClient.post).mockResolvedValue({ data: notice });
    const result = await createNotice(input);
    expect(apiClient.post).toHaveBeenCalledWith(
      "/api/admin/announcements",
      input
    );
    expect(result).toEqual(notice);
  });

  it("updateNotice puts the notice input without pinned", async () => {
    const input = { title: "t2", content: "c2" };
    const notice = {
      id: 1,
      ...input,
      pinned: false,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    };
    vi.mocked(apiClient.put).mockResolvedValue({ data: notice });
    const result = await updateNotice("1", input);
    expect(apiClient.put).toHaveBeenCalledWith(
      "/api/admin/announcements/1",
      input
    );
    expect(result).toEqual(notice);
  });

  it("deleteNotice deletes the notice", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    await deleteNotice("1");
    expect(apiClient.delete).toHaveBeenCalledWith(
      "/api/admin/announcements/1"
    );
  });

  it("togglePinNotice calls the pin endpoint", async () => {
    const notice = {
      id: 1,
      title: "t",
      content: "c",
      pinned: true,
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    };
    vi.mocked(apiClient.put).mockResolvedValue({ data: notice });
    const result = await togglePinNotice("1");
    expect(apiClient.put).toHaveBeenCalledWith(
      "/api/admin/announcements/1/pin"
    );
    expect(result).toEqual(notice);
  });
});
