import { NavLink } from "react-router-dom";

const NAV_ITEMS = [{ to: "/members", label: "회원관리" }];

export function Sidebar() {
  return (
    <nav className="w-56 shrink-0 border-r bg-white p-4">
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
    </nav>
  );
}
