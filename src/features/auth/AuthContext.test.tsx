import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";
import * as api from "./api";

vi.mock("./api");

function TestConsumer() {
  const { admin, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <p>{isAuthenticated ? `logged-in:${admin?.loginId}` : "logged-out"}</p>
      <button onClick={() => login("admin", "password").catch(() => {})}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const adminUser = {
  id: 1,
  loginId: "admin",
  email: "admin@sentic.com",
  nickname: "관리자",
  role: "ADMIN",
};

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.login).mockReset();
  });

  it("logs in and stores the admin user", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: adminUser,
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
      expect(screen.getByText("logged-in:admin")).toBeInTheDocument();
    });
    expect(localStorage.getItem("admin_access_token")).toBe("token-123");
  });

  it("logs out and clears storage", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: adminUser,
    });
    const user = userEvent.setup();
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await user.click(screen.getByText("login"));
    await waitFor(() => screen.getByText("logged-in:admin"));

    await user.click(screen.getByText("logout"));
    expect(screen.getByText("logged-out")).toBeInTheDocument();
    expect(localStorage.getItem("admin_access_token")).toBeNull();
  });

  it("rejects login when the account is not an admin", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: { ...adminUser, role: "USER" },
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
