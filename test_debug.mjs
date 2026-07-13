import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Simple component to test
const TestComponent = ({ onChange }) => {
  const [draft, setDraft] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onChange(draft);
    }, 300);
    return () => clearTimeout(timer);
  }, [draft]);

  return React.createElement("input", {
    value: draft,
    onChange: (e) => setDraft(e.target.value),
  });
};

describe("Timer test", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("simple timer test", async () => {
    const onChange = vi.fn();
    render(React.createElement(TestComponent, { onChange }));
    
    const input = screen.getByRole("textbox");
    input.value = "test";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    
    expect(onChange).not.toHaveBeenCalled();
    
    vi.advanceTimersByTime(300);
    expect(onChange).toHaveBeenCalledWith("test");
  });
});
