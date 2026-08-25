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
        id: 1,
        userId: 1,
        planId: 1,
        amount: 9900,
        status: "SUCCESS",
        paymentMethod: "CARD",
        paidAt: "2026-01-01",
        expiresAt: "2026-02-01",
        createdAt: "2026-01-01",
      },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: payments });
    const result = await fetchMemberPayments("1");
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/payments/user/1");
    expect(result).toEqual(payments);
  });

  it("fetches the payments list with a status filter", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchPayments({ status: "SUCCESS" });
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/payments", {
      params: { status: "SUCCESS" },
    });
    expect(result).toEqual([]);
  });
});
