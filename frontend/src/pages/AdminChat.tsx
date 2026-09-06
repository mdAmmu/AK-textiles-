import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Camera,
  FileText,
  Image as ImageIcon,
  Reply,
  Forward,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteConversationMessages,
  fetchConversationMessages,
  forwardConversationMessages,
  markConversationRead,
  sendAdminDocumentMessage,
  sendAdminImageMessage,
  sendAdminMessage,
  sendAdminProductMessage,
} from "../services/chat";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import type { Message } from "../types/message";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import type { AttachmentOption } from "../components/chat/AttachmentSheet";
import ProductPicker from "../components/chat/ProductPicker";
import ForwardPicker from "../components/chat/ForwardPicker";
import ForwardPreviewBar, { type StagedImage } from "../components/chat/ForwardPreviewBar";
import ReplyPreviewBar from "../components/chat/ReplyPreviewBar";
import LoadingScreen from "../components/common/LoadingScreen";
import { randomUUID } from "../utils/uuid";
import { formatLastSeen } from "../utils/formatLastSeen";
import { CHAT_PAGE } from "./chatShellStyles";

const SELECTION_HEADER =
  "flex items-center gap-3 py-2.5 px-4 bg-[var(--chat-header-bg)] text-[var(--chat-text)] border-b border-[var(--chat-border)] shrink-0";
const SELECTION_ICON_BTN =
  "flex border-none bg-transparent text-[var(--chat-accent)] cursor-pointer p-1 leading-none";
const SELECTION_COUNT = "text-[17px] font-semibold text-[var(--chat-text)]";

