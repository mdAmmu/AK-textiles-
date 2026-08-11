import { useRef } from "react";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../../types/message";
import ProductMessage from "./ProductMessage";
import ImageMessage from "./ImageMessage";
import "./MessageBubble.css";

interface Props {
  message: Message;
  isOwn: boolean;
  selectionMode?: boolean;
  selected?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
}

const LONG_PRESS_MS = 450;

export default function MessageBubble({
  message,
  isOwn,
  selectionMode,
  selected,
  onLongPress,
  onToggleSelect,
}: Props) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const isImage = message.message_type === "IMAGE";

  const tick = isOwn && (
    <span className={`message-bubble__tick${message.read_at ? " message-bubble__tick--read" : ""}`}>
      {message.read_at ? <CheckCheck size={14} /> : <Check size={14} />}
    </span>
  );

  function startPress() {
    if (!onLongPress) return;
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onLongPress();
    }, LONG_PRESS_MS);
  }

  function cancelPress() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function handleClick() {
    if (firedRef.current) {
      firedRef.current = false;
      return;
    }
    if (selectionMode) onToggleSelect?.();
  }

  return (
    <div
      className={`message-bubble-row${isOwn ? " message-bubble-row--own" : ""}${selected ? " message-bubble-row--selected" : ""}`}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      onClick={handleClick}
    >
      <div
        className={`message-bubble${isOwn ? " message-bubble--own" : ""}${isImage ? " message-bubble--image" : ""}${selected ? " message-bubble--selected" : ""}`}
      >
        {isImage ? (
          <div className="message-bubble__image-wrap">
            <ImageMessage message={message} />
            <span className="message-bubble__image-time">
              {time}
              {tick}
            </span>
          </div>
        ) : (
          <>
            {message.message_type === "PRODUCT" ? (
              <ProductMessage message={message} />
            ) : (
              <p className="message-bubble__text">{message.text}</p>
            )}
            <span className="message-bubble__time">
              {time}
              {tick}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
