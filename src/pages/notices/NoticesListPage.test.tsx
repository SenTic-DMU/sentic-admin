import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { NoticesListPage } from "./NoticesListPage";
import * as hooks from "../../features/notices/hooks";

vi.mock("../../features/notices/hooks");

const notice = {
  id: "1",
  title: "공지 제목",
  content: "공지 내용",
  isPinned: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

describe("NoticesListPage", () => {
  beforeEach(() => {
    vi.mocked(hooks.useNotices).mockReturnValue({
      data: { content: [notice], totalElements: 1, totalPages: 1 },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof hooks.useNotices>);
    vi.mocked(hooks.useUpdateNotice).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateNotice>);
    vi.mocked(hooks.useDeleteNotice).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useDeleteNotice>);
  });

  it("renders the notice list with a pinned badge", () => {
    render(
      <MemoryRouter>
        <NoticesListPage />
      </MemoryRouter>
    );
    expect(screen.getByText("공지 제목")).toBeInTheDocument();
    expect(screen.getByText("고정")).toBeInTheDocument();
  });

  it("triggers the pin toggle mutation when clicked", async () => {
    const mutate = vi.fn();
    vi.mocked(hooks.useUpdateNotice).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateNotice>);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NoticesListPage />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("button", { name: "고정 해제" }));
    expect(mutate).toHaveBeenCalledWith({
      id: "1",
      input: { title: "공지 제목", content: "공지 내용", isPinned: false },
    });
  });

  it("opens a confirm dialog and deletes the notice on confirm", async () => {
    const mutate = vi.fn();
    vi.mocked(hooks.useDeleteNotice).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useDeleteNotice>);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NoticesListPage />
      </MemoryRouter>
    );
    await user.click(screen.getByRole("button", { name: "삭제" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "삭제" }));
    expect(mutate).toHaveBeenCalledWith("1", expect.anything());
  });
});
