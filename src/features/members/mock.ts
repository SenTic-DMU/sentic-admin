import type {
  FetchMembersParams,
  Member,
  MemberListResponse,
  MemberStatus,
} from "./types";

const PAGE_SIZE = 5;

const mockMembers: Member[] = [
  {
    id: "1",
    email: "alice@sentic.com",
    nickname: "Alice",
    createdAt: "2026-01-05T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: "2",
    email: "bob@sentic.com",
    nickname: "Bob",
    createdAt: "2026-02-10T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: "3",
    email: "carol@sentic.com",
    nickname: "Carol",
    createdAt: "2026-03-01T00:00:00Z",
    status: "INACTIVE",
  },
  {
    id: "4",
    email: "dave@sentic.com",
    nickname: "Dave",
    createdAt: "2026-03-15T00:00:00Z",
    status: "ACTIVE",
  },
  {
    id: "5",
    email: "erin@sentic.com",
    nickname: "Erin",
    createdAt: "2026-04-02T00:00:00Z",
    status: "INACTIVE",
  },
  {
    id: "6",
    email: "frank@sentic.com",
    nickname: "Frank",
    createdAt: "2026-04-20T00:00:00Z",
    status: "ACTIVE",
  },
];

export async function mockFetchMembers(
  params: FetchMembersParams
): Promise<MemberListResponse> {
  await delay(200);
  const keyword = params.keyword.trim().toLowerCase();
  const filtered = keyword
    ? mockMembers.filter(
        (member) =>
          member.email.toLowerCase().includes(keyword) ||
          member.nickname.toLowerCase().includes(keyword)
      )
    : mockMembers;

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const start = params.page * PAGE_SIZE;
  const content = filtered.slice(start, start + PAGE_SIZE);

  return { content, totalElements, totalPages };
}

export async function mockFetchMember(id: string): Promise<Member> {
  await delay(200);
  const member = mockMembers.find((m) => m.id === id);
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
  const index = mockMembers.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error(`Member not found: ${id}`);
  }
  mockMembers[index] = { ...mockMembers[index], status };
  return mockMembers[index];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
