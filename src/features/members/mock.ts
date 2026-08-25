import type { FetchMembersParams, Member, MemberStatus } from "./types";

const mockMembers: Member[] = [
  {
    id: 1,
    loginId: "alice",
    email: "alice@sentic.com",
    nickname: "Alice",
    provider: "LOCAL",
    role: "USER",
    createdAt: "2026-01-05T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: 2,
    loginId: "bob",
    email: "bob@sentic.com",
    nickname: "Bob",
    provider: "GOOGLE",
    role: "USER",
    createdAt: "2026-02-10T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: 3,
    loginId: "carol",
    email: "carol@sentic.com",
    nickname: "Carol",
    provider: "LOCAL",
    role: "USER",
    createdAt: "2026-03-01T00:00:00Z",
    status: "INACTIVE",
  },
  {
    id: 4,
    loginId: "dave",
    email: "dave@sentic.com",
    nickname: "Dave",
    provider: "KAKAO",
    role: "USER",
    createdAt: "2026-03-15T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: 5,
    loginId: "erin",
    email: "erin@sentic.com",
    nickname: "Erin",
    provider: "LOCAL",
    role: "USER",
    createdAt: "2026-04-02T00:00:00Z",
    status: "BANNED",
  },
  {
    id: 6,
    loginId: "frank",
    email: "frank@sentic.com",
    nickname: "Frank",
    provider: "LOCAL",
    role: "USER",
    createdAt: "2026-04-20T00:00:00Z",
    status: "ACTIVE",
  },
];

export async function mockFetchMembers(
  params: FetchMembersParams
): Promise<Member[]> {
  await delay(200);
  const keyword = params.keyword.trim().toLowerCase();
  if (!keyword) return mockMembers;
  return mockMembers.filter(
    (member) =>
      member.email.toLowerCase().includes(keyword) ||
      member.nickname.toLowerCase().includes(keyword) ||
      member.loginId.toLowerCase().includes(keyword)
  );
}

export async function mockFetchMember(id: string): Promise<Member> {
  await delay(200);
  const member = mockMembers.find((m) => String(m.id) === id);
  if (!member) {
    throw new Error(`Member not found: ${id}`);
  }
  return member;
}

export async function mockUpdateMemberStatus(
  id: string,
  status: MemberStatus
): Promise<Member> {
  await delay(200);
  const index = mockMembers.findIndex((m) => String(m.id) === id);
  if (index === -1) {
    throw new Error(`Member not found: ${id}`);
  }
  mockMembers[index] = { ...mockMembers[index], status };
  return mockMembers[index];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
