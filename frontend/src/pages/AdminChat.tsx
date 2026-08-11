import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchConversationMessages,
  sendAdminMessage,
  sendAdminProductMessage,
} from "../services/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import type { Message } from "../types/message";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import ProductPicker from "../components/chat/ProductPicker";
import LoadingScreen from "../components/common/LoadingScreen";
import "./AdminChat.css";
import "./UserChat.css";

export default function AdminChat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [showPicker, setShowPicker] = useState(false);

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

  async function handlePickProduct(productId: string) {
    if (!conversationId) return;
    const message = await sendAdminProductMessage(conversationId, productId);
    setMessages((prev) => [...(prev ?? []), message]);
    setShowPicker(false);
  }

  if (messages === null || !user) return <LoadingScreen />;

  return (
    <div className="user-chat-page">
      <ChatHeader title="Customer" onBack={() => navigate("/admin")} />
      <MessageList messages={messages} currentUserId={user.id} />
      <div className="admin-chat__composer">
        <button className="admin-chat__product-button" onClick={() => setShowPicker(true)}>
          📦
        </button>
        <MessageInput onSend={handleSend} />
      </div>

      {showPicker && (
        <ProductPicker onPick={handlePickProduct} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
