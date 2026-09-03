import { useRef, useState } from "react";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../../types/message";
import ImageViewerModal from "./ImageViewerModal";
import {
  BUBBLE_BASE,
  BUBBLE_IMAGE,
  BUBBLE_OWN,
  BUBBLE_ROW_BASE,
  BUBBLE_ROW_OWN,
  BUBBLE_ROW_SELECTED,
  BUBBLE_SELECTED,
  BUBBLE_TICK_IN_IMAGE,
  IMAGE_TIME,
  IMAGE_WRAP,
} from "./MessageBubble";

const TILE_GRID_BASE = "grid gap-[2px] w-[260px] h-[260px] max-w-full rounded-md overflow-hidden";
const TILE_GRID_COUNT: Record<number, string> = {
  1: "grid-cols-1 grid-rows-1",
  2: "grid-cols-2 grid-rows-1",
  3: "grid-cols-2 grid-rows-2",
  4: "grid-cols-2 grid-rows-2",
};

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
    <span className={BUBBLE_TICK_IN_IMAGE}>
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

  const tileCount = Math.min(count, MAX_TILES);

  return (
    <div
      className={`${BUBBLE_ROW_BASE}${isOwn ? ` ${BUBBLE_ROW_OWN}` : ""}${selected ? ` ${BUBBLE_ROW_SELECTED}` : ""}`}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`${BUBBLE_BASE} ${BUBBLE_IMAGE}${isOwn ? ` ${BUBBLE_OWN}` : ""}${selected ? ` ${BUBBLE_SELECTED}` : ""}`}
      >
        <div className={IMAGE_WRAP}>
          <div className={`${TILE_GRID_BASE} ${TILE_GRID_COUNT[tileCount]}`}>
            {visible.map((m, index) => (
              <div
                className={`relative overflow-hidden cursor-pointer${tileCount === 3 && index === 0 ? " row-span-2" : ""}`}
                key={m.id}
                data-tile-index={index}
                onClick={() => handleTileClick(index)}
              >
                <img
                  className="block w-full h-full object-cover"
                  src={m.product_image ?? undefined}
                  alt="Product"
                  draggable={false}
                />
                {index === MAX_TILES - 1 && remaining > 0 && (
                  <div className="absolute inset-0 bg-black/45 text-white text-2xl font-semibold flex items-center justify-center">
                    +{remaining}
                  </div>
                )}
              </div>
            ))}
          </div>
          <span className={IMAGE_TIME}>
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
