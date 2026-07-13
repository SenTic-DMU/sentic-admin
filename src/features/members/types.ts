export type MemberStatus = "ACTIVE" | "INACTIVE";

export interface Member {
  id: string;
  email: string;
  nickname: string;
  createdAt: string;
  status: MemberStatus;
}

export interface MemberListResponse {
  content: Member[];
  totalElements: number;
  totalPages: number;
}

export interface FetchMembersParams {
  keyword: string;
  page: number;
}
