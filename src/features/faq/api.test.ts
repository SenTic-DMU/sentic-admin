import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { createFaq, deleteFaq, fetchFaqs, moveFaqOrder, updateFaq } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("faq api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.put).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it("fetchFaqs requests the faq list", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchFaqs();
    expect(apiClient.get).toHaveBeenCalledWith("/api/admin/faq");
    expect(result).toEqual([]);
  });

  it("createFaq posts the faq input", async () => {
    const input = { question: "q", answer: "a" };
    const faq = { id: 1, ...input, orderNum: 1 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: faq });
    const result = await createFaq(input);
    expect(apiClient.post).toHaveBeenCalledWith("/api/admin/faq", input);
    expect(result).toEqual(faq);
  });

  it("updateFaq puts the faq input", async () => {
    const input = { question: "q2", answer: "a2" };
    const faq = { id: 1, ...input, orderNum: 1 };
    vi.mocked(apiClient.put).mockResolvedValue({ data: faq });
    const result = await updateFaq("1", input);
    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/faq/1", input);
    expect(result).toEqual(faq);
  });

  it("deleteFaq deletes the faq", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    await deleteFaq("1");
    expect(apiClient.delete).toHaveBeenCalledWith("/api/admin/faq/1");
  });

  it("moveFaqOrder swaps orderNum between the item and its UP neighbor via two PUT calls", async () => {
    const faqs = [
      { id: 1, question: "q1", answer: "a1", orderNum: 1 },
      { id: 2, question: "q2", answer: "a2", orderNum: 2 },
    ];
    vi.mocked(apiClient.get).mockResolvedValue({ data: faqs });
    vi.mocked(apiClient.put)
      .mockResolvedValueOnce({ data: { ...faqs[1], orderNum: 1 } })
      .mockResolvedValueOnce({ data: { ...faqs[0], orderNum: 2 } });

    const result = await moveFaqOrder("2", "UP");

    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/faq/2/order", {
      orderNum: 1,
    });
    expect(apiClient.put).toHaveBeenCalledWith("/api/admin/faq/1/order", {
      orderNum: 2,
    });
    expect(result).toHaveLength(2);
  });
});
