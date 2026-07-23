import { describe, expect, it, vi, beforeEach } from "vitest";
import { apiClient } from "../../lib/apiClient";
import { createFaq, deleteFaq, fetchFaqs, moveFaqOrder, updateFaq } from "./api";

vi.mock("../../lib/apiClient", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("faq api", () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset();
    vi.mocked(apiClient.post).mockReset();
    vi.mocked(apiClient.put).mockReset();
    vi.mocked(apiClient.patch).mockReset();
    vi.mocked(apiClient.delete).mockReset();
  });

  it("fetchFaqs requests the faq list", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: [] });
    const result = await fetchFaqs();
    expect(apiClient.get).toHaveBeenCalledWith("/admin/faqs");
    expect(result).toEqual([]);
  });

  it("createFaq posts the faq input", async () => {
    const input = { question: "q", answer: "a" };
    const faq = { id: "1", ...input, orderNum: 1 };
    vi.mocked(apiClient.post).mockResolvedValue({ data: faq });
    const result = await createFaq(input);
    expect(apiClient.post).toHaveBeenCalledWith("/admin/faqs", input);
    expect(result).toEqual(faq);
  });

  it("updateFaq puts the faq input", async () => {
    const input = { question: "q2", answer: "a2" };
    const faq = { id: "1", ...input, orderNum: 1 };
    vi.mocked(apiClient.put).mockResolvedValue({ data: faq });
    const result = await updateFaq("1", input);
    expect(apiClient.put).toHaveBeenCalledWith("/admin/faqs/1", input);
    expect(result).toEqual(faq);
  });

  it("deleteFaq deletes the faq", async () => {
    vi.mocked(apiClient.delete).mockResolvedValue({ data: undefined });
    await deleteFaq("1");
    expect(apiClient.delete).toHaveBeenCalledWith("/admin/faqs/1");
  });

  it("moveFaqOrder patches the order direction", async () => {
    const faqs = [{ id: "1", question: "q", answer: "a", orderNum: 2 }];
    vi.mocked(apiClient.patch).mockResolvedValue({ data: faqs });
    const result = await moveFaqOrder("1", "UP");
    expect(apiClient.patch).toHaveBeenCalledWith("/admin/faqs/1/order", {
      direction: "UP",
    });
    expect(result).toEqual(faqs);
  });
});
