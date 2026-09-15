import { useMemo, useState } from "react";
import { MessageCircle, MessageSquarePlus } from "lucide-react";
import AdminHomeHeader from "./AdminHomeHeader";
import AdminNav from "./AdminNav";
import ChatListItem from "./ChatListItem";
import LoadingScreen from "../common/LoadingScreen";
import type { ConversationSummary } from "../../services/chat";

interface Props {
  adminName?: string;
  conversations: ConversationSummary[] | null;
  activeConversationId?: string;
  onMenuClick: () => void;
  onProfileClick: () => void;
  onStartChat: () => void;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
] as const;

export default function AdminChatListPane({
  adminName,
  conversations,
  activeConversationId,
  onMenuClick,
  onProfileClick,
  onStartChat,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const filtered = useMemo(() => {
    if (!conversations) return conversations;
    const term = search.trim().toLowerCase();
    let list = conversations;
    if (filter === "unread") list = list.filter((c) => c.unread_count > 0);
    if (term) list = list.filter((c) => c.user_name.toLowerCase().includes(term));
    return list;
  }, [conversations, search, filter]);

  const unreadCount = conversations?.filter((c) => c.unread_count > 0).length ?? 0;

  return (
    <div className="relative flex flex-col h-full min-h-0">
      <AdminHomeHeader
        adminName={adminName}
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customers"
      />

      <AdminNav />

      <div className="flex items-center gap-1 mx-[1.125rem] mb-2 p-1 rounded-full bg-[#eef1ee] dark:bg-[#1a212c] shrink-0">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`flex-1 py-1.5 rounded-full border-none cursor-pointer text-sm ${
              filter === key
                ? "bg-white text-[#2563eb] font-semibold shadow-[0_1px_4px_rgba(37,99,235,0.18)] dark:bg-[#232d3a] dark:text-[#60a5fa]"
                : "bg-transparent text-[#7c827e] dark:text-[#8b96a5] font-medium"
            }`}
          >
            {label}
            {key === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
        {filtered === null ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center text-[#7c827e] dark:text-[#8b96a5] mt-16 px-6">
            <MessageCircle size={40} />
            <p className="max-w-[240px]">
              {conversations && conversations.length > 0
                ? "No chats match here."
                : "No conversations yet. Once a customer messages you, it'll show up here."}
            </p>
          </div>
        ) : (
          filtered.map((c) => (
            <ChatListItem key={c.id} conversation={c} active={c.id === activeConversationId} />
          ))
        )}
      </main>

      <button
        className="absolute bottom-6 right-5 flex items-center justify-center w-14 h-14 rounded-full bg-[#2563eb] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(37,99,235,0.35)] z-10"
        onClick={onStartChat}
        aria-label="Start new chat"
      >
        <MessageSquarePlus size={26} />
      </button>
    </div>
  );
}
