import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { fetchMembers, fetchMember, updateMemberStatus } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: { get: vi.fn(), put: vi.fn() },
}));

describe("members api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.put).mockReset();
  });

  it("fetchMembers requests the members list with keyword", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchMembers({ keyword: "alice" });
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/users", {
      params: { keyword: "alice" },
    });
    expect(result).toEqual([]);
  });

  it("fetchMember requests a single member by id", async () => {
    const member = {
      id: 1,
      loginId: "a",
      email: "a@b.com",
      nickname: "a",
      provider: "LOCAL",
      role: "USER",
      status: "ACTIVE",
      createdAt: "2026-01-01",
    };
    vi.mocked(apiClient.get).mockResolvedValue({ data: member });
    const result = await fetchMember("1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/users/1");
    expect(result).toEqual(member);
  });

  it("updateMemberStatus puts the member status", async () => {
    const member = {
      id: 1,
      loginId: "a",
      email: "a@b.com",
      nickname: "a",
      provider: "LOCAL",
      role: "USER",
      status: "INACTIVE",
      createdAt: "2026-01-01",
    };
    vi.mocked(apiClient.put).mockResolvedValue({ data: member });
    const result = await updateMemberStatus("1", "INACTIVE");
    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/users/1/status", {
      status: "INACTIVE",
    });
    expect(result.status).toBe("INACTIVE");
  });
});
