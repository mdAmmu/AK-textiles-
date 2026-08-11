import { useEffect, useMemo, useState } from "react";
import { fetchConversations } from "../services/chat";
import type { ConversationSummary } from "../services/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import Avatar from "../components/common/Avatar";
import ChatList from "../components/admin/ChatList";
import AdminNav from "../components/admin/AdminNav";
import LoadingScreen from "../components/common/LoadingScreen";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchConversations().then(setConversations);
  }, []);

  useChatSocket(() => {
    // A new message anywhere refreshes the list so previews/ordering stay current.
    fetchConversations().then(setConversations);
  }, !!user);

  const filtered = useMemo(() => {
    if (!conversations) return conversations;
    const term = search.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter((c) => c.user_name.toLowerCase().includes(term));
  }, [conversations, search]);

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-page__header">
        <Avatar name={user?.name ?? "Admin"} online size={40} />
        <div className="admin-dashboard-page__title">
          <h1>Admin</h1>
          <span>Online</span>
        </div>
        <button className="admin-dashboard-page__icon-btn" aria-label="More options">
          ⋮
        </button>
      </header>
      <div className="admin-dashboard-page__search-row">
        <span className="admin-dashboard-page__search-icon">🔍</span>
        <input
          className="admin-dashboard-page__search"
          placeholder="Search chats..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <main className="admin-dashboard-page__content">
        {filtered === null ? <LoadingScreen /> : <ChatList conversations={filtered} />}
      </main>
      <AdminNav />
    </div>
  );
}
