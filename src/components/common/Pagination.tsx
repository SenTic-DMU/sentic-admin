interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        type="button"
        className="rounded border px-3 py-1 text-sm disabled:opacity-40"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </button>
      <span className="text-sm text-slate-600">
        {page + 1} / {totalPages}
      </span>
      <button
        type="button"
        className="rounded border px-3 py-1 text-sm disabled:opacity-40"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </button>
    </div>
  );
}
