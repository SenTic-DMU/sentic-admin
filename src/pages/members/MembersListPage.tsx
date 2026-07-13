import { Link, useSearchParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { Pagination } from "../../components/common/Pagination";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useMembers, useUpdateMemberStatus } from "../../features/members/hooks";
import type { Member } from "../../features/members/types";

function parsePage(raw: string | null): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
}

export function MembersListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";
  const page = parsePage(searchParams.get("page"));

  const { data, isLoading, isError } = useMembers(keyword, page);
  const updateStatus = useUpdateMemberStatus();

  function handleKeywordChange(nextKeyword: string) {
    setSearchParams({ keyword: nextKeyword, page: "0" });
  }

  function handlePageChange(nextPage: number) {
    setSearchParams({ keyword, page: String(nextPage) });
  }

  function handleToggleStatus(member: Member) {
    const nextStatus = member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    updateStatus.mutate({ id: member.id, status: nextStatus });
  }

  const columns: DataTableColumn<Member>[] = [
    {
      key: "email",
      header: "이메일",
      render: (member) => (
        <Link
          to={`/members/${member.id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {member.email}
        </Link>
      ),
    },
    { key: "nickname", header: "닉네임", render: (member) => member.nickname },
    {
      key: "createdAt",
      header: "가입일",
      render: (member) => new Date(member.createdAt).toLocaleDateString("ko-KR"),
    },
    {
      key: "status",
      header: "상태",
      render: (member) => <StatusBadge status={member.status} kind="member" />,
    },
    {
      key: "actions",
      header: "관리",
      render: (member) => (
        <button
          type="button"
          className="rounded border px-2 py-1 text-xs hover:bg-slate-100"
          onClick={() => handleToggleStatus(member)}
          disabled={updateStatus.isPending}
        >
          {member.status === "ACTIVE" ? "비활성으로 전환" : "활성으로 전환"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">회원관리</h1>
      <SearchInput
        value={keyword}
        onChange={handleKeywordChange}
        placeholder="이메일 또는 닉네임 검색"
      />
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">회원 목록을 불러오지 못했습니다.</p>
      )}
      {data && (
        <>
          <DataTable
            columns={columns}
            data={data.content}
            rowKey={(member) => member.id}
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
