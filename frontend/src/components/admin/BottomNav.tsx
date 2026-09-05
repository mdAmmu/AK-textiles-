import { MessageCircle, Radio, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { key: "chat", label: "Chat", icon: MessageCircle, path: "/admin/chats" },
  { key: "broadcast", label: "Broadcast", icon: Radio, path: "/admin/broadcast" },
  { key: "manager", label: "Manager", icon: Users, path: "/admin" },
] as const;

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="absolute bottom-0 left-0 right-0 flex items-stretch justify-around bg-white dark:bg-[#1e2530] border-t border-[#eef1ee] dark:border-[#232d3a] shadow-[0_-4px_18px_rgba(37,99,235,0.08)] dark:shadow-none pb-[env(safe-area-inset-bottom)] shrink-0 z-10">
      {TABS.map(({ key, label, icon: Icon, path }) => {
        const active =
          path === "/admin"
            ? location.pathname === "/admin"
            : location.pathname.startsWith(path);
        return (
          <button
            key={key}
            type="button"
            onClick={() => navigate(path)}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 border-none bg-transparent cursor-pointer ${
              active
                ? "text-[#2563eb] dark:text-[#60a5fa]"
                : "text-[#7c827e] dark:text-[#8b96a5]"
            }`}
          >
            <Icon size={22} strokeWidth={active ? 2.4 : 2} />
            <span className={`text-xs ${active ? "font-semibold" : "font-medium"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
