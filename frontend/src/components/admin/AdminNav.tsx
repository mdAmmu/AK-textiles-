import { MessageCircle, Megaphone, Radio, Users, FileStack } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/ak-logo.png";

const TABS = [
  { key: "chat", label: "Chats", icon: MessageCircle, path: "/admin/chats" },
  { key: "broadcast", label: "Broadcast", icon: Radio, path: "/admin/broadcast" },
  { key: "manager", label: "Groups", icon: Users, path: "/admin" },
] as const;

// Desktop-only extras — reachable on mobile today through the account menu,
// but worth a direct rail shortcut once there's room for one.
const RAIL_EXTRA_TABS = [
  { key: "campaign", label: "Campaign", icon: Megaphone, path: "/admin/campaign" },
  { key: "template", label: "Template", icon: FileStack, path: "/admin/templates" },
] as const;

/**
 * Replaces the old bottom tab bar: a pill switcher docked under the header
 * on phone widths, and a fixed icon rail down the left edge from md up.
 */
export default function AdminNav() {
  const location = useLocation();
  const navigate = useNavigate();

  function isActive(path: string) {
    return path === "/admin" ? location.pathname === "/admin" : location.pathname.startsWith(path);
  }

  return (
    <>
      <nav className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-20 md:w-[76px] md:flex-col md:items-center md:gap-2 md:py-4 bg-white dark:bg-[#1e2530] border-r border-[#eef1ee] dark:border-[#232d3a]">
        <button
          type="button"
          onClick={() => navigate("/admin/chats")}
          aria-label="AK Textiles"
          className="flex items-center justify-center w-11 h-11 mb-2 border-none bg-transparent cursor-pointer rounded-xl overflow-hidden"
        >
          <img src={logo} alt="" className="w-full h-full object-cover" />
        </button>
        <div className="w-8 h-px bg-[#eef1ee] dark:bg-[#232d3a] mb-1" />

        {TABS.map(({ key, label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl border-none cursor-pointer ${
                active
                  ? "bg-[#eaf0ff] text-[#2563eb] dark:bg-[#1c2a45] dark:text-[#60a5fa]"
                  : "bg-transparent text-[#7c827e] dark:text-[#8b96a5]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}

        <div className="w-8 h-px bg-[#eef1ee] dark:bg-[#232d3a] my-1" />

        {RAIL_EXTRA_TABS.map(({ key, label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 w-14 py-2.5 rounded-xl border-none cursor-pointer ${
                active
                  ? "bg-[#eaf0ff] text-[#2563eb] dark:bg-[#1c2a45] dark:text-[#60a5fa]"
                  : "bg-transparent text-[#7c827e] dark:text-[#8b96a5]"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="flex md:hidden items-center gap-1 mx-[1.125rem] mt-5 mb-2 p-1 rounded-full bg-[#eef1ee] dark:bg-[#1a212c] shrink-0">
        {TABS.map(({ key, label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={key}
              type="button"
              onClick={() => navigate(path)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 items-center justify-center gap-1.5 py-2 rounded-full border-none cursor-pointer text-sm ${
                active
                  ? "bg-white text-[#2563eb] font-semibold shadow-[0_1px_4px_rgba(37,99,235,0.18)] dark:bg-[#232d3a] dark:text-[#60a5fa]"
                  : "bg-transparent text-[#7c827e] dark:text-[#8b96a5] font-medium"
              }`}
            >
              <Icon size={15} strokeWidth={active ? 2.4 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </>
  );
}
