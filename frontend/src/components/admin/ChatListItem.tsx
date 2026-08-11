import { Link } from "react-router-dom";
import type { ConversationSummary } from "../../services/chat";
import Avatar from "../common/Avatar";
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
  const hasUnread = conversation.unread_count > 0;

  return (
    <Link to={`/admin/chats/${conversation.id}`} className="chat-list-item">
      <Avatar name={conversation.user_name} online size={48} />
      <div className="chat-list-item__body">
        <div className="chat-list-item__top">
          <span className="chat-list-item__name">{conversation.user_name}</span>
          <span className={`chat-list-item__time${hasUnread ? " chat-list-item__time--unread" : ""}`}>
            {time}
          </span>
        </div>
        <div className="chat-list-item__bottom">
          <span className="chat-list-item__preview">
            {conversation.last_message_text ?? "No messages yet"}
          </span>
          {hasUnread && <span className="chat-list-item__badge">{conversation.unread_count}</span>}
        </div>
      </div>
    </Link>
  );
}
