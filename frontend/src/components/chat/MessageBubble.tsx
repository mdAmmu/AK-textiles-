import { useRef } from "react";
import { Check, CheckCheck, Clock, Download, FileText } from "lucide-react";
import type { Message } from "../../types/message";
import { downloadImage } from "../../utils/shareImage";
import ProductMessage from "./ProductMessage";
import ImageMessage, { type ImageMessageHandle } from "./ImageMessage";

export const DOCUMENT_ROW = "flex items-center gap-2 py-1 px-1 min-w-[200px]";
export const DOCUMENT_OPEN_BTN =
  "flex items-center gap-2.5 flex-1 min-w-0 border-none bg-transparent p-0 cursor-pointer text-inherit text-left";
export const DOCUMENT_ICON =
  "flex items-center justify-center w-10 h-10 rounded-lg bg-black/[0.06] dark:bg-white/10 shrink-0";
export const DOCUMENT_DOWNLOAD_BTN =
  "flex items-center justify-center w-8 h-8 rounded-full border-none bg-black/[0.06] dark:bg-white/10 cursor-pointer shrink-0 text-inherit";

export const BUBBLE_ROW_BASE = "flex py-0.5 px-3 select-none";
export const BUBBLE_ROW_OWN = "justify-end";
export const BUBBLE_ROW_SELECTED = "bg-[rgba(15,157,110,0.12)]";
export const BUBBLE_ROW_PENDING = "opacity-60";

export const BUBBLE_BASE =
  "max-w-[75%] bg-[var(--chat-bubble-other)] text-[var(--chat-text)] rounded-lg py-1.5 px-2 shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative";
export const BUBBLE_OWN = "bg-[var(--chat-bubble-own)]";
export const BUBBLE_SELECTED = "outline outline-2 outline-[var(--chat-accent)] outline-offset-2";
export const BUBBLE_IMAGE = "px-[3px] py-[3px] overflow-hidden";
export const IMAGE_WRAP = "relative leading-none";
export const IMAGE_TIME =
  "absolute bottom-1.5 right-1.5 flex items-center gap-0.5 bg-black/45 text-white text-[11px] py-[0.0625rem] px-1.5 rounded-lg [line-height:normal]";

export const QUOTE_BLOCK =
  "mb-1 py-1.5 pl-2 pr-2 rounded-md bg-black/[0.06] dark:bg-white/10 border-l-[3px] border-[var(--chat-accent)]";
export const QUOTE_TEXT =
  "text-[13px] text-[var(--chat-text-secondary)] truncate m-0";

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
  highlighted?: boolean;
  onLongPress?: () => void;
  onToggleSelect?: () => void;
  onJumpToReply?: (messageId: string) => void;
}

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

export default function MessageBubble({
  message,
  isOwn,
  selectionMode,
  selected,
  highlighted,
  onLongPress,
  onToggleSelect,
  onJumpToReply,
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

  const quote = message.reply_to && (
    <button
      type="button"
      data-quote-reply="true"
      className={`${QUOTE_BLOCK} block w-full text-left border-none cursor-pointer`}
      onClick={(e) => {
        e.stopPropagation();
        if (!message.reply_to) return;
        onJumpToReply?.(message.reply_to.id);
      }}
    >
      <p className={QUOTE_TEXT}>
        {message.reply_to.is_deleted
          ? "This message was deleted"
          : message.reply_to.message_type === "IMAGE"
            ? "📷 Photo"
            : message.reply_to.message_type === "DOCUMENT"
              ? (message.reply_to.file_name ?? "📄 Document")
              : message.reply_to.message_type === "PRODUCT"
                ? "📦 Product"
                : message.reply_to.text}
      </p>
    </button>
  );

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

  function openDocument() {
    if (message.product_image) window.open(message.product_image, "_blank", "noopener,noreferrer");
  }

  async function downloadDocument() {
    if (!message.product_image) return;
    try {
      await downloadImage(message.product_image, message.file_name ?? "document");
    } catch {
      openDocument();
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    // Prevent the browser's synthetic mouse/click events from firing a
    // second (conflicting) endPress() right after this one. Since that also
    // suppresses the quote/image/document's own onClick, handle those taps
    // here directly instead of relying on the (never-fired) click event.
    const wasTap = !firedRef.current && !movedRef.current;
    const target = e.target as HTMLElement;
    const quoteTapped = target.closest('[data-quote-reply="true"]');
    const docOpenTapped = target.closest('[data-doc-open="true"]');
    const docDownloadTapped = target.closest('[data-doc-download="true"]');
    e.preventDefault();
    touchStartRef.current = null;
    endPress();
    if (wasTap && !selectionMode) {
      if (quoteTapped && message.reply_to) {
        onJumpToReply?.(message.reply_to.id);
        return;
      }
      if (docDownloadTapped) {
        downloadDocument();
        return;
      }
      if (docOpenTapped) {
        openDocument();
        return;
      }
      if (isImage) {
        imageRef.current?.open();
      }
    }
  }

  return (
    <div
      id={`msg-${message.id}`}
      className={`${BUBBLE_ROW_BASE}${isOwn ? ` ${BUBBLE_ROW_OWN}` : ""}${selected ? ` ${BUBBLE_ROW_SELECTED}` : ""}${message._pending ? ` ${BUBBLE_ROW_PENDING}` : ""} transition-colors duration-500${highlighted ? " bg-[rgba(15,157,110,0.18)]" : ""}`}
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
            {quote && <div className="px-1 pt-1">{quote}</div>}
            <ImageMessage ref={imageRef} message={message} selectionMode={selectionMode} />
            <span className={IMAGE_TIME}>
              {time}
              {tick}
            </span>
          </div>
        ) : (
          <>
            {quote}
            {message.message_type === "PRODUCT" ? (
              <ProductMessage message={message} />
            ) : message.message_type === "DOCUMENT" ? (
              <div className={DOCUMENT_ROW}>
                <button
                  type="button"
                  data-doc-open="true"
                  className={DOCUMENT_OPEN_BTN}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDocument();
                  }}
                >
                  <span className={DOCUMENT_ICON}>
                    <FileText size={20} />
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium">
                    {message.file_name ?? "Document"}
                  </span>
                </button>
                <button
                  type="button"
                  data-doc-download="true"
                  className={DOCUMENT_DOWNLOAD_BTN}
                  aria-label="Download"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadDocument();
                  }}
                >
                  <Download size={16} />
                </button>
              </div>
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
