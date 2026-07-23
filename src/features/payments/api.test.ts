import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { fetchMemberPayments, fetchPayments } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: { get: vi.fn() },
}));

describe("payments api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
  });

  it("fetches payments for a member", async () => {
    const payments = [
      {
        id: "p1",
        memberId: "1",
        memberEmail: "a@b.com",
        memberNickname: "a",
        amount: 9900,
        planName: "Premium",
        status: "SUCCESS",
        paidAt: "2026-01-01",
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: payments });
    const result = await fetchMemberPayments("1");
    expect(apiClient.get).toHaveBeenCalledWith("/admin/members/1/payments");
    expect(result).toEqual(payments);
  });

  it("fetches the payments list with status, memberId, and page filters", async () => {
    const response = { content: [], totalElements: 0, totalPages: 0 };
    vi.mocked(apiClient.get).mockResolvedValue({ data: response });
    const result = await fetchPayments({ status: "SUCCESS", memberId: "1", page: 0 });
    expect(apiClient.get).toHaveBeenCalledWith("/admin/payments", {
      params: { status: "SUCCESS", memberId: "1", page: 0 },
    });
    expect(result).toEqual(response);
  });
});
