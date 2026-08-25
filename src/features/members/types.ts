export type MemberStatus = "ACTIVE" | "INACTIVE" | "BANNED";

export interface Member {
  id: number;
  loginId: string;
  email: string;
  nickname: string;
  provider: string;
  role: string;
  status: MemberStatus;
  createdAt: string;
}

export interface FetchMembersParams {
  keyword: string;
}
