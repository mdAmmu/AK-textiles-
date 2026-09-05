import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, FileText, Image as ImageIcon, MoreVertical, Reply, Trash2, X } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import {
  deleteMyConversationMessages,
  fetchMyConversation,
  markMyConversationRead,
  sendMyDocumentMessage,
  sendMyImageMessage,
  sendMyMessage,
} from "../services/chat";
import type { Message } from "../types/message";
import GroupIcon from "../components/admin/GroupIcon";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import type { AttachmentOption } from "../components/chat/AttachmentSheet";
import ForwardPreviewBar, { type StagedImage } from "../components/chat/ForwardPreviewBar";
import ReplyPreviewBar from "../components/chat/ReplyPreviewBar";
import LoadingScreen from "../components/common/LoadingScreen";
import { randomUUID } from "../utils/uuid";
import {
  CHAT_BODY,
  CHAT_HEADER_BASE,
  CHAT_HEADER_ICON_BTN,
  CHAT_HEADER_INFO,
  CHAT_HEADER_SELECTION_COUNT,
  CHAT_HEADER_SELECTION_SPACER,
  CHAT_HEADER_TITLE,
  CHAT_PAGE,
} from "./chatShellStyles";

// Every customer's home screen: their own private 1-1 conversation with the
// business. Broadcast messages land here indistinguishably from a message
// the admin typed directly — this is deliberate (see broadcast-working.md):
// a broadcast is never a group thread, it's many private conversations.
export default function CustomerChat() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [draftText, setDraftText] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const selectionMode = selectedIds.size > 0;

  useEffect(() => {
    fetchMyConversation().then((c) => {
      setConversationId(c.id);
      setMessages(c.messages);
      markMyConversationRead();
    });
  }, []);

  useChatSocket((event) => {
    if (event.type === "new_message") {
      setMessages((prev) => {
        if (!prev || prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
      markMyConversationRead();
      return;
    }
    if (event.type === "messages_read") {
      if (event.conversation_id !== conversationId) return;
      setMessages(
        (prev) =>
          prev?.map((m) =>
            event.message_ids.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m,
          ) ?? prev,
      );
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
    if (!user) return;
    if (stagedImages.length > 0) {
      await handleSendStaged(text);
      return;
    }
    if (!text.trim()) return;

    const tempId = `temp-${randomUUID()}`;
    const replyToId = replyTarget?.id;
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: tempId,
        conversation_id: conversationId,
        sender_id: user.id,
        message_type: "TEXT",
        text,
        created_at: new Date().toISOString(),
        _pending: true,
      },
    ]);
    setReplyTarget(null);
    try {
      const message = await sendMyMessage(text, replyToId);
      setMessages((prev) => prev?.map((m) => (m.id === tempId ? message : m)) ?? prev);
    } catch (err) {
      setMessages((prev) => prev?.filter((m) => m.id !== tempId) ?? prev);
      throw err;
    }
  }

  async function handleSendStaged(text: string) {
    if (!user) return;
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
      const uploaded = await sendMyImageMessage(filesToSend, replyToId);
      const collected: Message[] = [...uploaded];
      if (tempTextId) {
        collected.push(await sendMyMessage(trimmed, replyToId));
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
    if (!file || !user) return;
    const tempId = `temp-${randomUUID()}`;
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: tempId,
        conversation_id: conversationId,
        sender_id: user.id,
        message_type: "DOCUMENT",
        file_name: file.name,
        created_at: new Date().toISOString(),
        _pending: true,
      },
    ]);
    try {
      const message = await sendMyDocumentMessage(file);
      setMessages((prev) => prev?.map((m) => (m.id === tempId ? message : m)) ?? prev);
    } catch (err) {
      setMessages((prev) => prev?.filter((m) => m.id !== tempId) ?? prev);
      throw err;
    }
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
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await deleteMyConversationMessages(ids);
    setMessages(
      (prev) => prev?.map((m) => (ids.includes(m.id) ? { ...m, is_deleted: true } : m)) ?? prev,
    );
    setSelectedIds(new Set());
  }

  if (messages === null || !user) return <LoadingScreen />;

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
          <button className={CHAT_HEADER_ICON_BTN} onClick={handleDeleteSelected} aria-label="Delete">
            <Trash2 size={20} />
          </button>
        </header>
      ) : (
        <header className={CHAT_HEADER_BASE}>
          <GroupIcon name="AK Textiles" size={36} />
          <div className={CHAT_HEADER_INFO}>
            <div className={CHAT_HEADER_TITLE}>AK Textiles</div>
          </div>
          <button
            className={CHAT_HEADER_ICON_BTN}
            aria-label="More options"
            onClick={() => navigate("/chat/profile")}
          >
            <MoreVertical size={20} />
          </button>
        </header>
      )}

      <div className={CHAT_BODY}>
        <MessageList
          messages={messages}
          currentUserId={user.id}
          selectedIds={selectedIds}
          onLongPressMessage={handleLongPress}
          onToggleSelectMessage={handleToggleSelect}
        />
      </div>

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
    </div>
  );
}
