import type { FetchPaymentsParams, Payment, PaymentListResponse } from "./types";

const PAGE_SIZE = 5;

const mockPayments: Payment[] = [
  {
    id: "p1",
    memberId: "1",
    memberEmail: "alice@sentic.com",
    memberNickname: "Alice",
    amount: 9900,
    planName: "Premium",
    status: "SUCCESS",
    paidAt: "2026-01-06T00:00:00Z",
  },
  {
    id: "p2",
    memberId: "2",
    memberEmail: "bob@sentic.com",
    memberNickname: "Bob",
    amount: 9900,
    planName: "Premium",
    status: "PENDING",
    paidAt: "2026-02-11T00:00:00Z",
  },
  {
    id: "p3",
    memberId: "4",
    memberEmail: "dave@sentic.com",
    memberNickname: "Dave",
    amount: 19900,
    planName: "Premium Plus",
    status: "FAILED",
    paidAt: "2026-03-16T00:00:00Z",
  },
  {
    id: "p4",
    memberId: "4",
    memberEmail: "dave@sentic.com",
    memberNickname: "Dave",
    amount: 19900,
    planName: "Premium Plus",
    status: "SUCCESS",
    paidAt: "2026-03-17T00:00:00Z",
  },
  {
    id: "p5",
    memberId: "6",
    memberEmail: "frank@sentic.com",
    memberNickname: "Frank",
    amount: 9900,
    planName: "Premium",
    status: "CANCELLED",
    paidAt: "2026-04-21T00:00:00Z",
  },
];

export async function mockFetchPayments(
  params: FetchPaymentsParams
): Promise<PaymentListResponse> {
  await delay(200);
  const filtered = mockPayments.filter((payment) => {
    if (params.status && payment.status !== params.status) return false;
    if (params.memberId && payment.memberId !== params.memberId) return false;
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  );

  const totalElements = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE));
  const start = params.page * PAGE_SIZE;
  const content = sorted.slice(start, start + PAGE_SIZE);

  return { content, totalElements, totalPages };
}

export async function mockFetchMemberPayments(memberId: string): Promise<Payment[]> {
  await delay(200);
  return mockPayments.filter((payment) => payment.memberId === memberId);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
