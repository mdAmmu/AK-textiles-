import { useRef, useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../../types/message";
import ImageViewerModal from "./ImageViewerModal";
import "./MessageBubble.css";
import "./ImageGroupBubble.css";

interface Props {
  messages: Message[];
  isOwn: boolean;
  selectionMode?: boolean;
  selectedIds?: Set<string>;
  onLongPressMessage?: (id: string) => void;
  onToggleSelectMessage?: (id: string) => void;
}

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;
const MAX_TILES = 4;

export default function ImageGroupBubble({
  messages,
  isOwn,
  selectionMode,
  selectedIds,
  onLongPressMessage,
  onToggleSelectMessage,
}: Props) {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const movedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const last = messages[messages.length - 1];
  const time = new Date(last.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const tick = isOwn && (
    <span className={`message-bubble__tick${last.read_at ? " message-bubble__tick--read" : ""}`}>
      {last.read_at ? <CheckCheck size={14} /> : <Check size={14} />}
    </span>
  );

  const selected = !!selectedIds && messages.every((m) => selectedIds.has(m.id));
  const count = messages.length;
  const visible = messages.slice(0, MAX_TILES);
  const remaining = count - MAX_TILES;

  function startPress() {
    firedRef.current = false;
    movedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      // onLongPressMessage replaces the whole selection with just this id
      // (that's how entering selection mode works), so only call it once
      // for the first image, then additively toggle the rest in.
      const [first, ...rest] = messages;
      onLongPressMessage?.(first.id);
      rest.forEach((m) => onToggleSelectMessage?.(m.id));
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
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    if (selectionMode) {
      messages.forEach((m) => onToggleSelectMessage?.(m.id));
    }
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
    const wasTap = !firedRef.current && !movedRef.current;
    const target = e.target as HTMLElement;
    const tileEl = target.closest<HTMLElement>("[data-tile-index]");
    e.preventDefault();
    touchStartRef.current = null;
    endPress();
    if (wasTap && !selectionMode && tileEl) {
      handleTileClick(Number(tileEl.dataset.tileIndex));
    }
  }

  function handleTileClick(index: number) {
    if (selectionMode) {
      messages.forEach((m) => onToggleSelectMessage?.(m.id));
      return;
    }
    setViewerIndex(index);
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
        className={`message-bubble message-bubble--image${isOwn ? " message-bubble--own" : ""}${selected ? " message-bubble--selected" : ""}`}
      >
        <div className="message-bubble__image-wrap">
          <div className={`image-group image-group--count-${Math.min(count, MAX_TILES)}`}>
            {visible.map((m, index) => (
              <div
                className="image-group__tile"
                key={m.id}
                data-tile-index={index}
                onClick={() => handleTileClick(index)}
              >
                <img
                  className="image-group__img"
                  src={m.product_image ?? undefined}
                  alt="Product"
                  draggable={false}
                />
                {index === MAX_TILES - 1 && remaining > 0 && (
                  <div className="image-group__overlay">+{remaining}</div>
                )}
              </div>
            ))}
          </div>
          <span className="message-bubble__image-time">
            {time}
            {tick}
          </span>
        </div>
      </div>

      {viewerIndex !== null && (
        <ImageViewerModal
          images={messages.map((m) => m.product_image ?? "")}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}
