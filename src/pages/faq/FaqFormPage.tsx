import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { useCreateFaq, useFaqs, useUpdateFaq } from "../../features/faq/hooks";

export function FaqFormPage() {
  const { faqId } = useParams<{ faqId: string }>();
  const isEditMode = Boolean(faqId);
  const navigate = useNavigate();

  const { data: faqs, isLoading } = useFaqs();
  const faq = faqs?.find((f) => f.id === faqId);
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question);
      setAnswer(faq.answer);
    }
  }, [faq]);

  const isSaving = createFaq.isPending || updateFaq.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = { question, answer };
    if (isEditMode && faqId) {
      updateFaq.mutate(
        { id: faqId, input },
        { onSuccess: () => navigate("/faq") }
      );
    } else {
      createFaq.mutate(input, { onSuccess: () => navigate("/faq") });
    }
  }

  if (isEditMode && isLoading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="max-w-xl space-y-4">
      <Link to="/faq" className="text-sm text-slate-500 hover:underline">
        ← FAQ 목록으로
      </Link>
      <h1 className="text-lg font-semibold">
        {isEditMode ? "FAQ 수정" : "FAQ 작성"}
      </h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="faq-question"
          >
            질문
          </label>
          <textarea
            id="faq-question"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            rows={2}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="faq-answer"
          >
            답변
          </label>
          <textarea
            id="faq-answer"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            rows={6}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving}>
            {isEditMode ? "수정" : "작성"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/faq")}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
