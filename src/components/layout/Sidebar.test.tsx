import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AuthProvider } from "../../features/auth/AuthContext";

function renderSidebar() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/members"]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route path="/members" element={<Sidebar />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("Sidebar", () => {
  it("renders the members navigation link", () => {
    renderSidebar();
    expect(screen.getByRole("link", { name: "회원관리" })).toHaveAttribute(
      "href",
      "/members"
    );
  });

  it("logs out and navigates to /login when the logout button is clicked", async () => {
    localStorage.setItem(
      "admin_user",
      JSON.stringify({ id: "1", email: "a@b.com", name: "A" })
    );
    const user = userEvent.setup();
    renderSidebar();
    await user.click(screen.getByRole("button", { name: "로그아웃" }));
    expect(screen.getByText("login page")).toBeInTheDocument();
    expect(localStorage.getItem("admin_user")).toBeNull();
  });
});
