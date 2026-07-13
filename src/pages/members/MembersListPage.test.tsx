import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { MembersListPage } from "./MembersListPage";
import * as hooks from "../../features/members/hooks";

vi.mock("../../features/members/hooks");

const member = {
  id: "1",
  email: "a@b.com",
  nickname: "Alice",
  createdAt: "2026-01-01T00:00:00Z",
  status: "ACTIVE" as const,
};

describe("MembersListPage", () => {
  beforeEach(() => {
    vi.mocked(hooks.useMembers).mockReturnValue({
      data: { content: [member], totalElements: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof hooks.useMembers>);
    vi.mocked(hooks.useUpdateMemberStatus).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateMemberStatus>);
  });

  it("renders the member list", () => {
    render(
      <MemoryRouter>
        <MembersListPage />
      </MemoryRouter>
    );
    expect(screen.getByText("a@b.com")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("triggers the status mutation when the toggle button is clicked", async () => {
    const mutate = vi.fn();
    vi.mocked(hooks.useUpdateMemberStatus).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateMemberStatus>);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <MembersListPage />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("button", { name: "비활성으로 전환" }));
    expect(mutate).toHaveBeenCalledWith({ id: "1", status: "INACTIVE" });
  });

  it("falls back to page 0 when the page query param is invalid", () => {
    render(
      <MemoryRouter initialEntries={["/members?page=abc"]}>
        <Routes>
          <Route path="/members" element={<MembersListPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(hooks.useMembers).toHaveBeenLastCalledWith("", 0);
  });
});
