import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import * as api from "./api";

vi.mock("./api");

function makeToken(role: string, sub = "1"): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "none" })}.${encode({ sub, role, exp: 9999999999 })}.sig`;
}

function TestConsumer() {
  const { admin, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <p>{isAuthenticated ? `logged-in:${admin?.id}` : "logged-out"}</p>
      <button onClick={() => login("admin", "password").catch(() => {})}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.login).mockReset();
  });

  it("logs in and stores the admin user decoded from the JWT", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: makeToken("ADMIN"),
      refreshToken: "refresh-123",
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByText("logged-out")).toBeInTheDocument();
    await user.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByText("logged-in:1")).toBeInTheDocument();
    });
    expect(localStorage.getItem("admin_access_token")).toBe(makeToken("ADMIN"));
    expect(localStorage.getItem("admin_refresh_token")).toBe("refresh-123");
  });

  it("logs out and clears storage", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: makeToken("ADMIN"),
      refreshToken: "refresh-123",
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("login"));
    await waitFor(() => screen.getByText("logged-in:1"));

    await user.click(screen.getByText("logout"));
    expect(screen.getByText("logged-out")).toBeInTheDocument();
    expect(localStorage.getItem("admin_access_token")).toBeNull();
    expect(localStorage.getItem("admin_refresh_token")).toBeNull();
  });

  it("rejects login when the account is not an admin", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: makeToken("USER"),
      refreshToken: "refresh-123",
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("login"));

    await waitFor(() => {
      expect(screen.getByText("logged-out")).toBeInTheDocument();
    });
    expect(localStorage.getItem("admin_access_token")).toBeNull();
  });
});
