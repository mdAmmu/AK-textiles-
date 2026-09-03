import { useRef } from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import type { Message } from "../../types/message";
import ProductMessage from "./ProductMessage";
import ImageMessage, { type ImageMessageHandle } from "./ImageMessage";

export const BUBBLE_ROW_BASE = "flex py-0.5 px-3 select-none";
export const BUBBLE_ROW_OWN = "justify-end";
export const BUBBLE_ROW_SELECTED = "bg-[rgba(15,157,110,0.12)]";
export const BUBBLE_ROW_PENDING = "opacity-60";

export const BUBBLE_BASE =
  "max-w-[75%] bg-[var(--chat-bubble-other)] text-[var(--chat-text)] rounded-lg py-1.5 px-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative";
export const BUBBLE_OWN = "bg-[var(--chat-bubble-own)]";
export const BUBBLE_SELECTED = "outline outline-2 outline-[var(--chat-accent)] outline-offset-2";
export const BUBBLE_IMAGE = "p-[3px] overflow-hidden";

export const IMAGE_WRAP = "relative leading-none";
export const IMAGE_TIME =
  "absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/45 text-white text-[11px] py-[0.0625rem] px-1.5 rounded-lg [line-height:normal]";

export const BUBBLE_TEXT = "m-0 py-0.5 px-1 whitespace-pre-wrap break-words";
export const BUBBLE_TIME =
  "flex items-center justify-end text-[11px] text-[var(--chat-text-secondary)] mt-0.5 pr-1";
export const BUBBLE_EDITED = "italic mr-1";
export const BUBBLE_TICK = "flex ml-1 text-[var(--chat-text-secondary)]";
export const BUBBLE_TICK_READ = "text-[var(--chat-tick-read)]";
export const BUBBLE_TICK_IN_IMAGE = "flex ml-1 text-white";

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
    <span
      className={
        isImage
          ? BUBBLE_TICK_IN_IMAGE
          : `${BUBBLE_TICK}${message.read_at ? ` ${BUBBLE_TICK_READ}` : ""}`
      }
    >
      {message._pending ? (
        <Clock size={12} />
      ) : message.read_at ? (
        <CheckCheck size={14} />
      ) : (
        <Check size={14} />
      )}
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
      className={`${BUBBLE_ROW_BASE}${isOwn ? ` ${BUBBLE_ROW_OWN}` : ""}${selected ? ` ${BUBBLE_ROW_SELECTED}` : ""}${message._pending ? ` ${BUBBLE_ROW_PENDING}` : ""}`}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`${BUBBLE_BASE}${isOwn ? ` ${BUBBLE_OWN}` : ""}${isImage ? ` ${BUBBLE_IMAGE}` : ""}${selected ? ` ${BUBBLE_SELECTED}` : ""}`}
      >
        {isImage ? (
          <div className={IMAGE_WRAP}>
            <ImageMessage ref={imageRef} message={message} selectionMode={selectionMode} />
            <span className={IMAGE_TIME}>
              {time}
              {tick}
            </span>
          </div>
        ) : (
          <>
            {message.message_type === "PRODUCT" ? (
              <ProductMessage message={message} />
            ) : (
              <p className={BUBBLE_TEXT}>{message.text}</p>
            )}
            <span className={BUBBLE_TIME}>
              {message.is_edited && <span className={BUBBLE_EDITED}>Edited</span>}
              {time}
              {tick}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
