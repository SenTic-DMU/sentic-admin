import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/login/LoginPage";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { MembersListPage } from "../pages/members/MembersListPage";
import { MemberDetailPage } from "../pages/members/MemberDetailPage";

export const router = createBrowserRouter([
  { path: "/login", Component: LoginPage },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: AdminLayout,
        children: [
          { index: true, element: <Navigate to="/members" replace /> },
          { path: "members", Component: MembersListPage },
          { path: "members/:memberId", Component: MemberDetailPage },
        ],
      },
    ],
  },
]);
