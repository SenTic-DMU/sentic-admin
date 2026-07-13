import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AuthProvider } from "../../features/auth/AuthContext";

function renderWithAuth(isLoggedIn: boolean) {
  localStorage.clear();
  if (isLoggedIn) {
    localStorage.setItem(
      "admin_user",
      JSON.stringify({ id: "1", email: "a@b.com", name: "A" })
    );
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/members"]}>
        <Routes>
          <Route path="/login" element={<p>login page</p>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/members" element={<p>members page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe("ProtectedRoute", () => {
  it("redirects to /login when not authenticated", () => {
    renderWithAuth(false);
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders the nested route when authenticated", () => {
    renderWithAuth(true);
    expect(screen.getByText("members page")).toBeInTheDocument();
  });
});
