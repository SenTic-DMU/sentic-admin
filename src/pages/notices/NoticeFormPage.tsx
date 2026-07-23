import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  useCreateNotice,
  useNotice,
  useUpdateNotice,
} from "../../features/notices/hooks";

export function NoticeFormPage() {
  const { noticeId } = useParams<{ noticeId: string }>();
  const isEditMode = Boolean(noticeId);
  const navigate = useNavigate();

  const { data: notice, isLoading } = useNotice(noticeId ?? "");
  const createNotice = useCreateNotice();
  const updateNotice = useUpdateNotice();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
      setIsPinned(notice.isPinned);
    }
  }, [notice]);

  const isSaving = createNotice.isPending || updateNotice.isPending;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const input = { title, content, isPinned };
    if (isEditMode && noticeId) {
      updateNotice.mutate(
        { id: noticeId, input },
        { onSuccess: () => navigate("/notices") }
      );
    } else {
      createNotice.mutate(input, {
        onSuccess: () => navigate("/notices"),
      });
    }
  }

  if (isEditMode && isLoading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="max-w-xl space-y-4">
      <Link to="/notices" className="text-sm text-slate-500 hover:underline">
        ← 공지사항 목록으로
      </Link>
      <h1 className="text-lg font-semibold">
        {isEditMode ? "공지 수정" : "공지 작성"}
      </h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="notice-title"
          >
            제목
          </label>
          <Input
            id="notice-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="notice-content"
          >
            내용
          </label>
          <textarea
            id="notice-content"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            rows={8}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
          상단 고정
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving}>
            {isEditMode ? "수정" : "작성"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/notices")}
          >
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}
