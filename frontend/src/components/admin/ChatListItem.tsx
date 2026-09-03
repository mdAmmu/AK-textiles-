import { Link } from "react-router-dom";
import type { ConversationSummary } from "../../services/chat";
import Avatar from "../common/Avatar";

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
      className="flex items-center gap-3.5 py-3 px-3.5 bg-white border border-[#eef1ee] rounded-2xl no-underline text-inherit dark:bg-[#1e2530] dark:border-[#232d3a]"
    >
      <Avatar name={conversation.user_name} size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline gap-2">
          <span className="font-semibold text-[#1a1a1a] dark:text-[#e9edef] truncate">
            {conversation.user_name}
          </span>
          <span
            className={`text-xs shrink-0 ${hasUnread ? "text-[#0f9d6e] dark:text-[#22c789] font-semibold" : "text-[#9a9e9b] dark:text-[#6b7480]"}`}
          >
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="flex-1 min-w-0 text-[#8b8f8c] dark:text-[#8b96a5] text-sm whitespace-nowrap overflow-hidden text-ellipsis">
            {preview}
          </span>
          {hasUnread && (
            <span className="shrink-0 bg-[#0f9d6e] text-white text-[11px] font-bold min-w-[20px] h-5 rounded-[10px] flex items-center justify-center px-1.5">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
