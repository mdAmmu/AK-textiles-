import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, FileText, Image as ImageIcon, MoreVertical, Share2, Trash2, X } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { logout } from "../services/auth";
import { useChatSocket } from "../hooks/useChatSocket";
import {
  deleteMyGroupMessages,
  fetchMyGroup,
  fetchMyGroupMessages,
  sendMyGroupDocumentMessage,
  sendMyGroupImageMessage,
  sendMyGroupMessage,
} from "../services/groups";
import { downloadImage, shareImageFiles } from "../utils/shareImage";
import type { Message } from "../types/message";
import type { Group } from "../types/group";
import GroupIcon from "../components/admin/GroupIcon";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import type { AttachmentOption } from "../components/chat/AttachmentSheet";
import ForwardPreviewBar, { type StagedImage } from "../components/chat/ForwardPreviewBar";
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

// Home screen for anyone assigned to a Group: a real multi-member group
// chat — every member (any role) sees every other member's text/image/file
// messages, like a normal WhatsApp group. Only members with no group at all
// get their own private 1-1/broadcast conversation (see CustomerChat.tsx).
export default function StaffGroupChat() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [draftText, setDraftText] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const selectionMode = selectedIds.size > 0;

  useEffect(() => {
    fetchMyGroup().then(setGroup);
    fetchMyGroupMessages().then(setMessages);
  }, []);

  useChatSocket((event) => {
    if (event.type === "new_group_message") {
      if (group && event.group_id !== group.id) return;
      setMessages((prev) => {
        if (!prev || prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
    }
    if (event.type === "group_messages_deleted") {
      if (group && event.group_id !== group.id) return;
      setMessages((prev) => prev?.filter((m) => !event.message_ids.includes(m.id)) ?? prev);
    }
    if (event.type === "group_deleted") {
      if (group && event.group_id !== group.id) return;
      logout();
      navigate("/login", { replace: true });
    }
  }, !!user && !!group);

  if (messages === null || !user) return <LoadingScreen />;

  const groupName = group?.name ?? "Admin";

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

  function showToast(message: string) {
    setShareToast(message);
    setTimeout(() => setShareToast(null), 2500);
  }

  async function handleShare() {
    if (isSharing || !messages || selectedIds.size === 0) return;
    const urls = messages
      .filter((m) => selectedIds.has(m.id) && m.message_type === "IMAGE")
      .map((m) => m.product_image)
      .filter((u): u is string => !!u);
    if (urls.length === 0) return;

    setIsSharing(true);
    try {
      const result = await shareImageFiles(urls, "ak-textiles-image");
      switch (result.status) {
        case "shared":
        case "cancelled":
          break;
        case "unsupported":
          await Promise.all(urls.map((url, i) => downloadImage(url, `image-${i + 1}.jpg`)));
          showToast("Sharing isn't supported here — images downloaded instead");
          break;
        case "fetch-error":
          console.error("Failed to fetch image for sharing", result.error);
          showToast("Unable to prepare the image for sharing. Please try again.");
          break;
        case "share-error":
          console.error("Failed to share image", result.error);
          showToast("Couldn't share the image. Please try again.");
          break;
      }
    } finally {
      setIsSharing(false);
      setSelectedIds(new Set());
    }
  }

  async function handleDelete() {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await deleteMyGroupMessages(ids);
    setMessages(
      (prev) => prev?.map((m) => (ids.includes(m.id) ? { ...m, is_deleted: true } : m)) ?? prev,
    );
    setSelectedIds(new Set());
  }

  async function handleSend(text: string) {
    if (!user || !group) return;
    if (stagedImages.length > 0) {
      await handleSendStaged(text);
      return;
    }
    if (!text.trim()) return;

    const tempId = `temp-${randomUUID()}`;
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: tempId,
        group_id: group.id,
        sender_id: user.id,
        message_type: "TEXT",
        text,
        created_at: new Date().toISOString(),
        _pending: true,
      },
    ]);
    try {
      const message = await sendMyGroupMessage(text);
      setMessages((prev) => prev?.map((m) => (m.id === tempId ? message : m)) ?? prev);
    } catch (err) {
      setMessages((prev) => prev?.filter((m) => m.id !== tempId) ?? prev);
      throw err;
    }
  }

  async function handleSendStaged(text: string) {
    if (!user || !group) return;
    const filesToSend = stagedImages.filter((img) => img.file).map((img) => img.file as File);
    const stagedToClear = stagedImages;
    const trimmed = text.trim();

    setStagedImages([]);
    setDraftText("");

    const now = new Date().toISOString();
    const tempImageIds = stagedToClear.map((img) => `temp-${img.key}`);
    const tempTextId = trimmed ? `temp-${randomUUID()}` : null;
    const batchImageGroupId = filesToSend.length > 1 ? randomUUID() : undefined;

    setMessages((prev) => [
      ...(prev ?? []),
      ...stagedToClear.map(
        (img, i): Message => ({
          id: tempImageIds[i],
          group_id: group.id,
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
              group_id: group.id,
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
      const uploaded = await sendMyGroupImageMessage(filesToSend, batchImageGroupId);
      const collected: Message[] = [...uploaded];
      if (tempTextId) {
        collected.push(await sendMyGroupMessage(trimmed));
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
    if (!file || !user || !group) return;
    const tempId = `temp-${randomUUID()}`;
    setMessages((prev) => [
      ...(prev ?? []),
      {
        id: tempId,
        group_id: group.id,
        sender_id: user.id,
        message_type: "DOCUMENT",
        file_name: file.name,
        created_at: new Date().toISOString(),
        _pending: true,
      },
    ]);
    try {
      const message = await sendMyGroupDocumentMessage(file);
      setMessages((prev) => prev?.map((m) => (m.id === tempId ? message : m)) ?? prev);
    } catch (err) {
      setMessages((prev) => prev?.filter((m) => m.id !== tempId) ?? prev);
      throw err;
    }
  }

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
          <button
            className={CHAT_HEADER_ICON_BTN}
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
          >
            {isSharing ? (
              <span className="block w-[1.1rem] h-[1.1rem] rounded-full border-2 border-white/40 border-t-white animate-[spin_0.7s_linear_infinite]" />
            ) : (
              <Share2 size={20} />
            )}
          </button>
          <button className={CHAT_HEADER_ICON_BTN} onClick={handleDelete} aria-label="Delete">
            <Trash2 size={20} />
          </button>
        </header>
      ) : (
        <header className={CHAT_HEADER_BASE}>
          <GroupIcon name={groupName} size={36} />
          <div className={CHAT_HEADER_INFO}>
            <div className={CHAT_HEADER_TITLE}>{groupName}</div>
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

      <ForwardPreviewBar images={stagedImages} onRemove={handleRemoveStagedImage} />

      <MessageInput
        onSend={handleSend}
        value={draftText}
        onChange={setDraftText}
        canSubmitEmpty={stagedImages.length > 0}
        disabled={!group}
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
      {shareToast && (
        <div className="fixed left-1/2 bottom-[4.5rem] -translate-x-1/2 z-30 pointer-events-none bg-[#111] text-white text-[13px] font-medium py-2 px-4 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.25)]">
          <span>{shareToast}</span>
        </div>
      )}
    </div>
  );
}
