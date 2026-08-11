import { useEffect, useState } from "react";
import { fetchConversations } from "../services/chat";
import type { ConversationSummary } from "../services/chat";
import ChatList from "../components/admin/ChatList";
import AdminNav from "../components/admin/AdminNav";
import LoadingScreen from "../components/common/LoadingScreen";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  useEffect(() => {
    fetchConversations().then(setConversations);
  }, []);

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
