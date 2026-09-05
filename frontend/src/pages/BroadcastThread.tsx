import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  FileText,
  Forward,
  Image as ImageIcon,
  Radio,
  Reply,
  Trash2,
  X,
} from "lucide-react";
import {
  createBroadcast,
  deleteBroadcast,
  fetchAudience,
  fetchBroadcasts,
  forwardBroadcast,
  sendBroadcastMedia,
} from "../services/broadcastMessages";
import type { BroadcastAudienceDetail, BroadcastMessage } from "../types/broadcastMessage";
import LoadingScreen from "../components/common/LoadingScreen";
import MessageInput from "../components/chat/MessageInput";
import type { AttachmentOption } from "../components/chat/AttachmentSheet";
import ForwardPicker from "../components/chat/ForwardPicker";
import ForwardPreviewBar, { type StagedImage } from "../components/chat/ForwardPreviewBar";
import { MAX_GRID_TILES, TILE_GRID_BASE, TILE_GRID_COUNT } from "../components/chat/ImageGroupBubble";
import {
  BUBBLE_IMAGE,
  BUBBLE_ROW_BASE,
  BUBBLE_ROW_OWN,
  IMAGE_TIME,
  IMAGE_WRAP,
} from "../components/chat/MessageBubble";
import { randomUUID } from "../utils/uuid";
import {
  CHAT_BODY,
  CHAT_HEADER_BASE,
  CHAT_HEADER_ICON_BTN,
  CHAT_HEADER_IDENTITY,
  CHAT_HEADER_INFO,
  CHAT_HEADER_SELECTION_COUNT,
  CHAT_HEADER_SELECTION_SPACER,
  CHAT_HEADER_SUBTITLE,
  CHAT_HEADER_TITLE,
  CHAT_PAGE,
} from "./chatShellStyles";

const IN_FLIGHT = new Set(["queued", "processing"]);
const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

const STATUS_LABEL: Record<string, string> = {
  queued: "Sending…",
  processing: "Sending…",
  completed: "Delivered",
  partially_completed: "Partially delivered",
  failed: "Failed to send",
  cancelled: "Cancelled",
  draft: "Draft",
};

function replyLabel(s: BroadcastMessage): string {
  if (s.message_type === "image") return "📷 Photo";
  if (s.message_type === "document") return s.file_name ?? "📄 Document";
  return s.text ?? "";
}

type BroadcastListItem =
  | { kind: "single"; send: BroadcastMessage }
  | { kind: "group"; sends: BroadcastMessage[] };

// Multiple images sent together share an image_group_id (set both by the
// backend and by the optimistic staged-send below) — fold consecutive ones
// into a single grid bubble, matching how the personal/group chat renders
// multi-image sends (see components/chat/MessageList.tsx groupMessages).
function groupSends(sends: BroadcastMessage[]): BroadcastListItem[] {
  const items: BroadcastListItem[] = [];
  let i = 0;
  while (i < sends.length) {
    const s = sends[i];
    if (s.message_type === "image" && s.image_group_id) {
      const groupId = s.image_group_id;
      const group: BroadcastMessage[] = [s];
      let j = i + 1;
      while (
        j < sends.length &&
        sends[j].message_type === "image" &&
        sends[j].image_group_id === groupId
      ) {
        group.push(sends[j]);
        j++;
      }
      items.push({ kind: "group", sends: group });
      i = j;
    } else {
      items.push({ kind: "single", send: s });
      i++;
    }
  }
  return items;
}

