import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "../pages/login/LoginPage";
import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { MembersListPage } from "../pages/members/MembersListPage";
import { MemberDetailPage } from "../pages/members/MemberDetailPage";
import { NoticesListPage } from "../pages/notices/NoticesListPage";
import { NoticeFormPage } from "../pages/notices/NoticeFormPage";
import { FaqListPage } from "../pages/faq/FaqListPage";
import { FaqFormPage } from "../pages/faq/FaqFormPage";
import { PaymentsListPage } from "../pages/payments/PaymentsListPage";

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
          { path: "notices", Component: NoticesListPage },
          { path: "notices/new", Component: NoticeFormPage },
          { path: "notices/:noticeId/edit", Component: NoticeFormPage },
          { path: "faq", Component: FaqListPage },
          { path: "faq/new", Component: FaqFormPage },
          { path: "faq/:faqId/edit", Component: FaqFormPage },
          { path: "payments", Component: PaymentsListPage },
        ],
      },
    ],
  },
]);
