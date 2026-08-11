import { useEffect, useRef } from "react";
import type { Message } from "../../types/message";
import MessageBubble from "./MessageBubble";
import "./MessageList.css";

interface Props {
  messages: Message[];
  currentUserId: string;
  selectedIds?: Set<string>;
  onLongPressMessage?: (id: string) => void;
  onToggleSelectMessage?: (id: string) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  selectedIds,
  onLongPressMessage,
  onToggleSelectMessage,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectionMode = !!selectedIds && selectedIds.size > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="message-list">
      {messages.length === 0 && <p className="message-list__empty">No messages yet.</p>}
      {messages.length > 0 && (
        <div className="message-list__date-divider">
          <span>Today</span>
        </div>
      )}
      {messages.map((m) => (
        <MessageBubble
          key={m.id}
          message={m}
          isOwn={m.sender_id === currentUserId}
          selectionMode={selectionMode}
          selected={selectedIds?.has(m.id)}
          onLongPress={onLongPressMessage ? () => onLongPressMessage(m.id) : undefined}
          onToggleSelect={onToggleSelectMessage ? () => onToggleSelectMessage(m.id) : undefined}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
