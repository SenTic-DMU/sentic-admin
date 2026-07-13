import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./AdminLayout";
import { AuthProvider } from "../../features/auth/AuthContext";

describe("AdminLayout", () => {
  it("renders the sidebar and the nested route content", () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/members"]}>
          <Routes>
            <Route element={<AdminLayout />}>
              <Route path="/members" element={<p>members content</p>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
    expect(screen.getByRole("link", { name: "회원관리" })).toBeInTheDocument();
    expect(screen.getByText("members content")).toBeInTheDocument();
  });
});