export default function AdminChat() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [messages, setMessages] = useState<Message[] | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("Customer");
  const [customerOnline, setCustomerOnline] = useState(false);
  const [customerLastSeen, setCustomerLastSeen] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [draftText, setDraftText] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const selectionMode = selectedIds.size > 0;

  useEffect(() => {
    if (conversationId) {
      fetchConversationMessages(conversationId).then((c) => {
        setMessages(c.messages);
        setCustomerId(c.user_id);
        setCustomerName(c.user_name);
        setCustomerOnline(c.user_online ?? false);
        setCustomerLastSeen(c.user_last_seen ?? null);
        markConversationRead(conversationId);
      });
    }
  }, [conversationId]);

  useChatSocket((event) => {
    if (event.type === "new_message") {
      if (event.message.conversation_id !== conversationId) return;
      setMessages((prev) => {
        if (!prev || prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
      if (conversationId) markConversationRead(conversationId);
      return;
    }
    if (event.type === "messages_read") {
      if (event.conversation_id !== conversationId) return;
      setMessages((prev) =>
        prev?.map((m) =>
          event.message_ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m,
        ) ?? prev,
      );
      return;
    }
    if (event.type === "presence") {
      if (event.user_id !== customerId) return;
      setCustomerOnline(event.online);
      setCustomerLastSeen(event.last_seen_at);
      return;
    }
    if (event.type === "conversation_messages_deleted") {
      if (event.conversation_id !== conversationId) return;
      setMessages(
        (prev) =>
          prev?.map((m) =>
            event.message_ids.includes(m.id) ? { ...m, is_deleted: true } : m,
          ) ?? prev,
      );
    }
  }, !!user && !!conversationId);

  async function handleSend(text: string) {
    if (!conversationId || !user) return;
    if (stagedImages.length > 0) {
      await handleSendStaged(text);
      return;
    }
    if (!text.trim()) return;
    const message = await sendAdminMessage(conversationId, text, replyTarget?.id);
    setMessages((prev) => [...(prev ?? []), message]);
    setReplyTarget(null);
  }

  async function handleSendStaged(text: string) {
    if (!conversationId || !user) return;
    const filesToSend = stagedImages.filter((img) => img.file).map((img) => img.file as File);
    const stagedToClear = stagedImages;
    const trimmed = text.trim();
    const replyToId = replyTarget?.id;

    setStagedImages([]);
    setDraftText("");
    setReplyTarget(null);

    const now = new Date().toISOString();
    const tempImageIds = stagedToClear.map((img) => `temp-${img.key}`);
    const tempTextId = trimmed ? `temp-${randomUUID()}` : null;
    const batchImageGroupId = filesToSend.length > 1 ? randomUUID() : undefined;

    setMessages((prev) => [
      ...(prev ?? []),
      ...stagedToClear.map(
        (img, i): Message => ({
          id: tempImageIds[i],
          conversation_id: conversationId,
          sender_id: user.id,
          message_type: "IMAGE",
          product_image: img.url,
          image_group_id: batchImageGroupId ?? null,
          created_at: now,
          _pending: true,
        }),
      ),
      ...(tempTextId
        ? [
            {
              id: tempTextId,
              conversation_id: conversationId,
              sender_id: user.id,
              message_type: "TEXT" as const,
              text: trimmed,
              created_at: now,
              _pending: true,
            },
          ]
        : []),
    ]);

    try {
      const uploaded = await sendAdminImageMessage(conversationId, filesToSend, replyToId);
      const collected: Message[] = [...uploaded];
      if (tempTextId) {
        collected.push(await sendAdminMessage(conversationId, trimmed, replyToId));
      }
      setMessages((prev) => {
        const withoutTemps =
          prev?.filter((m) => !tempImageIds.includes(m.id) && m.id !== tempTextId) ?? [];
        return [...withoutTemps, ...collected];
      });
    } catch (err) {
      setMessages(
        (prev) => prev?.filter((m) => !tempImageIds.includes(m.id) && m.id !== tempTextId) ?? prev,
      );
      throw err;
    } finally {
      stagedToClear.forEach((img) => {
        if (img.file) URL.revokeObjectURL(img.url);
      });
    }
  }

  async function handlePickProduct(productId: string) {
    if (!conversationId) return;
    const newMessages = await sendAdminProductMessage(conversationId, productId);
    setMessages((prev) => [...(prev ?? []), ...newMessages]);
    setShowPicker(false);
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

  async function handleDocumentPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !conversationId) return;
    const message = await sendAdminDocumentMessage(conversationId, file);
    setMessages((prev) => [...(prev ?? []), message]);
  }

  function handleLongPress(id: string) {
    setSelectedIds(new Set([id]));
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleReplySelected() {
    if (selectedIds.size !== 1 || !messages) return;
    const [id] = Array.from(selectedIds);
    const target = messages.find((m) => m.id === id);
    if (!target || target.is_deleted) return;
    setReplyTarget(target);
    setSelectedIds(new Set());
  }

  async function handleDeleteSelected() {
    if (!conversationId || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await deleteConversationMessages(conversationId, ids);
    setMessages(
      (prev) => prev?.map((m) => (ids.includes(m.id) ? { ...m, is_deleted: true } : m)) ?? prev,
    );
    setSelectedIds(new Set());
  }

  async function handleForward(groupIds: string[]) {
    if (!conversationId || selectedIds.size === 0) return;
    await forwardConversationMessages(conversationId, Array.from(selectedIds), groupIds);
    setShowForward(false);
    setSelectedIds(new Set());
  }

  const attachmentOptions: AttachmentOption[] = [
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
    // Product picker removed from the attachment sheet for now — a better
    // version is planned later. setShowPicker/ProductPicker stay wired so
    // it's a one-line add-back when that lands.
  ];

  if (messages === null || !user) return <LoadingScreen />;

  return (
    <div className={CHAT_PAGE}>
      {selectionMode ? (
        <header className={SELECTION_HEADER}>
          <button
            className={SELECTION_ICON_BTN}
            onClick={() => setSelectedIds(new Set())}
            aria-label="Cancel selection"
          >
            <X size={22} />
          </button>
          <span className={SELECTION_COUNT}>{selectedIds.size}</span>
          <div className="flex-1" />
          {selectedIds.size === 1 && (
            <button className={SELECTION_ICON_BTN} onClick={handleReplySelected} aria-label="Reply">
              <Reply size={20} />
            </button>
          )}
          <button className={SELECTION_ICON_BTN} onClick={() => setShowForward(true)} aria-label="Forward">
            <Forward size={20} />
          </button>
          <button className={SELECTION_ICON_BTN} onClick={handleDeleteSelected} aria-label="Delete">
            <Trash2 size={20} />
          </button>
        </header>
      ) : (
        <ChatHeader
          title={customerName}
          subtitle={customerOnline ? "Online" : formatLastSeen(customerLastSeen)}
          onBack={() => navigate("/admin")}
          onTitleClick={() => navigate(`/admin/chats/${conversationId}/info`)}
        />
      )}

      <MessageList
        messages={messages}
        currentUserId={user.id}
        selectedIds={selectedIds}
        onLongPressMessage={handleLongPress}
        onToggleSelectMessage={handleToggleSelect}
      />

      {replyTarget && (
        <ReplyPreviewBar
          preview={{
            id: replyTarget.id,
            sender_id: replyTarget.sender_id,
            message_type: replyTarget.message_type,
            text: replyTarget.text,
            file_name: replyTarget.file_name,
          }}
          isOwn={replyTarget.sender_id === user.id}
          onCancel={() => setReplyTarget(null)}
        />
      )}

      <ForwardPreviewBar images={stagedImages} onRemove={handleRemoveStagedImage} />

      <MessageInput
        onSend={handleSend}
        value={draftText}
        onChange={setDraftText}
        canSubmitEmpty={stagedImages.length > 0}
        attachmentOptions={attachmentOptions}
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
        onChange={handleDocumentPick}
      />

      {showPicker && (
        <ProductPicker onPick={handlePickProduct} onClose={() => setShowPicker(false)} />
      )}

      {showForward && <ForwardPicker onForward={handleForward} onClose={() => setShowForward(false)} />}
    </div>
  );
}
