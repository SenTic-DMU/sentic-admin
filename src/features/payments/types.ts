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

export interface PaymentListResponse {
  content: Payment[];
  totalElements: number;
  totalPages: number;
}

export interface FetchPaymentsParams {
  status?: PaymentStatus;
  memberId?: string;
  page: number;
}
