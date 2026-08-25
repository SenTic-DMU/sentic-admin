import { apiClient } from "../../lib/apiClient";
import {
  mockCreateNotice,
  mockDeleteNotice,
  mockFetchNotice,
  mockFetchNotices,
  mockTogglePinNotice,
  mockUpdateNotice,
} from "./mock";
import type { Notice, NoticeInput } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchNotices(): Promise<Notice[]> {
  if (USE_MOCK_API) {
    return mockFetchNotices();
  }
  const { data } = await apiClient.get<Notice[]>("/api/admin/announcements");
  return data;
}

export async function fetchNotice(id: string): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockFetchNotice(id);
  }
  const { data } = await apiClient.get<Notice>(
    `/api/admin/announcements/${id}`
  );
  return data;
}

export async function createNotice(input: NoticeInput): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockCreateNotice(input);
  }
  const { data } = await apiClient.post<Notice>(
    "/api/admin/announcements",
    input
  );
  return data;
}

export async function updateNotice(
  id: string,
  input: NoticeInput
): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockUpdateNotice(id, input);
  }
  const { data } = await apiClient.put<Notice>(
    `/api/admin/announcements/${id}`,
    input
  );
  return data;
}

export async function deleteNotice(id: string): Promise<void> {
  if (USE_MOCK_API) {
    return mockDeleteNotice(id);
  }
  await apiClient.delete(`/api/admin/announcements/${id}`);
}

export async function togglePinNotice(id: string): Promise<Notice> {
  if (USE_MOCK_API) {
    return mockTogglePinNotice(id);
  }
  const { data } = await apiClient.put<Notice>(
    `/api/admin/announcements/${id}/pin`
  );
  return data;
}
