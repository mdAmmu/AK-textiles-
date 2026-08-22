import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchMyConversation,
  markMyConversationRead,
  sendMyMessage,
} from "../services/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import { useState } from "react";
import type { Message } from "../types/message";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import LoadingScreen from "../components/common/LoadingScreen";
import "./UserChat.css";
import "./AdminChat.css";

/**
 * The customer's 1:1 conversation with the admin — where a customer who
 * arrived via a WhatsApp campaign link lands, sees the product the admin
 * sent, and can type back (unlike the read-only group broadcast chat).
 */
export default function SupportChat() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [messages, setMessages] = useState<Message[] | null>(null);

  useEffect(() => {
    fetchMyConversation().then((c) => {
      setMessages(c.messages);
      markMyConversationRead();
    });
  }, []);

  useChatSocket((event) => {
    if (event.type === "new_message") {
      setMessages((prev) => {
        if (!prev || prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
      markMyConversationRead();
      return;
    }
    if (event.type === "messages_read") {
      setMessages((prev) =>
        prev?.map((m) =>
          event.message_ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m,
        ) ?? prev,
      );
    }
  }, !!user);

  async function handleSend(text: string) {
    const message = await sendMyMessage(text);
    setMessages((prev) => [...(prev ?? []), message]);
  }

  if (messages === null || !user) return <LoadingScreen />;

  return (
    <div className="user-chat-page admin-chat-page">
      <ChatHeader title="AK Textiles" subtitle="Online" onBack={() => navigate("/chat")} />
      <MessageList messages={messages} currentUserId={user.id} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
