import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { FaqFormPage } from "./FaqFormPage";
import * as hooks from "../../features/faq/hooks";

vi.mock("../../features/faq/hooks");

describe("FaqFormPage", () => {
  beforeEach(() => {
    vi.mocked(hooks.useFaqs).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof hooks.useFaqs>);
    vi.mocked(hooks.useCreateFaq).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useCreateFaq>);
    vi.mocked(hooks.useUpdateFaq).mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateFaq>);
  });

  it("submits a new faq with the entered fields", async () => {
    const mutate = vi.fn();
    vi.mocked(hooks.useCreateFaq).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useCreateFaq>);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/faq/new"]}>
        <Routes>
          <Route path="/faq/new" element={<FaqFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("질문"), "새 질문");
    await user.type(screen.getByLabelText("답변"), "새 답변");
    await user.click(screen.getByRole("button", { name: "작성" }));

    expect(mutate).toHaveBeenCalledWith(
      { question: "새 질문", answer: "새 답변" },
      expect.anything()
    );
  });

  it("prefills the form and submits an update in edit mode", async () => {
    vi.mocked(hooks.useFaqs).mockReturnValue({
      data: [{ id: "1", question: "기존 질문", answer: "기존 답변", orderNum: 1 }],
      isLoading: false,
    } as unknown as ReturnType<typeof hooks.useFaqs>);
    const mutate = vi.fn();
    vi.mocked(hooks.useUpdateFaq).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof hooks.useUpdateFaq>);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/faq/1/edit"]}>
        <Routes>
          <Route path="/faq/:faqId/edit" element={<FaqFormPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByDisplayValue("기존 질문")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "수정" }));

    expect(mutate).toHaveBeenCalledWith(
      { id: "1", input: { question: "기존 질문", answer: "기존 답변" } },
      expect.anything()
    );
  });
});
