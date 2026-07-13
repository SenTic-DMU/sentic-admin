import { Link, useParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useMember, useUpdateMemberStatus } from "../../features/members/hooks";
import { useMemberPayments } from "../../features/payments/hooks";
import type { Payment } from "../../features/payments/types";

export function MemberDetailPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const id = memberId ?? "";

  const { data: member, isLoading, isError } = useMember(id);
  const { data: payments } = useMemberPayments(id);
  const updateStatus = useUpdateMemberStatus();

  function handleToggleStatus() {
    if (!member) return;
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateStatus.mutate({ id: member.id, status: nextStatus });
  }

  const paymentColumns: DataTableColumn<Payment>[] = [
    { key: "planName", header: "플랜", render: (payment) => payment.planName },
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

  if (isLoading) {
    return <p className="text-sm text-slate-500">불러오는 중...</p>;
  }

  if (isError || !member) {
    return <p className="text-sm text-red-600">회원 정보를 불러오지 못했습니다.</p>;
  }

  return (
    <div className="space-y-6">
      <Link to="/members" className="text-sm text-slate-500 hover:underline">
        ← 회원 목록으로
      </Link>
      <h1 className="text-lg font-semibold">회원 상세</h1>
      <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
        <dt className="text-slate-500">이메일</dt>
        <dd>{member.email}</dd>
        <dt className="text-slate-500">닉네임</dt>
        <dd>{member.nickname}</dd>
        <dt className="text-slate-500">가입일</dt>
        <dd>{new Date(member.createdAt).toLocaleDateString("ko-KR")}</dd>
        <dt className="text-slate-500">상태</dt>
        <dd>
          <StatusBadge status={member.status} kind="member" />
        </dd>
      </dl>
      <button
        type="button"
        className="rounded border px-3 py-1.5 text-sm hover:bg-slate-100"
        onClick={handleToggleStatus}
        disabled={updateStatus.isPending}
      >
        {member.status === "ACTIVE" ? "비활성으로 전환" : "활성으로 전환"}
      </button>

      <section className="space-y-2">
        <h2 className="text-base font-semibold">결제 내역</h2>
        <DataTable
          columns={paymentColumns}
          data={payments ?? []}
          rowKey={(payment) => payment.id}
          emptyMessage="결제 내역이 없습니다."
        />
      </section>
    </div>
  );
}
