import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="삭제하시겠습니까?"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the title and description when open", () => {
    render(
      <ConfirmDialog
        open
        title="삭제하시겠습니까?"
        description="이 작업은 되돌릴 수 없습니다."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText("삭제하시겠습니까?")).toBeInTheDocument();
    expect(screen.getByText("이 작업은 되돌릴 수 없습니다.")).toBeInTheDocument();
  });

  it("calls onConfirm and onCancel when the respective buttons are clicked", async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        title="삭제하시겠습니까?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await user.click(screen.getByRole("button", { name: "삭제" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
