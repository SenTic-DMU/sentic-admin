import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../components/ui/button";
import {
  useDeleteFaq,
  useFaqs,
  useMoveFaqOrder,
} from "../../features/faq/hooks";
import type { Faq } from "../../features/faq/types";

export function FaqListPage() {
  const [deleteTarget, setDeleteTarget] = useState<Faq | null>(null);

  const { data, isLoading, isError } = useFaqs();
  const moveFaqOrder = useMoveFaqOrder();
  const deleteFaq = useDeleteFaq();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteFaq.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  const faqs = data ?? [];

  const columns: DataTableColumn<Faq>[] = [
    {
      key: "order",
      header: "순서",
      render: (faq) => {
        const index = faqs.findIndex((f) => f.id === faq.id);
        return (
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"
              disabled={index <= 0 || moveFaqOrder.isPending}
              onClick={() => moveFaqOrder.mutate({ id: faq.id, direction: "UP" })}
            >
              ↑
            </button>
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-40"
              disabled={index >= faqs.length - 1 || moveFaqOrder.isPending}
              onClick={() =>
                moveFaqOrder.mutate({ id: faq.id, direction: "DOWN" })
              }
            >
              ↓
            </button>
          </div>
        );
      },
    },
    {
      key: "question",
      header: "질문",
      render: (faq) => (
        <Link
          to={`/faq/${faq.id}/edit`}
          className="font-medium text-slate-900 hover:underline"
        >
          {faq.question}
        </Link>
      ),
    },
    {
      key: "actions",
      header: "관리",
      render: (faq) => (
        <div className="flex gap-2">
          <Link
            to={`/faq/${faq.id}/edit`}
            className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
          >
            수정
          </Link>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            onClick={() => setDeleteTarget(faq)}
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">FAQ 관리</h1>
        <Link to="/faq/new">
          <Button type="button">FAQ 작성</Button>
        </Link>
      </div>
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">FAQ 목록을 불러오지 못했습니다.</p>
      )}
      {data && (
        <DataTable columns={columns} data={faqs} rowKey={(faq) => faq.id} />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="FAQ를 삭제하시겠습니까?"
        description={deleteTarget?.question}
        isLoading={deleteFaq.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
