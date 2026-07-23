import { apiClient } from "../../lib/apiClient";
import {
  mockCreateNotice,
  mockDeleteNotice,
  mockFetchNotice,
  mockFetchNotices,
  mockUpdateNotice,
} from "./mock";
import type {
  FetchNoticesParams,
  Notice,
  NoticeInput,
  NoticeListResponse,
} from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchNotices(
  params: FetchNoticesParams
): Promise<NoticeListResponse> {
  if (USE_MOCK_API) {
    return mockFetchNotices(params);
  }
  const { data } = await apiClient.get<NoticeListResponse>("/admin/notices", {
    params: { page: params.page },
  });
  return data;
}

export async function fetchNotice(id: string): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockFetchNotice(id);
  }
  const { data } = await apiClient.get<Notice>(`/admin/notices/${id}`);
  return data;
}

export async function createNotice(input: NoticeInput): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockCreateNotice(input);
  }
  const { data } = await apiClient.post<Notice>("/admin/notices", input);
  return data;
}

export async function updateNotice(
  id: string,
  input: NoticeInput
): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockUpdateNotice(id, input);
  }
  const { data } = await apiClient.put<Notice>(`/admin/notices/${id}`, input);
  return data;
}

export async function deleteNotice(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDeleteNotice(id);
  }
  await apiClient.delete(`/admin/notices/${id}`);
}
