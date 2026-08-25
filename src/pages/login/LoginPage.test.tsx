import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { AuthProvider } from "../../features/auth/AuthContext";
import * as api from "../../features/auth/api";

vi.mock("../../features/auth/api");

function renderLoginPage() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/members" element={<p>members page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(api.login).mockReset();
  });

  it("navigates to /members after a successful login", async () => {
    vi.mocked(api.login).mockResolvedValue({
      accessToken: "token-123",
      admin: {
        id: 1,
        loginId: "admin",
        email: "admin@sentic.com",
        nickname: "관리자",
        role: "ADMIN",
      },
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText("아이디"), "admin");
    await user.type(screen.getByLabelText("비밀번호"), "password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(screen.getByText("members page")).toBeInTheDocument();
    });
  });

  it("shows an error message when login fails", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("unauthorized"));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText("아이디"), "admin");
    await user.type(screen.getByLabelText("비밀번호"), "wrong-password");
    await user.click(screen.getByRole("button", { name: "로그인" }));

    await waitFor(() => {
      expect(screen.getByText("unauthorized")).toBeInTheDocument();
    });
  });
});
