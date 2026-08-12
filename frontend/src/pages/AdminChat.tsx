import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Camera, Package } from "lucide-react";
import {
  fetchConversationMessages,
  markConversationRead,
  sendAdminImageMessage,
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
import "./UserChat.css";
import "./AdminChat.css";

export default function AdminChat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [customerName, setCustomerName] = useState("Customer");
  const [showPicker, setShowPicker] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId) {
      fetchConversationMessages(conversationId).then((c) => {
        setMessages(c.messages);
        setCustomerName(c.user_name);
        markConversationRead(conversationId);
      });
    }
  }, [conversationId]);

  useChatSocket((event) => {
    if (event.type === "new_message") {
      if (event.message.conversation_id !== conversationId) return;
      setMessages((prev) => {
        if (!prev || prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
      if (conversationId) markConversationRead(conversationId);
      return;
    }
    if (event.type === "messages_read") {
      if (event.conversation_id !== conversationId) return;
      setMessages((prev) =>
        prev?.map((m) =>
          event.message_ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m,
        ) ?? prev,
      );
    }
  }, !!user && !!conversationId);

  async function handleSend(text: string) {
    if (!conversationId) return;
    const message = await sendAdminMessage(conversationId, text);
    setMessages((prev) => [...(prev ?? []), message]);
  }

  async function handlePickProduct(productId: string) {
    if (!conversationId) return;
    const newMessages = await sendAdminProductMessage(conversationId, productId);
    setMessages((prev) => [...(prev ?? []), ...newMessages]);
    setShowPicker(false);
  }

  async function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !conversationId) return;
    const message = await sendAdminImageMessage(conversationId, file);
    setMessages((prev) => [...(prev ?? []), message]);
  }

  if (messages === null || !user) return <LoadingScreen />;

  return (
    <div className="user-chat-page admin-chat-page">
      <ChatHeader title={customerName} subtitle="Online" onBack={() => navigate("/admin")} />
      <MessageList messages={messages} currentUserId={user.id} />
      <MessageInput
        onSend={handleSend}
        extraAction={
          <>
            <span
              className="message-input__icon"
              onClick={() => setShowPicker(true)}
              role="button"
              aria-label="Send a product"
            >
              <Package size={20} />
            </span>
            <span
              className="message-input__icon"
              onClick={() => cameraInputRef.current?.click()}
              role="button"
              aria-label="Take a photo"
            >
              <Camera size={20} />
            </span>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleCameraCapture}
            />
          </>
        }
      />

      {showPicker && (
        <ProductPicker onPick={handlePickProduct} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
