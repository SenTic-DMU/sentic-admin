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
  const { data } = await apiClient.get<Faq[]>("/api/admin/faq");
  return data;
}

export async function fetchFaq(id: string): Promise<Faq> {
  const faqs = await fetchFaqs();
  const faq = faqs.find((f) => String(f.id) === id);
  if (!faq) {
    throw new Error(`Faq not found: ${id}`);
  }
  return faq;
}

export async function createFaq(input: FaqInput): Promise<Faq> {
  if (USE_MOCK_API) {
    return mockCreateFaq(input);
  }
  const { data } = await apiClient.post<Faq>("/api/admin/faq", input);
  return data;
}

export async function updateFaq(id: string, input: FaqInput): Promise<Faq> {
  if (USE_MOCK_API) {
    return mockUpdateFaq(id, input);
  }
  const { data } = await apiClient.put<Faq>(`/api/admin/faq/${id}`, input);
  return data;
}

export async function deleteFaq(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDeleteFaq(id);
  }
  await apiClient.delete(`/api/admin/faq/${id}`);
}

export async function setFaqOrder(id: string, orderNum: number): Promise<Faq> {
  const { data } = await apiClient.put<Faq>(`/api/admin/faq/${id}/order`, {
    orderNum,
  });
  return data;
}

export async function moveFaqOrder(
  id: string,
  direction: FaqDirection
): Promise<Faq[]> {
  if (USE_MOCK_API) {
    return mockMoveFaqOrder(id, direction);
  }
  const faqs = (await fetchFaqs()).sort((a, b) => a.orderNum - b.orderNum);
  const index = faqs.findIndex((f) => String(f.id) === id);
  if (index === -1) {
    throw new Error(`Faq not found: ${id}`);
  }
  const targetIndex = direction === "UP" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= faqs.length) {
    return [faqs[index]];
  }
  const current = faqs[index];
  const target = faqs[targetIndex];
  const [updatedCurrent, updatedTarget] = await Promise.all([
    setFaqOrder(String(current.id), target.orderNum),
    setFaqOrder(String(target.id), current.orderNum),
  ]);
  return [updatedCurrent, updatedTarget];
}
