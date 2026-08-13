import { Ban } from "lucide-react";
import type { Message } from "../../types/message";
import "./MessageBubble.css";
import "./DeletedMessageBubble.css";

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function DeletedMessageBubble({ message, isOwn }: Props) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`message-bubble-row${isOwn ? " message-bubble-row--own" : ""}`}>
      <div className={`message-bubble deleted-message-bubble${isOwn ? " message-bubble--own" : ""}`}>
        <Ban size={15} className="deleted-message-bubble__icon" />
        <p className="deleted-message-bubble__text">
          {isOwn ? "You deleted this message" : "This message was deleted"}
        </p>
        <span className="message-bubble__time">{time}</span>
      </div>
    </div>
  );
}
