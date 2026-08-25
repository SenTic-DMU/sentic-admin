import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MemberDetailPage } from "./MemberDetailPage";
import * as memberHooks from "../../features/members/hooks";
import * as paymentHooks from "../../features/payments/hooks";

vi.mock("../../features/members/hooks");
vi.mock("../../features/payments/hooks");

const member = {
  id: 1,
  loginId: "alice",
  email: "a@b.com",
  nickname: "Alice",
  provider: "LOCAL",
  role: "USER",
  createdAt: "2026-01-01T00:00:00Z",
  status: "ACTIVE" as const,
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/members/1"]}>
      <Routes>
        <Route path="/members/:memberId" element={<MemberDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("MemberDetailPage", () => {
  beforeEach(() => {
    vi.mocked(memberHooks.useMember).mockReturnValue({
      data: member,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof memberHooks.useMember>);
    vi.mocked(memberHooks.useUpdateMemberStatus).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof memberHooks.useUpdateMemberStatus>);
    vi.mocked(paymentHooks.useMemberPayments).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof paymentHooks.useMemberPayments>);
  });

  it("renders member details", () => {
    renderPage();
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("LOCAL")).toBeInTheDocument();
    expect(screen.getByText("USER")).toBeInTheDocument();
  });

  it("shows the empty payments message when there is no payment history", () => {
    renderPage();
    expect(screen.getByText("결제 내역이 없습니다.")).toBeInTheDocument();
  });

  it("triggers the status mutation when a new status is selected", async () => {
    const mutate = vi.fn();
    vi.mocked(memberHooks.useUpdateMemberStatus).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof memberHooks.useUpdateMemberStatus>);
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByRole("combobox"), "INACTIVE");
    expect(mutate).toHaveBeenCalledWith({ id: "1", status: "INACTIVE" });
  });
});
