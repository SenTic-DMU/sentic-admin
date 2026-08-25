import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PaymentsListPage } from "./PaymentsListPage";
import * as hooks from "../../features/payments/hooks";

vi.mock("../../features/payments/hooks");

const payment = {
  id: 1,
  userId: 1,
  planId: 1,
  amount: 9900,
  status: "SUCCESS" as const,
  paymentMethod: "CARD",
  paidAt: "2026-01-06T00:00:00Z",
  expiresAt: "2026-02-06T00:00:00Z",
  createdAt: "2026-01-06T00:00:00Z",
};

function renderPage(initialEntry = "/payments") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/payments" element={<PaymentsListPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PaymentsListPage", () => {
  beforeEach(() => {
    vi.mocked(hooks.usePayments).mockReturnValue({
      data: [payment],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof hooks.usePayments>);
  });

  it("renders the payment list", () => {
    renderPage();
    expect(screen.getByText("회원 #1")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("requests payments with the status parsed from the query string", () => {
    renderPage("/payments?status=SUCCESS");
    expect(hooks.usePayments).toHaveBeenLastCalledWith("SUCCESS", undefined);
  });

  it("requests payments filtered by memberId from the query string", () => {
    renderPage("/payments?memberId=1");
    expect(hooks.usePayments).toHaveBeenLastCalledWith(undefined, "1");
    expect(screen.getByText("회원 ID: 1 로 필터링 중")).toBeInTheDocument();
  });

  it("updates the status filter when a new option is selected", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.selectOptions(screen.getByRole("combobox"), "PENDING");
    expect(hooks.usePayments).toHaveBeenLastCalledWith("PENDING", undefined);
  });

  it("clears the member filter when the clear button is clicked", async () => {
    const user = userEvent.setup();
    renderPage("/payments?memberId=1");
    await user.click(screen.getByRole("button", { name: "필터 해제" }));
    expect(hooks.usePayments).toHaveBeenLastCalledWith(undefined, undefined);
  });
});
