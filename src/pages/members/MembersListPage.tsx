import { Link, useSearchParams } from "react-router-dom";
import {
  DataTable,
  type DataTableColumn,
} from "../../components/common/DataTable";
import { SearchInput } from "../../components/common/SearchInput";
import { StatusBadge } from "../../components/common/StatusBadge";
import { useMembers, useUpdateMemberStatus } from "../../features/members/hooks";
import type { Member, MemberStatus } from "../../features/members/types";

const STATUS_OPTIONS: MemberStatus[] = ["ACTIVE", "INACTIVE", "BANNED"];

export function MembersListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get("keyword") ?? "";

  const { data, isLoading, isError } = useMembers(keyword);
  const updateStatus = useUpdateMemberStatus();

  function handleKeywordChange(nextKeyword: string) {
    setSearchParams(nextKeyword ? { keyword: nextKeyword } : {});
  }

  function handleStatusChange(member: Member, nextStatus: MemberStatus) {
    updateStatus.mutate({ id: String(member.id), status: nextStatus });
  }

  const columns: DataTableColumn<Member>[] = [
    {
      key: "loginId",
      header: "아이디",
      render: (member) => (
        <Link
          to={`/members/${member.id}`}
          className="font-medium text-slate-900 hover:underline"
        >
          {member.loginId}
        </Link>
      ),
    },
    { key: "email", header: "이메일", render: (member) => member.email },
    { key: "nickname", header: "닉네임", render: (member) => member.nickname },
    { key: "provider", header: "가입경로", render: (member) => member.provider },
    {
      key: "createdAt",
      header: "가입일",
      render: (member) => new Date(member.createdAt).toLocaleDateString("ko-KR"),
    },
    {
      key: "status",
      header: "상태",
      render: (member) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={member.status} kind="member" />
          <select
            className="rounded border border-slate-300 px-2 py-1 text-xs"
            value={member.status}
            disabled={updateStatus.isPending}
            onChange={(e) =>
              handleStatusChange(member, e.target.value as MemberStatus)
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">회원관리</h1>
      <SearchInput
        value={keyword}
        onChange={handleKeywordChange}
        placeholder="아이디, 이메일 또는 닉네임 검색"
      />
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {isError && (
        <p className="text-sm text-red-600">회원 목록을 불러오지 못했습니다.</p>
      )}
      {data && (
        <DataTable columns={columns} data={data} rowKey={(member) => member.id} />
      )}
    </div>
  );
}
