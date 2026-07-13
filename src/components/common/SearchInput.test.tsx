import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("calls onChange after the debounce delay", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchInput value="" onChange={onChange} debounceMs={200} />);

    await user.type(screen.getByRole("textbox"), "alice");
    expect(onChange).not.toHaveBeenCalled();

    await waitFor(
      () => expect(onChange).toHaveBeenCalledWith("alice"),
      { timeout: 2000 }
    );
  });
});
