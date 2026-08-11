import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchConversationMessages, sendAdminMessage } from "../services/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import type { Message } from "../types/message";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import LoadingScreen from "../components/common/LoadingScreen";
import "./UserChat.css";

export default function AdminChat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversationMessages(conversationId).then((c) => setMessages(c.messages));
    }
  }, [conversationId]);

  useChatSocket((event) => {
    if (event.type !== "new_message") return;
    if (event.message.conversation_id !== conversationId) return;
    setMessages((prev) => {
      if (!prev || prev.some((m) => m.id === event.message.id)) return prev;
      return [...prev, event.message];
    });
  }, !!user && !!conversationId);

  async function handleSend(text: string) {
    if (!conversationId) return;
    const message = await sendAdminMessage(conversationId, text);
    setMessages((prev) => [...(prev ?? []), message]);
  }

  if (messages === null || !user) return <LoadingScreen />;

  return (
    <div className="user-chat-page">
      <ChatHeader title="Customer" onBack={() => navigate("/admin")} />
      <MessageList messages={messages} currentUserId={user.id} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
