import { Link } from "react-router-dom";
import type { ConversationSummary } from "../../services/chat";
import "./ChatListItem.css";

interface Props {
  conversation: ConversationSummary;
}

export default function ChatListItem({ conversation }: Props) {
  const time = conversation.last_message_at
    ? new Date(conversation.last_message_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Link to={`/admin/chats/${conversation.id}`} className="chat-list-item">
      <div className="chat-list-item__avatar">🔵</div>
      <div className="chat-list-item__body">
        <div className="chat-list-item__top">
          <span className="chat-list-item__name">{conversation.user_name}</span>
          <span className="chat-list-item__time">{time}</span>
        </div>
        <div className="chat-list-item__preview">
          {conversation.last_message_text ?? "No messages yet"}
        </div>
      </div>
    </Link>
  );
}
