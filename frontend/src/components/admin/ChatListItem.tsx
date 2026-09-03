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

  return (
    <Link
      to={`/admin/chats/${conversation.id}`}
      className="flex items-center gap-3.5 py-3 px-3.5 bg-white rounded-2xl shadow-[0_2px_10px_rgba(108,92,231,0.08)] no-underline text-inherit"
    >
      <Avatar name={conversation.user_name} online size={48} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <span className="font-semibold text-[#1f1b2e]">{conversation.user_name}</span>
          <span
            className={`text-xs ${hasUnread ? "text-[#6c5ce7] font-semibold" : "text-[#8b8798]"}`}
          >
            {time}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="flex-1 min-w-0 text-[#8b8798] text-sm whitespace-nowrap overflow-hidden text-ellipsis">
            {conversation.last_message_text ?? "No messages yet"}
          </span>
          {hasUnread && (
            <span className="shrink-0 bg-[#6c5ce7] text-white text-[11px] font-bold min-w-[20px] h-5 rounded-[10px] flex items-center justify-center px-1.5">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
