import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { fetchMembers, fetchMember, updateMemberStatus } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: { get: vi.fn(), patch: vi.fn() },
}));

describe("members api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.patch).mockReset();
  });

  it("fetchMembers requests the members list with keyword and page", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({
      data: { content: [], totalElements: 0, totalPages: 0 },
    });
    const result = await fetchMembers({ keyword: "alice", page: 1 });
    expect(apiClient.get).toHaveBeenCalledWith("/admin/members", {
      params: { keyword: "alice", page: 1 },
    });
    expect(result.totalPages).toBe(0);
  });

  it("fetchMember requests a single member by id", async () => {
    const member = {
      id: "1",
      email: "a@b.com",
      nickname: "a",
      createdAt: "2026-01-01",
      status: "ACTIVE",
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: member });
    const result = await fetchMember("1");
    expect(apiClient.get).toHaveBeenCalledWith("/admin/members/1");
    expect(result).toEqual(member);
  });

  it("updateMemberStatus patches the member status", async () => {
    const member = {
      id: "1",
      email: "a@b.com",
      nickname: "a",
      createdAt: "2026-01-01",
      status: "INACTIVE",
    };
    vi.mocked(apiClient.patch).mockResolvedValue({ data: member });
    const result = await updateMemberStatus("1", "INACTIVE");
    expect(apiClient.patch).toHaveBeenCalledWith("/admin/members/1/status", {
      status: "INACTIVE",
    });
    expect(result.status).toBe("INACTIVE");
  });
});
