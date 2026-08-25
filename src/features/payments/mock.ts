import type { FetchPaymentsParams, Payment } from "./types";

const mockPayments: Payment[] = [
  {
    id: 1,
    userId: 1,
    planId: 1,
    amount: 9900,
    status: "SUCCESS",
    paymentMethod: "CARD",
    paidAt: "2026-01-06T00:00:00Z",
    expiresAt: "2026-02-06T00:00:00Z",
    createdAt: "2026-01-06T00:00:00Z",
  },
  {
    id: 2,
    userId: 2,
    planId: 1,
    amount: 9900,
    status: "PENDING",
    paymentMethod: "CARD",
    paidAt: "2026-02-11T00:00:00Z",
    expiresAt: "2026-03-11T00:00:00Z",
    createdAt: "2026-02-11T00:00:00Z",
  },
  {
    id: 3,
    userId: 4,
    planId: 2,
    amount: 19900,
    status: "FAILED",
    paymentMethod: "CARD",
    paidAt: "2026-03-16T00:00:00Z",
    expiresAt: "2026-04-16T00:00:00Z",
    createdAt: "2026-03-16T00:00:00Z",
  },
  {
    id: 4,
    userId: 4,
    planId: 2,
    amount: 19900,
    status: "SUCCESS",
    paymentMethod: "CARD",
    paidAt: "2026-03-17T00:00:00Z",
    expiresAt: "2026-04-17T00:00:00Z",
    createdAt: "2026-03-17T00:00:00Z",
  },
  {
    id: 5,
    userId: 6,
    planId: 1,
    amount: 9900,
    status: "CANCELLED",
    paymentMethod: "CARD",
    paidAt: "2026-04-21T00:00:00Z",
    expiresAt: "2026-05-21T00:00:00Z",
    createdAt: "2026-04-21T00:00:00Z",
  },
];

export async function mockFetchPayments(
  params: FetchPaymentsParams
): Promise<Payment[]> {
  await delay(200);
  const filtered = params.status
    ? mockPayments.filter((payment) => payment.status === params.status)
    : mockPayments;
  return [...filtered].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  );
}

export async function mockFetchMemberPayments(userId: string): Promise<Payment[]> {
  await delay(200);
  return mockPayments.filter((payment) => String(payment.userId) === userId);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
