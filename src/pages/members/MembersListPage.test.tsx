import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { MembersListPage } from "./MembersListPage";
import * as hooks from "../../features/members/hooks";

vi.mock("../../features/members/hooks");

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

describe("MembersListPage", () => {
  beforeEach(() => {
    vi.mocked(hooks.useMembers).mockReturnValue({
      data: [member],
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
    expect(screen.getByText("LOCAL")).toBeInTheDocument();
  });

  it("triggers the status mutation when a new status is selected", async () => {
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
    await user.selectOptions(screen.getByRole("combobox"), "INACTIVE");
    expect(mutate).toHaveBeenCalledWith({ id: "1", status: "INACTIVE" });
  });

  it("requests members with the keyword query param", () => {
    render(
      <MemoryRouter initialEntries={["/members?keyword=alice"]}>
        <MembersListPage />
      </MemoryRouter>
    );
    expect(hooks.useMembers).toHaveBeenLastCalledWith("alice");
  });
});
