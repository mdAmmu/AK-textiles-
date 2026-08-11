import { NavLink } from "react-router-dom";
import "./AdminNav.css";

const TABS = [
  { to: "/admin", label: "Chats", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/groups", label: "Groups" },
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
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
