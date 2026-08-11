import { useEffect, useState } from "react";
import { fetchConversations } from "../services/chat";
import type { ConversationSummary } from "../services/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import ChatList from "../components/admin/ChatList";
import AdminNav from "../components/admin/AdminNav";
import LoadingScreen from "../components/common/LoadingScreen";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useCurrentUser();
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  useEffect(() => {
    fetchConversations().then(setConversations);
  }, []);

  useChatSocket(() => {
    // A new message anywhere refreshes the list so previews/ordering stay current.
    fetchConversations().then(setConversations);
  }, !!user);

  return (
    <div className="admin-dashboard-page">
      <header className="admin-dashboard-page__header">
        <h1>Admin</h1>
      </header>
      <main className="admin-dashboard-page__content">
        {conversations === null ? <LoadingScreen /> : <ChatList conversations={conversations} />}
      </main>
      <AdminNav />
    </div>
  );
}
