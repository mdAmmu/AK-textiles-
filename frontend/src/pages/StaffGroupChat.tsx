import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Share2, Trash2, X } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { logout } from "../services/auth";
import { useChatSocket } from "../hooks/useChatSocket";
import {
  deleteMyGroupMessages,
  fetchMyGroup,
  fetchMyGroupMessages,
  sendMyGroupMessage,
} from "../services/groups";
import { downloadImage, shareImageFiles } from "../utils/shareImage";
import type { Message } from "../types/message";
import type { Group } from "../types/group";
import GroupIcon from "../components/admin/GroupIcon";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
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

// Manager/staff home screen: the shared Group thread, where staff can post
// alongside the admin — unlike customers, who only ever see their own
// private/broadcast conversation (see CustomerChat.tsx).
export default function StaffGroupChat() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

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
    if (!text.trim() || !user || !group) return;
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
      <MessageInput onSend={handleSend} disabled={!group} />
      {shareToast && (
        <div className="fixed left-1/2 bottom-[4.5rem] -translate-x-1/2 z-30 pointer-events-none bg-[#111] text-white text-[13px] font-medium py-2 px-4 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.25)]">
          <span>{shareToast}</span>
        </div>
      )}
    </div>
  );
}
