import { NavLink } from "react-router-dom";
import { MessageCircle, Package, Users } from "lucide-react";
import "./AdminNav.css";

const TABS = [
  { to: "/admin", label: "Chats", end: true, Icon: MessageCircle },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/groups", label: "Groups", Icon: Users },
];

export default function AdminNav() {
  return (
    <nav className="admin-nav">
      {TABS.map(({ to, label, end, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `admin-nav__tab${isActive ? " is-active" : ""}`}
        >
          <Icon size={22} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
