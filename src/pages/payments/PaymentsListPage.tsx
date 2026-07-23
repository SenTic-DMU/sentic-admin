import { Link, useSearchParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { Pagination } from "../../components/common/Pagination";
import { StatusBadge } from "../../components/common/StatusBadge";
import { usePayments } from "../../features/payments/hooks";
import type { Payment, PaymentStatus } from "../../features/payments/types";

const STATUS_OPTIONS: { value: PaymentStatus | ""; label: string }[] = [
  { value: "", label: "전체" },
  { value: "PENDING", label: "대기" },
  { value: "SUCCESS", label: "성공" },
  { value: "FAILED", label: "실패" },
  { value: "CANCELLED", label: "취소" },
];

function parsePage(raw: string | null): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

function parseStatus(raw: string | null): PaymentStatus | undefined {
  return raw === "PENDING" ||
    raw === "SUCCESS" ||
    raw === "FAILED" ||
    raw === "CANCELLED"
    ? raw
    : undefined;
}

export function PaymentsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const status = parseStatus(searchParams.get("status"));
  const memberId = searchParams.get("memberId") ?? undefined;
  const page = parsePage(searchParams.get("page"));

  const { data, isLoading, isError } = usePayments(status, memberId, page);

  function handleStatusChange(nextStatus: string) {
    const next: Record<string, string> = { page: "0" };
    if (nextStatus) next.status = nextStatus;
    if (memberId) next.memberId = memberId;
    setSearchParams(next);
  }

  function handlePageChange(nextPage: number) {
    const next: Record<string, string> = { page: String(nextPage) };
    if (status) next.status = status;
    if (memberId) next.memberId = memberId;
    setSearchParams(next);
  }

  function clearMemberFilter() {
    const next: Record<string, string> = { page: "0" };
    if (status) next.status = status;
    setSearchParams(next);
  }

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "member",
      header: "회원",
      render: (payment) => (
        <Link
          to={`/members/${payment.memberId}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {payment.memberNickname} ({payment.memberEmail})
        </Link>
      ),
    },
    { key: "planName", header: "등급", render: (payment) => payment.planName },
    {
      key: "amount",
      header: "금액",
      render: (payment) => `${payment.amount.toLocaleString("ko-KR")}원`,
    },
    {
      key: "status",
      header: "상태",
      render: (payment) => <StatusBadge status={payment.status} kind="payment" />,
    },
    {
      key: "paidAt",
      header: "결제일",
      render: (payment) => new Date(payment.paidAt).toLocaleDateString("ko-KR"),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">결제 내역</h1>
      <div className="flex items-center gap-3">
        <select
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          value={status ?? ""}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {memberId && (
          <span className="flex items-center gap-2 text-sm text-slate-600">
            회원 ID: {memberId} 로 필터링 중
            <button
              type="button"
              className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
              onClick={clearMemberFilter}
            >
              필터 해제
            </button>
          </span>
        )}
      </div>
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">결제 내역을 불러오지 못했습니다.</p>
      )}
      {data && (
        <>
          <DataTable
            columns={columns}
            data={data.content}
            rowKey={(payment) => payment.id}
            emptyMessage="결제 내역이 없습니다."
          />
          <Pagination
            page={page}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}
