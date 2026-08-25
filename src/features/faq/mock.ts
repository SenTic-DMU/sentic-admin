import type { Faq, FaqDirection, FaqInput } from "./types";

let mockFaqs: Faq[] = [
  {
    id: 1,
    question: "회원가입은 어떻게 하나요?",
    answer: "앱 실행 후 이메일 또는 소셜 계정으로 가입할 수 있습니다.",
    orderNum: 1,
  },
  {
    id: 2,
    question: "구독은 어떻게 취소하나요?",
    answer: "마이페이지 > 구독 관리에서 언제든 해지할 수 있습니다.",
    orderNum: 2,
  },
  {
    id: 3,
    question: "학습 데이터는 어떻게 저장되나요?",
    answer: "대화 기록은 암호화되어 서버에 저장됩니다.",
    orderNum: 3,
  },
];

let nextId = 4;

function sortFaqs(faqs: Faq[]): Faq[] {
  return [...faqs].sort((a, b) => a.orderNum - b.orderNum);
}

export async function mockFetchFaqs(): Promise<Faq[]> {
  await delay(200);
  return sortFaqs(mockFaqs);
}

export async function mockCreateFaq(input: FaqInput): Promise<Faq> {
  await delay(200);
  const maxOrderNum = mockFaqs.reduce((max, f) => Math.max(max, f.orderNum), 0);
  const faq: Faq = {
    id: nextId++,
    question: input.question,
    answer: input.answer,
    orderNum: maxOrderNum + 1,
  };
  mockFaqs = [...mockFaqs, faq];
  return faq;
}

export async function mockUpdateFaq(id: string, input: FaqInput): Promise<Faq> {
  await delay(200);
  const index = mockFaqs.findIndex((f) => String(f.id) === id);
  if (index === -1) {
    throw new Error(`Faq not found: ${id}`);
  }
  const updated: Faq = { ...mockFaqs[index], ...input };
  mockFaqs[index] = updated;
  return updated;
}

export async function mockDeleteFaq(id: string): Promise<void> {
  await delay(200);
  mockFaqs = mockFaqs.filter((f) => String(f.id) !== id);
}

export async function mockMoveFaqOrder(
  id: string,
  direction: FaqDirection
): Promise<Faq[]> {
  await delay(200);
  const sorted = sortFaqs(mockFaqs);
  const index = sorted.findIndex((f) => String(f.id) === id);
  if (index === -1) {
    throw new Error(`Faq not found: ${id}`);
  }
  const targetIndex = direction === "UP" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= sorted.length) {
    return [sorted[index]];
  }

  const current = sorted[index];
  const target = sorted[targetIndex];
  const swappedCurrent = { ...current, orderNum: target.orderNum };
  const swappedTarget = { ...target, orderNum: current.orderNum };

  mockFaqs = mockFaqs.map((f) => {
    if (f.id === swappedCurrent.id) return swappedCurrent;
    if (f.id === swappedTarget.id) return swappedTarget;
    return f;
  });

  return [swappedCurrent, swappedTarget];
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
