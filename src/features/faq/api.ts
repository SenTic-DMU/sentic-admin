import { apiClient } from "../../lib/apiClient";
import {
  mockCreateFaq,
  mockDeleteFaq,
  mockFetchFaqs,
  mockMoveFaqOrder,
  mockUpdateFaq,
} from "./mock";
import type { Faq, FaqDirection, FaqInput } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchFaqs(): Promise<Faq[]> {
  if (USE_MOCK_API) {
    return mockFetchFaqs();
  }
  const { data } = await apiClient.get<Faq[]>("/admin/faqs");
  return data;
}

export async function fetchFaq(id: string): Promise<Faq> {
  const faqs = await fetchFaqs();
  const faq = faqs.find((f) => f.id === id);
  if (!faq) {
    throw new Error(`Faq not found: ${id}`);
  }
  return faq;
}

export async function createFaq(input: FaqInput): Promise<Faq> {
  if (USE_MOCK_API) {
    return mockCreateFaq(input);
  }
  const { data } = await apiClient.post<Faq>("/admin/faqs", input);
  return data;
}

export async function updateFaq(id: string, input: FaqInput): Promise<Faq> {
  if (USE_MOCK_API) {
    return mockUpdateFaq(id, input);
  }
  const { data } = await apiClient.put<Faq>(`/admin/faqs/${id}`, input);
  return data;
}

export async function deleteFaq(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDeleteFaq(id);
  }
  await apiClient.delete(`/admin/faqs/${id}`);
}

export async function moveFaqOrder(
  id: string,
  direction: FaqDirection
): Promise<Faq[]> {
  if (USE_MOCK_API) {
    return mockMoveFaqOrder(id, direction);
  }
  const { data } = await apiClient.patch<Faq[]>(`/admin/faqs/${id}/order`, {
    direction,
  });
  return data;
}
