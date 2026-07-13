export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface Payment {
  id: string;
  memberId: string;
  memberEmail: string;
  memberNickname: string;
  amount: number;
  planName: string;
  status: PaymentStatus;
  paidAt: string;
}
