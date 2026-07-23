import type { FetchNoticesParams, Notice, NoticeInput, NoticeListResponse } from "./types";

const PAGE_SIZE = 5;

let mockNotices: Notice[] = [
  {
    id: "1",
    title: "서비스 점검 안내",
    content: "7월 25일 새벽 2시부터 4시까지 서버 점검이 진행됩니다.",
    isPinned: true,
    createdAt: "2026-07-10T00:00:00Z",
    updatedAt: "2026-07-10T00:00:00Z",
  },
  {
    id: "2",
    title: "여름 이벤트 오픈",
    content: "학습 목표를 달성하면 뱃지를 드립니다.",
    isPinned: false,
    createdAt: "2026-07-15T00:00:00Z",
    updatedAt: "2026-07-15T00:00:00Z",
  },
  {
    id: "3",
    title: "개인정보처리방침 개정 안내",
    content: "2026년 8월 1일부터 개정된 방침이 적용됩니다.",
    isPinned: false,
    createdAt: "2026-07-18T00:00:00Z",
    updatedAt: "2026-07-18T00:00:00Z",
  },
];

let nextId = 4;

function sortNotices(notices: Notice[]): Notice[] {
  return [...notices].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function mockFetchNotices(
  params: FetchNoticesParams
): Promise<NoticeListResponse> {
  await delay(200);
  const sorted = sortNotices(mockNotices);
  const totalElements = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const start = params.page * PAGE_SIZE;
  const content = sorted.slice(start, start + PAGE_SIZE);
  return { content, totalElements, totalPages };
}

export async function mockFetchNotice(id: string): Promise<Notice> {
  await delay(200);
  const notice = mockNotices.find((n) => n.id === id);
  if (!notice) {
    throw new Error(`Notice not found: ${id}`);
  }
  return notice;
}

export async function mockCreateNotice(input: NoticeInput): Promise<Notice> {
  await delay(200);
  const now = new Date().toISOString();
  const notice: Notice = {
    id: String(nextId++),
    title: input.title,
    content: input.content,
    isPinned: input.isPinned,
    createdAt: now,
    updatedAt: now,
  };
  mockNotices = [notice, ...mockNotices];
  return notice;
}

export async function mockUpdateNotice(
  id: string,
  input: NoticeInput
): Promise<Notice> {
  await delay(200);
  const index = mockNotices.findIndex((n) => n.id === id);
  if (index === -1) {
    throw new Error(`Notice not found: ${id}`);
  }
  const updated: Notice = {
    ...mockNotices[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  mockNotices[index] = updated;
  return updated;
}

export async function mockDeleteNotice(id: string): Promise<void> {
  await delay(200);
  mockNotices = mockNotices.filter((n) => n.id !== id);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
