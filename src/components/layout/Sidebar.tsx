import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";

const NAV_ITEMS = [{ to: "/members", label: "회원관리" }];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="flex w-56 shrink-0 flex-col justify-between border-r bg-white p-4">
      <ul className="space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block rounded px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded px-3 py-2 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
      >
        로그아웃
      </button>
    </nav>
  );
}
