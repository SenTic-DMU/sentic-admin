import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { FaqListPage } from "./FaqListPage";
import * as hooks from "../../features/faq/hooks";

vi.mock("../../features/faq/hooks");

const faqs = [
  { id: "1", question: "질문1", answer: "답변1", orderNum: 1 },
  { id: "2", question: "질문2", answer: "답변2", orderNum: 2 },
];

describe("FaqListPage", () => {
  beforeEach(() => {
    vi.mocked(hooks.useFaqs).mockReturnValue({
      data: faqs,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof hooks.useFaqs>);
    vi.mocked(hooks.useMoveFaqOrder).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useMoveFaqOrder>);
    vi.mocked(hooks.useDeleteFaq).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useDeleteFaq>);
  });

  it("renders the faq list", () => {
    render(
      <MemoryRouter>
        <FaqListPage />
      </MemoryRouter>
    );
    expect(screen.getByText("질문1")).toBeInTheDocument();
    expect(screen.getByText("질문2")).toBeInTheDocument();
  });

  it("disables the up button for the first row and down button for the last row", () => {
    render(
      <MemoryRouter>
        <FaqListPage />
      </MemoryRouter>
    );
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("button", { name: "↑" })).toBeDisabled();
    expect(within(rows[1]).getByRole("button", { name: "↓" })).toBeDisabled();
  });

  it("triggers the move mutation when an arrow button is clicked", async () => {
    const mutate = vi.fn();
    vi.mocked(hooks.useMoveFaqOrder).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useMoveFaqOrder>);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FaqListPage />
      </MemoryRouter>
    );
    const rows = screen.getAllByRole("row").slice(1);
    await user.click(within(rows[1]).getByRole("button", { name: "↑" }));
    expect(mutate).toHaveBeenCalledWith({ id: "2", direction: "UP" });
  });

  it("opens a confirm dialog and deletes the faq on confirm", async () => {
    const mutate = vi.fn();
    vi.mocked(hooks.useDeleteFaq).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useDeleteFaq>);
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FaqListPage />
      </MemoryRouter>
    );
    const deleteButtons = screen.getAllByRole("button", { name: "삭제" });
    await user.click(deleteButtons[0]);
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "삭제" }));
    expect(mutate).toHaveBeenCalledWith("1", expect.anything());
  });
});
