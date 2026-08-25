import { useState } from "react";
import { Link } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { Button } from "../../components/ui/button";
import {
  useDeleteNotice,
  useNotices,
  useTogglePinNotice,
} from "../../features/notices/hooks";
import type { Notice } from "../../features/notices/types";

function sortNotices(notices: Notice[]): Notice[] {
  return [...notices].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function NoticesListPage() {
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

  const { data, isLoading, isError } = useNotices();
  const togglePin = useTogglePinNotice();
  const deleteNotice = useDeleteNotice();

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteNotice.mutate(String(deleteTarget.id), {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  const notices = data ? sortNotices(data) : [];

  const columns: DataTableColumn<Notice>[] = [
    {
      key: "title",
      header: "제목",
      render: (notice) => (
        <Link
          to={`/notices/${notice.id}/edit`}
          className="font-medium text-slate-900 hover:underline"
        >
          {notice.pinned && (
            <span className="mr-2 inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
              고정
            </span>
          )}
          {notice.title}
        </Link>
      ),
    },
    {
      key: "createdAt",
      header: "작성일",
      render: (notice) =>
        new Date(notice.createdAt).toLocaleDateString("ko-KR"),
    },
    {
      key: "actions",
      header: "관리",
      render: (notice) => (
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
            onClick={() => togglePin.mutate(String(notice.id))}
            disabled={togglePin.isPending}
          >
            {notice.pinned ? "고정 해제" : "상단 고정"}
          </button>
          <Link
            to={`/notices/${notice.id}/edit`}
            className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
          >
            수정
          </Link>
          <button
            type="button"
            className="rounded border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            onClick={() => setDeleteTarget(notice)}
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
        <h1 className="text-lg font-semibold">공지사항</h1>
        <Link to="/notices/new">
          <Button type="button">공지 작성</Button>
        </Link>
      </div>
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">공지사항을 불러오지 못했습니다.</p>
      )}
      {data && (
        <DataTable
          columns={columns}
          data={notices}
          rowKey={(notice) => String(notice.id)}
        />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="공지사항을 삭제하시겠습니까?"
        description={deleteTarget?.title}
        isLoading={deleteNotice.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
