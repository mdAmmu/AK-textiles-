import { Link } from "react-router-dom";
import type { ConversationSummary } from "../../services/chat";
import Avatar from "../common/Avatar";

interface Props {
  conversation: ConversationSummary;
  active?: boolean;
}

export default function ChatListItem({ conversation, active }: Props) {
  const time = conversation.last_message_at
    ? new Date(conversation.last_message_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const hasUnread = conversation.unread_count > 0;
  const preview =
    conversation.last_message_text ??
    (conversation.last_message_type === "IMAGE"
      ? "📷 Photo"
      : conversation.last_message_type === "PRODUCT"
        ? "📦 Product"
        : "No messages yet");

  return (
    <Link
      to={`/admin/chats/${conversation.id}`}
      className={`flex items-center gap-3.5 py-3 px-3.5 no-underline text-inherit border-b border-[#f1f2ef] dark:border-[#20293380] ${
        active ? "bg-[#eaf0ff] dark:bg-[#1c2a45]" : "bg-transparent"
      }`}
    >
      <Avatar name={conversation.user_name} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <span
            className={`text-[15px] truncate text-[#1a1a1a] dark:text-[#e9edef] ${hasUnread ? "font-semibold" : "font-medium"}`}
          >
            {conversation.user_name}
          </span>
          <span
            className={`text-xs shrink-0 ${hasUnread ? "text-[#2563eb] dark:text-[#60a5fa] font-semibold" : "text-[#9a9e9b] dark:text-[#6b7480]"}`}
          >
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span
            className={`flex-1 min-w-0 text-sm whitespace-nowrap overflow-hidden text-ellipsis ${hasUnread ? "text-[#1a1a1a] dark:text-[#e9edef]" : "text-[#8b8f8c] dark:text-[#8b96a5]"}`}
          >
            {preview}
          </span>
          {hasUnread && (
            <span className="shrink-0 bg-[#ef4444] text-white text-[11px] font-bold min-w-[20px] h-5 rounded-[10px] flex items-center justify-center px-1.5">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
