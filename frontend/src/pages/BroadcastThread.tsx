import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Forward,
  Image as ImageIcon,
  Paperclip,
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
import MessageInput, { MESSAGE_INPUT_ICON_CLASS } from "../components/chat/MessageInput";
import ForwardPicker from "../components/chat/ForwardPicker";
import ForwardPreviewBar, { type StagedImage } from "../components/chat/ForwardPreviewBar";
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

export default function BroadcastThread() {
  const { audienceId } = useParams<{ audienceId: string }>();
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
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
          <div className={CHAT_HEADER_IDENTITY}>
            <span className="w-9 h-9 rounded-full bg-[#e3f7ec] flex items-center justify-center shrink-0">
              <Radio size={18} color="#0f9d6e" />
            </span>
            <div className={CHAT_HEADER_INFO}>
              <div className={CHAT_HEADER_TITLE}>{audience.name}</div>
              <div className={CHAT_HEADER_SUBTITLE}>{audience.member_count} recipients</div>
            </div>
          </div>
        </header>
      )}

      <div className={`${CHAT_BODY} overflow-y-auto px-3.5 py-3 gap-2 flex flex-col`}>
        {sends.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center text-[var(--chat-text-secondary)] px-8">
            <Radio size={36} />
            <p>
              Nothing sent yet. Type a message, or attach images/a PDF below — it'll go out as a
              private message to every recipient in this broadcast.
            </p>
          </div>
        ) : (
          sends.map((s) => (
            <BroadcastBubble
              key={s.id}
              send={s}
              selected={selectedIds.has(s.id)}
              selectionMode={selectionMode}
              onOpen={() =>
                !s.id.startsWith("temp-") && navigate(`/admin/broadcast/${audienceId}/message/${s.id}`)
              }
              onToggleSelect={() => toggleSelect(s.id)}
              onLongPress={() => setSelectedIds(new Set([s.id]))}
            />
          ))
        )}
      </div>

      {error && <p className="text-[#e5484d] text-sm text-center py-1 m-0">{error}</p>}

      {replyTarget && (
        <div className="flex items-center gap-2 py-2 px-3.5 bg-white dark:bg-[#1e2530] border-l-[3px] border-[#0f9d6e]">
          <Reply size={16} className="text-[#0f9d6e] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[#0f9d6e] text-[13px] font-semibold">Replying to</div>
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
        extraAction={
          <>
            <span
              className={MESSAGE_INPUT_ICON_CLASS}
              onClick={() => imageInputRef.current?.click()}
              role="button"
              aria-label="Send images"
            >
              <ImageIcon size={20} />
            </span>
            <span
              className={MESSAGE_INPUT_ICON_CLASS}
              onClick={() => documentInputRef.current?.click()}
              role="button"
              aria-label="Send a document"
            >
              <Paperclip size={20} />
            </span>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
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
          </>
        }
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

  function startPress() {
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

  function endPress() {
    cancelPress();
    if (firedRef.current) {
      firedRef.current = false;
      return;
    }
    if (selectionMode) onToggleSelect();
    else onOpen();
  }

  return (
    <button
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={(e) => {
        e.preventDefault();
        endPress();
      }}
      className={`self-end max-w-[85%] text-left bg-[#dcf8c6] dark:bg-[#0b3d24] rounded-xl rounded-tr-sm py-2 px-2.5 border-none cursor-pointer overflow-hidden select-none ${
        selected ? "outline outline-2 outline-[#0f9d6e] outline-offset-2" : ""
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
        <span className="text-[#4f7a5f] dark:text-[#7fbf9c] text-[11px]">
          {STATUS_LABEL[send.status] ?? send.status}
          {send.status === "completed" || send.status === "partially_completed"
            ? ` · ${send.sent_count}/${send.total_recipients} sent`
            : ""}
        </span>
      </div>
    </button>
  );
}
