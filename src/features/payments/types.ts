export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface Payment {
  id: number;
  userId: number;
  planId: number;
  amount: number;
  status: PaymentStatus;
  paymentMethod: string;
  paidAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface FetchPaymentsParams {
  status?: PaymentStatus;
}
