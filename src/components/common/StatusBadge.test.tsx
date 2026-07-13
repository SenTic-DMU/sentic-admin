import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the Korean label for a member status", () => {
    render(<StatusBadge status="ACTIVE" kind="member" />);
    expect(screen.getByText("활성")).toBeInTheDocument();
  });

  it("renders the Korean label for a payment status", () => {
    render(<StatusBadge status="FAILED" kind="payment" />);
    expect(screen.getByText("실패")).toBeInTheDocument();
  });

  it("falls back to the raw status for unknown values", () => {
    render(<StatusBadge status="UNKNOWN" kind="member" />);
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });
});
