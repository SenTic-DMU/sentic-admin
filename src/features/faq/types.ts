export type FaqDirection = "UP" | "DOWN";

export interface Faq {
  id: string;
  question: string;
  answer: string;
  orderNum: number;
}

export interface FaqInput {
  question: string;
  answer: string;
}
