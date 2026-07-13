import { apiClient } from "../../lib/apiClient";
import { mockFetchMember, mockFetchMembers, mockUpdateMemberStatus } from "./mock";
import type {
  FetchMembersParams,
  Member,
  MemberListResponse,
  MemberStatus,
} from "./types";

const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === "true";

export async function fetchMembers(
  params: FetchMembersParams
): Promise<MemberListResponse> {
  if (USE_MOCK_API) {
    return mockFetchMembers(params);
  }
  const { data } = await apiClient.get<MemberListResponse>("/admin/members", {
    params: { keyword: params.keyword, page: params.page },
  });
  return data;
}

export async function fetchMember(id: string): Promise<Member> {
  if (USE_MOCK_API) {
    return mockFetchMember(id);
  }
  const { data } = await apiClient.get<Member>(`/admin/members/${id}`);
  return data;
}

export async function updateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<Member> {
  if (USE_MOCK_API) {
    return mockUpdateMemberStatus(id, status);
  }
  const { data } = await apiClient.patch<Member>(
    `/admin/members/${id}/status`,
    { status }
  );
  return data;
}
