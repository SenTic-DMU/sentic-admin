import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { NoticeFormPage } from "./NoticeFormPage";
import * as hooks from "../../features/notices/hooks";

vi.mock("../../features/notices/hooks");

describe("NoticeFormPage", () => {
  beforeEach(() => {
    vi.mocked(hooks.useNotice).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as ReturnType<typeof hooks.useNotice>);
    vi.mocked(hooks.useCreateNotice).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useCreateNotice>);
    vi.mocked(hooks.useUpdateNotice).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateNotice>);
  });

  it("submits a new notice with the entered fields", async () => {
    const mutate = vi.fn();
    vi.mocked(hooks.useCreateNotice).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useCreateNotice>);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/notices/new"]}>
        <Routes>
          <Route path="/notices/new" element={<NoticeFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("제목"), "새 공지");
    await user.type(screen.getByLabelText("내용"), "공지 내용입니다");
    await user.click(screen.getByRole("button", { name: "작성" }));

    expect(mutate).toHaveBeenCalledWith(
      { title: "새 공지", content: "공지 내용입니다" },
      expect.anything()
    );
  });

  it("prefills the form and submits an update in edit mode", async () => {
    vi.mocked(hooks.useNotice).mockReturnValue({
      data: {
        id: 1,
        title: "기존 제목",
        content: "기존 내용",
        pinned: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      isLoading: false,
    } as ReturnType<typeof hooks.useNotice>);
    const mutate = vi.fn();
    vi.mocked(hooks.useUpdateNotice).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateNotice>);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/notices/1/edit"]}>
        <Routes>
          <Route path="/notices/:noticeId/edit" element={<NoticeFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue("기존 제목")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "수정" }));

    expect(mutate).toHaveBeenCalledWith(
      {
        id: "1",
        input: { title: "기존 제목", content: "기존 내용" },
      },
      expect.anything()
    );
  });
});
