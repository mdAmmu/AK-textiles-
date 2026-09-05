import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, MessageSquarePlus } from "lucide-react";
import BottomNav from "../components/admin/BottomNav";
import AdminHomeHeader from "../components/admin/AdminHomeHeader";
import AdminAccountPanel from "../components/admin/AdminAccountPanel";
import AdminProfileScreen from "../components/admin/AdminProfileScreen";
import StartChatPanel from "../components/admin/StartChatPanel";
import LoadingScreen from "../components/common/LoadingScreen";
import ChatListItem from "../components/admin/ChatListItem";
import { fetchConversations, startConversation } from "../services/chat";
import type { ConversationSummary } from "../services/chat";
import type { User } from "../types/user";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";

export default function AdminChatsHome() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [search, setSearch] = useState("");
  const [showAccount, setShowAccount] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showStartChat, setShowStartChat] = useState(false);

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

  async function handleStartChat(customer: User) {
    const conversation = await startConversation(customer.id);
    setShowStartChat(false);
    navigate(`/admin/chats/${conversation.id}`);
  }

  return (
    <div className="relative flex flex-col h-dvh bg-[linear-gradient(180deg,#eaf7ee_0%,#f6fbf7_40%,#ffffff_75%)] dark:bg-[#10161f]">
      <AdminHomeHeader
        adminName={user?.name}
        onMenuClick={() => setShowAccount(true)}
        onProfileClick={() => setShowProfile(true)}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search chats..."
      />

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

      <button
        className="absolute bottom-24 right-5 flex items-center justify-center w-14 h-14 rounded-full bg-[#0f9d6e] text-white border-none cursor-pointer shadow-[0_4px_14px_rgba(15,157,110,0.35)] z-10"
        onClick={() => setShowStartChat(true)}
        aria-label="Start new chat"
      >
        <MessageSquarePlus size={26} />
      </button>

      <BottomNav />

      {showProfile && user && <AdminProfileScreen admin={user} onClose={() => setShowProfile(false)} />}

      {showAccount && user && (
        <AdminAccountPanel admin={user} onClose={() => setShowAccount(false)} />
      )}

      {showStartChat && (
        <StartChatPanel
          excludeIds={conversations?.map((c) => c.user_id) ?? []}
          onChat={handleStartChat}
          onClose={() => setShowStartChat(false)}
        />
      )}
    </div>
  );
}
