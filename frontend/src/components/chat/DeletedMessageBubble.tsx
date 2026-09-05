import { Ban } from "lucide-react";
import type { Message } from "../../types/message";
import {
  BUBBLE_BASE,
  BUBBLE_OWN,
  BUBBLE_ROW_BASE,
  BUBBLE_ROW_OWN,
  BUBBLE_TIME,
} from "./MessageBubble";

interface Props {
  message: Message;
  isOwn: boolean;
  highlighted?: boolean;
}

export default function DeletedMessageBubble({ message, isOwn, highlighted }: Props) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      id={`msg-${message.id}`}
      className={`${BUBBLE_ROW_BASE}${isOwn ? ` ${BUBBLE_ROW_OWN}` : ""} transition-colors duration-500${highlighted ? " bg-[rgba(37,99,235,0.18)]" : ""}`}
    >
      <div
        className={`${BUBBLE_BASE}${isOwn ? ` ${BUBBLE_OWN}` : ""} flex items-center gap-1.5 italic text-[var(--chat-text-secondary)]`}
      >
        <Ban size={15} className="shrink-0 opacity-80" />
        <p className="m-0 py-0.5">
          {isOwn ? "You deleted this message" : "This message was deleted"}
        </p>
        <span className={`${BUBBLE_TIME} m-0 pr-0`}>{time}</span>
      </div>
    </div>
  );
}
