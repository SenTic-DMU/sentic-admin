import { apiClient } from "../../lib/apiClient";
import type {
  FetchMembersParams,
  Member,
  MemberListResponse,
  MemberStatus,
} from "./types";

export async function fetchMembers(
  params: FetchMembersParams
): Promise<MemberListResponse> {
  const { data } = await apiClient.get<MemberListResponse>("/admin/members", {
    params: { keyword: params.keyword, page: params.page },
  });
  return data;
}

export async function fetchMember(id: string): Promise<Member> {
  const { data } = await apiClient.get<Member>(`/admin/members/${id}`);
  return data;
}

export async function updateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<Member> {
  const { data } = await apiClient.patch<Member>(
    `/admin/members/${id}/status`,
    { status }
  );
  return data;
}
