import { useRef } from "react";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../../types/message";
import ProductMessage from "./ProductMessage";
import ImageMessage, { type ImageMessageHandle } from "./ImageMessage";
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
const MOVE_CANCEL_PX = 10;

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
  const movedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const imageRef = useRef<ImageMessageHandle>(null);

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
    movedRef.current = false;
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

  function endPress() {
    cancelPress();
    if (firedRef.current) {
      firedRef.current = false;
      return;
    }
    // A scroll/drag gesture, not a tap — don't treat it as a selection toggle.
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    if (selectionMode) onToggleSelect?.();
  }

  function handleTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    startPress();
  }

  function handleTouchMove(e: React.TouchEvent) {
    const start = touchStartRef.current;
    if (!start) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - start.x);
    const dy = Math.abs(touch.clientY - start.y);
    if (dx > MOVE_CANCEL_PX || dy > MOVE_CANCEL_PX) {
      movedRef.current = true;
      cancelPress();
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // Prevent the browser's synthetic mouse/click events from firing a
    // second (conflicting) endPress() right after this one. Since that also
    // suppresses the image's own onClick, open it here directly on a tap.
    const wasTap = !firedRef.current && !movedRef.current;
    e.preventDefault();
    touchStartRef.current = null;
    endPress();
    if (wasTap && isImage && !selectionMode) {
      imageRef.current?.open();
    }
  }

  return (
    <div
      className={`message-bubble-row${isOwn ? " message-bubble-row--own" : ""}${selected ? " message-bubble-row--selected" : ""}`}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`message-bubble${isOwn ? " message-bubble--own" : ""}${isImage ? " message-bubble--image" : ""}${selected ? " message-bubble--selected" : ""}`}
      >
        {isImage ? (
          <div className="message-bubble__image-wrap">
            <ImageMessage ref={imageRef} message={message} selectionMode={selectionMode} />
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
