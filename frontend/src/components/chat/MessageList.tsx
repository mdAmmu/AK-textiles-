import { useEffect, useRef } from "react";
import type { Message } from "../../types/message";
import MessageBubble from "./MessageBubble";
import "./MessageList.css";

interface Props {
  messages: Message[];
  currentUserId: string;
}

export default function MessageList({ messages, currentUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  return (
    <div className="message-list">
      {messages.length === 0 && <p className="message-list__empty">No messages yet.</p>}
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} isOwn={m.sender_id === currentUserId} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
