import { apiClient } from "../../lib/apiClient";
import { mockFetchMember, mockFetchMembers, mockUpdateMemberStatus } from "./mock";
import type { FetchMembersParams, Member, MemberStatus } from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchMembers(
  params: FetchMembersParams
): Promise<Member[]> {
  if (USE_MOCK_API) {
    return mockFetchMembers(params);
  }
  const { data } = await apiClient.get<Member[]>("/api/admin/users", {
    params: { keyword: params.keyword },
  });
  return data;
}

export async function fetchMember(id: string): Promise<Member> {
  if (USE_MOCK_API) {
    return mockFetchMember(id);
  }
  const { data } = await apiClient.get<Member>(`/api/admin/users/${id}`);
  return data;
}

export async function updateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<Member> {
  if (USE_MOCK_API) {
    return mockUpdateMemberStatus(id, status);
  }
  const { data } = await apiClient.put<Member>(
    `/api/admin/users/${id}/status`,
    { status }
  );
  return data;
}
