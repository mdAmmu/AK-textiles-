import { NavLink } from "react-router-dom";
import "./AdminNav.css";

const TABS = [
  { to: "/admin", label: "Chats", end: true, icon: "💬" },
  { to: "/admin/products", label: "Products", icon: "📦" },
  { to: "/admin/groups", label: "Groups", icon: "👥" },
];

export default function AdminNav() {
  return (
    <nav className="admin-nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) => `admin-nav__tab${isActive ? " is-active" : ""}`}
        >
          <span className="admin-nav__icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
