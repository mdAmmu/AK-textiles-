import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../../types/message";
import ProductMessage from "./ProductMessage";
import "./MessageBubble.css";

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`message-bubble-row${isOwn ? " message-bubble-row--own" : ""}`}>
      <div className={`message-bubble${isOwn ? " message-bubble--own" : ""}`}>
        {message.message_type === "PRODUCT" ? (
          <ProductMessage message={message} />
        ) : (
          <p className="message-bubble__text">{message.text}</p>
        )}
        <span className="message-bubble__time">
          {time}
          {isOwn && (
            <span className={`message-bubble__tick${message.read_at ? " message-bubble__tick--read" : ""}`}>
              {message.read_at ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
