import type { Payment } from "./types";

const mockPaymentsByMember: Record<string, Payment[]> = {
  "1": [
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
  ],
  "2": [
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
  ],
  "4": [
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
  ],
};

export async function mockFetchMemberPayments(memberId: string): Promise<Payment[]> {
  await delay(200);
  return mockPaymentsByMember[memberId] ?? [];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