export default function BroadcastThread() {
  const { audienceId } = useParams<{ audienceId: string }>();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [audience, setAudience] = useState<BroadcastAudienceDetail | null>(null);
  const [sends, setSends] = useState<BroadcastMessage[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showForward, setShowForward] = useState(false);
  const [replyTarget, setReplyTarget] = useState<BroadcastMessage | null>(null);
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [draftText, setDraftText] = useState("");

  const selectionMode = selectedIds.size > 0;

  const load = useCallback(() => {
    if (!audienceId) return;
    fetchAudience(audienceId).then(setAudience);
    fetchBroadcasts(undefined, audienceId).then((rows) =>
      setSends([...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))),
    );
  }, [audienceId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!sends || !sends.some((s) => IN_FLIGHT.has(s.status))) return;
    const interval = setInterval(load, 2500);
    return () => clearInterval(interval);
  }, [sends, load]);

  async function handleSend(text: string) {
    if (!audienceId || !audience) return;
    if (stagedImages.length > 0) {
      await handleSendStaged(text);
      return;
    }
    if (!text.trim()) return;

    const optimistic: BroadcastMessage = {
      id: `temp-${randomUUID()}`,
      status: "queued",
      message_type: "text",
      text: text.trim(),
      total_recipients: audience.member_count,
      sent_count: 0,
      failed_count: 0,
      delivered_count: 0,
      read_count: 0,
      created_at: new Date().toISOString(),
    };
    setSends((prev) => [...(prev ?? []), optimistic]);
    const replyToId = replyTarget?.id;
    setReplyTarget(null);
    try {
      await createBroadcast({
        text: text.trim(),
        audience_ids: [audienceId],
        send_mode: "now",
        idempotency_key: randomUUID(),
        reply_to_broadcast_id: replyToId,
      });
      load();
    } catch {
      setSends((prev) => prev?.filter((s) => s.id !== optimistic.id) ?? prev);
    }
  }

  async function handleSendStaged(text: string) {
    if (!audienceId || !audience) return;
    const filesToSend = stagedImages.filter((img) => img.file).map((img) => img.file as File);
    const stagedToClear = stagedImages;
    const trimmed = text.trim();
    const replyToId = replyTarget?.id;

    setStagedImages([]);
    setDraftText("");
    setReplyTarget(null);
    setError(null);

    const now = new Date().toISOString();
    const optimisticImages: BroadcastMessage[] = stagedToClear.map((img) => ({
      id: `temp-${img.key}`,
      status: "queued",
      message_type: "image",
      media_url: img.url,
      total_recipients: audience.member_count,
      sent_count: 0,
      failed_count: 0,
      delivered_count: 0,
      read_count: 0,
      created_at: now,
    }));
    const tempTextId = trimmed ? `temp-${randomUUID()}` : null;
    const optimisticText: BroadcastMessage | null = tempTextId
      ? {
          id: tempTextId,
          status: "queued",
          message_type: "text",
          text: trimmed,
          total_recipients: audience.member_count,
          sent_count: 0,
          failed_count: 0,
          delivered_count: 0,
          read_count: 0,
          created_at: now,
        }
      : null;

    setSends((prev) => [...(prev ?? []), ...optimisticImages, ...(optimisticText ? [optimisticText] : [])]);

    try {
      await sendBroadcastMedia(audienceId, filesToSend, replyToId);
      if (trimmed) {
        await createBroadcast({
          text: trimmed,
          audience_ids: [audienceId],
          send_mode: "now",
          idempotency_key: randomUUID(),
          reply_to_broadcast_id: replyToId,
        });
      }
      load();
    } catch {
      const optimisticIds = [...optimisticImages.map((m) => m.id), ...(optimisticText ? [optimisticText.id] : [])];
      setSends((prev) => prev?.filter((s) => !optimisticIds.includes(s.id)) ?? prev);
      setError("Couldn't send. Please try again.");
    } finally {
      stagedToClear.forEach((img) => {
        if (img.file) URL.revokeObjectURL(img.url);
      });
    }
  }

  function handlePickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0) return;
    const newItems: StagedImage[] = files.map((file) => ({
      key: `new-${randomUUID()}`,
      url: URL.createObjectURL(file),
      file,
    }));
    setStagedImages((prev) => [...prev, ...newItems]);
  }

  function handleRemoveStagedImage(key: string) {
    setStagedImages((prev) => {
      const target = prev.find((img) => img.key === key);
      if (target?.file) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.key !== key);
    });
  }

  async function handlePickDocument(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !audienceId || !audience) return;
    setError(null);

    const optimistic: BroadcastMessage = {
      id: `temp-${randomUUID()}`,
      status: "queued",
      message_type: "document",
      file_name: file.name,
      total_recipients: audience.member_count,
      sent_count: 0,
      failed_count: 0,
      delivered_count: 0,
      read_count: 0,
      created_at: new Date().toISOString(),
    };
    setSends((prev) => [...(prev ?? []), optimistic]);
    const replyToId = replyTarget?.id;
    setReplyTarget(null);
    try {
      await sendBroadcastMedia(audienceId, [file], replyToId);
      load();
    } catch {
      setSends((prev) => prev?.filter((s) => s.id !== optimistic.id) ?? prev);
      setError("Couldn't send that file. Please try again.");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleReplySelected() {
    if (selectedIds.size !== 1 || !sends) return;
    const [id] = Array.from(selectedIds);
    const target = sends.find((s) => s.id === id);
    if (!target || IN_FLIGHT.has(target.status)) return;
    setReplyTarget(target);
    setSelectedIds(new Set());
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => deleteBroadcast(id)));
    setSends((prev) => prev?.filter((s) => !ids.includes(s.id)) ?? prev);
    setSelectedIds(new Set());
  }

  async function handleForward(groupIds: string[]) {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map((id) => forwardBroadcast(id, groupIds)));
    setShowForward(false);
    setSelectedIds(new Set());
  }

  if (!audience || !sends) return <LoadingScreen />;

  return (
    <div className={CHAT_PAGE}>
      {selectionMode ? (
        <header className={CHAT_HEADER_BASE}>
          <button
            className={CHAT_HEADER_ICON_BTN}
            onClick={() => setSelectedIds(new Set())}
            aria-label="Cancel selection"
          >
            <X size={22} />
          </button>
          <span className={CHAT_HEADER_SELECTION_COUNT}>{selectedIds.size}</span>
          <div className={CHAT_HEADER_SELECTION_SPACER} />
          {selectedIds.size === 1 && (
            <button className={CHAT_HEADER_ICON_BTN} onClick={handleReplySelected} aria-label="Reply">
              <Reply size={20} />
            </button>
          )}
          <button className={CHAT_HEADER_ICON_BTN} onClick={() => setShowForward(true)} aria-label="Forward">
            <Forward size={20} />
          </button>
          <button className={CHAT_HEADER_ICON_BTN} onClick={handleDeleteSelected} aria-label="Delete">
            <Trash2 size={20} />
          </button>
        </header>
      ) : (
        <header className={CHAT_HEADER_BASE}>
          <button className={CHAT_HEADER_ICON_BTN} onClick={() => navigate("/admin/broadcast")} aria-label="Back">
            <ArrowLeft size={22} />
          </button>
          <button
            className={CHAT_HEADER_IDENTITY}
            onClick={() => navigate(`/admin/broadcast/${audienceId}/info`)}
          >
            <span className="w-9 h-9 rounded-full bg-[#e6edff] flex items-center justify-center shrink-0">
              <Radio size={18} color="#2563eb" />
            </span>
            <div className={CHAT_HEADER_INFO}>
              <div className={CHAT_HEADER_TITLE}>{audience.name}</div>
              <div className={CHAT_HEADER_SUBTITLE}>{audience.member_count} recipients</div>
            </div>
          </button>
        </header>
      )}

      <div className={CHAT_BODY}>
        {sends.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center text-[var(--chat-text-secondary)] px-8">
            <Radio size={36} />
            <p>
              Nothing sent yet. Type a message, or attach images/a PDF below — it'll go out as a
              private message to every recipient in this broadcast.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-1">
            {groupSends(sends).map((item) => {
              if (item.kind === "group") {
                const last = item.sends[item.sends.length - 1];
                return (
                  <div key={item.sends[0].id} className={`${BUBBLE_ROW_BASE} ${BUBBLE_ROW_OWN}`}>
                    <BroadcastImageGroupBubble
                      sends={item.sends}
                      selected={item.sends.every((s) => selectedIds.has(s.id))}
                      selectionMode={selectionMode}
                      onOpen={() =>
                        !last.id.startsWith("temp-") &&
                        navigate(`/admin/broadcast/${audienceId}/message/${last.id}`)
                      }
                      onToggleSelect={() => item.sends.forEach((s) => toggleSelect(s.id))}
                      onLongPress={() => setSelectedIds(new Set(item.sends.map((s) => s.id)))}
                    />
                  </div>
                );
              }
              const s = item.send;
              return (
                <div key={s.id} className={`${BUBBLE_ROW_BASE} ${BUBBLE_ROW_OWN}`}>
                  <BroadcastBubble
                    send={s}
                    selected={selectedIds.has(s.id)}
                    selectionMode={selectionMode}
                    onOpen={() =>
                      !s.id.startsWith("temp-") &&
                      navigate(`/admin/broadcast/${audienceId}/message/${s.id}`)
                    }
                    onToggleSelect={() => toggleSelect(s.id)}
                    onLongPress={() => setSelectedIds(new Set([s.id]))}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <p className="text-[#e5484d] text-sm text-center py-1 m-0">{error}</p>}

      {replyTarget && (
        <div className="flex items-center gap-2 py-2 px-3.5 bg-white dark:bg-[#1e2530] border-l-[3px] border-[#2563eb]">
          <Reply size={16} className="text-[#2563eb] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[#2563eb] text-[13px] font-semibold">Replying to</div>
            <div className="text-[#7c827e] dark:text-[#8b96a5] text-[13px] truncate">
              {replyLabel(replyTarget)}
            </div>
          </div>
          <button
            type="button"
            className="flex border-none bg-transparent text-[#7c827e] dark:text-[#8b96a5] cursor-pointer p-0.5"
            onClick={() => setReplyTarget(null)}
            aria-label="Cancel reply"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <ForwardPreviewBar images={stagedImages} onRemove={handleRemoveStagedImage} />

      <MessageInput
        onSend={handleSend}
        value={draftText}
        onChange={setDraftText}
        canSubmitEmpty={stagedImages.length > 0}
        attachmentOptions={[
          {
            key: "document",
            label: "Document",
            icon: <FileText size={24} />,
            onClick: () => documentInputRef.current?.click(),
          },
          {
            key: "camera",
            label: "Camera",
            icon: <Camera size={24} />,
            onClick: () => cameraInputRef.current?.click(),
          },
          {
            key: "gallery",
            label: "Gallery",
            icon: <ImageIcon size={24} />,
            onClick: () => imageInputRef.current?.click(),
          },
        ] satisfies AttachmentOption[]}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handlePickImages}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handlePickImages}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword"
        hidden
        onChange={handlePickDocument}
      />

      {showForward && <ForwardPicker onForward={handleForward} onClose={() => setShowForward(false)} />}
    </div>
  );
}

interface BubbleProps {
  send: BroadcastMessage;
  selected: boolean;
  selectionMode: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
  onLongPress: () => void;
}

function BroadcastBubble({ send, selected, selectionMode, onOpen, onToggleSelect, onLongPress }: BubbleProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const movedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function startPress() {
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
    // A scroll/drag gesture, not a tap — don't treat it as open/select.
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    if (selectionMode) onToggleSelect();
    else onOpen();
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

  function handleTouchEnd() {
    touchStartRef.current = null;
    endPress();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`max-w-[85%] text-left bg-[#dbeafe] dark:bg-[#0b3d24] rounded-xl rounded-tr-sm py-2 px-2.5 border-none cursor-pointer overflow-hidden select-none ${
        selected ? "outline outline-2 outline-[#2563eb] outline-offset-2" : ""
      }`}
    >
      {send.message_type === "image" && send.media_url ? (
        <img
          src={send.media_url}
          alt=""
          className="rounded-lg max-h-[220px] w-full object-cover -mx-0.5"
        />
      ) : send.message_type === "document" ? (
        <div className="flex items-center gap-2.5 py-1.5 px-1">
          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/60 dark:bg-black/20 shrink-0">
            <FileText size={18} className="text-[#1a1a1a] dark:text-[#e9edef]" />
          </span>
          <span className="text-[#1a1a1a] dark:text-[#e9edef] text-sm truncate">
            {send.file_name ?? "Document"}
          </span>
        </div>
      ) : (
        <p className="whitespace-pre-wrap text-[#1a1a1a] dark:text-[#e9edef] text-[15px] m-0 px-1">
          {send.text}
        </p>
      )}
      <div className="flex items-center justify-end gap-2 mt-1 px-1">
        <span className="text-[#3b5bdb] dark:text-[#93b4f5] text-[11px]">
          {STATUS_LABEL[send.status] ?? send.status}
        </span>
      </div>
    </div>
  );
}

interface GroupBubbleProps {
  sends: BroadcastMessage[];
  selected: boolean;
  selectionMode: boolean;
  onOpen: () => void;
  onToggleSelect: () => void;
  onLongPress: () => void;
}

function BroadcastImageGroupBubble({
  sends,
  selected,
  selectionMode,
  onOpen,
  onToggleSelect,
  onLongPress,
}: GroupBubbleProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const movedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  function startPress() {
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
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    if (selectionMode) onToggleSelect();
    else onOpen();
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

  function handleTouchEnd() {
    touchStartRef.current = null;
    endPress();
  }

  const last = sends[sends.length - 1];
  const count = sends.length;
  const tileCount = Math.min(count, MAX_GRID_TILES);
  const visible = sends.slice(0, MAX_GRID_TILES);
  const remaining = count - MAX_GRID_TILES;

  return (
    <div
      role="button"
      tabIndex={0}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`max-w-[85%] text-left bg-[#dbeafe] dark:bg-[#0b3d24] rounded-xl rounded-tr-sm border-none cursor-pointer overflow-hidden select-none ${BUBBLE_IMAGE} ${
        selected ? "outline outline-2 outline-[#2563eb] outline-offset-2" : ""
      }`}
    >
      <div className={IMAGE_WRAP}>
        <div className={`${TILE_GRID_BASE} ${TILE_GRID_COUNT[tileCount]}`}>
          {visible.map((s, index) => (
            <div
              className={`relative overflow-hidden${tileCount === 3 && index === 0 ? " row-span-2" : ""}`}
              key={s.id}
            >
              <img
                className="block w-full h-full object-cover"
                src={s.media_url ?? undefined}
                alt=""
                draggable={false}
              />
              {index === MAX_GRID_TILES - 1 && remaining > 0 && (
                <div className="absolute inset-0 bg-black/45 text-white text-2xl font-semibold flex items-center justify-center">
                  +{remaining}
                </div>
              )}
            </div>
          ))}
        </div>
        <span className={IMAGE_TIME}>{STATUS_LABEL[last.status] ?? last.status}</span>
      </div>
    </div>
  );
}
