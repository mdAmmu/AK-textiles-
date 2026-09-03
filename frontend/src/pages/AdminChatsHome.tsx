import { useEffect, useMemo, useState } from "react";
import { MessageCircle, Search } from "lucide-react";
import BottomNav from "../components/admin/BottomNav";
import LoadingScreen from "../components/common/LoadingScreen";
import ChatListItem from "../components/admin/ChatListItem";
import { fetchConversations } from "../services/chat";
import type { ConversationSummary } from "../services/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";

export default function AdminChatsHome() {
  const { user } = useCurrentUser();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConversations().then(setConversations);
  }, []);

  useChatSocket((event) => {
    if (event.type !== "new_message") return;
    const message = event.message;
    if (!message.conversation_id) return;
    setConversations((prev) => {
      if (!prev) return prev;
      const idx = prev.findIndex((c) => c.id === message.conversation_id);
      if (idx === -1) {
        // A brand new conversation (first-ever message) — refetch to get its
        // customer name rather than guessing at a partial summary.
        fetchConversations().then(setConversations);
        return prev;
      }
      const updated: ConversationSummary = {
        ...prev[idx],
        last_message_text: message.text ?? null,
        last_message_type: message.message_type,
        last_message_at: message.created_at,
        unread_count:
          message.sender_id !== user?.id ? prev[idx].unread_count + 1 : prev[idx].unread_count,
      };
      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });
  }, !!user);

  const filtered = useMemo(() => {
    if (!conversations) return conversations;
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c) => c.user_name.toLowerCase().includes(term));
  }, [conversations, search]);

  return (
    <div className="relative flex flex-col h-screen bg-[linear-gradient(180deg,#eaf7ee_0%,#f6fbf7_40%,#ffffff_75%)] dark:bg-[#10161f]">
      <header className="pt-[1.125rem] px-5 shrink-0">
        <h1 className="text-2xl font-bold text-[#1a1a1a] dark:text-[#e9edef]">Chat</h1>
      </header>

      <div className="flex items-center gap-2.5 mx-[1.125rem] mt-3.5 mb-2 py-[0.8125rem] px-[1.125rem] bg-white dark:bg-[#1e2530] rounded-2xl shadow-[0_4px_18px_rgba(15,157,110,0.08)] dark:shadow-none dark:border dark:border-[#232d3a] shrink-0">
        <span className="flex text-[#7c827e] dark:text-[#8b96a5]">
          <Search size={18} />
        </span>
        <input
          className="flex-1 border-none outline-none bg-transparent p-0 font-[inherit] text-[#1a1a1a] dark:text-[#e9edef] placeholder:text-[#b7bcb9]"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <main className="flex-1 overflow-y-auto pt-2 px-5 pb-24">
        {filtered === null ? (
          <LoadingScreen />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center text-[#7c827e] dark:text-[#8b96a5] mt-16">
            <MessageCircle size={40} />
            <p className="max-w-[240px]">
              {conversations && conversations.length > 0
                ? "No chats match your search."
                : "No conversations yet. Once a customer messages you, it'll show up here."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtered.map((c) => (
              <ChatListItem key={c.id} conversation={c} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
