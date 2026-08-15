import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical, Share2, Trash2, X } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { logout } from "../services/auth";
import { useChatSocket } from "../hooks/useChatSocket";
import { deleteMyGroupMessages, fetchMyGroup, fetchMyGroupMessages } from "../services/groups";
import { downloadImage, shareImageFiles } from "../utils/shareImage";
import type { Message } from "../types/message";
import type { Group } from "../types/group";
import GroupIcon from "../components/admin/GroupIcon";
import MessageList from "../components/chat/MessageList";
import LoadingScreen from "../components/common/LoadingScreen";
import "./UserChat.css";
import "./GroupChat.css";

export default function UserChat() {
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
  const memberCount = (group?.customer_count ?? 0) + 1;

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
      // Share the actual image file(s) via the native share sheet, so apps
      // like WhatsApp/Instagram/Telegram receive a real image attachment
      // instead of a link — never fall back to sharing the URL/text.
      const result = await shareImageFiles(urls, "ak-textiles-image");

      switch (result.status) {
        case "shared":
        case "cancelled":
          break;
        case "unsupported":
          await Promise.all(
            urls.map((url, i) => downloadImage(url, `image-${i + 1}.jpg`)),
          );
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

  return (
    <div className="user-chat-page">
      {selectionMode ? (
        <header className="group-chat-header group-chat-header--selection">
          <button
            className="group-chat-header__icon-btn"
            onClick={() => setSelectedIds(new Set())}
            aria-label="Cancel selection"
          >
            <X size={22} />
          </button>
          <span className="group-chat-header__selection-count">{selectedIds.size}</span>
          <div className="group-chat-header__selection-spacer" />
          <button
            className="group-chat-header__icon-btn"
            onClick={handleShare}
            disabled={isSharing}
            aria-label="Share"
          >
            {isSharing ? (
              <span className="user-chat-page__share-spinner" />
            ) : (
              <Share2 size={20} />
            )}
          </button>
          <button className="group-chat-header__icon-btn" onClick={handleDelete} aria-label="Delete">
            <Trash2 size={20} />
          </button>
        </header>
      ) : (
        <header className="group-chat-header">
          <GroupIcon name={groupName} size={36} />
          <div className="group-chat-header__info">
            <div className="group-chat-header__title">{groupName}</div>
            <div className="group-chat-header__subtitle">{memberCount} members</div>
          </div>
          <button
            className="group-chat-header__icon-btn"
            aria-label="More options"
            onClick={() => navigate("/chat/profile")}
          >
            <MoreVertical size={20} />
          </button>
        </header>
      )}
      <div className="user-chat-page__messages">
        <MessageList
          messages={messages}
          currentUserId={user.id}
          selectedIds={selectedIds}
          onLongPressMessage={handleLongPress}
          onToggleSelectMessage={handleToggleSelect}
        />
      </div>
      <div className="user-chat-page__readonly-bar">
        Only <span className="user-chat-page__readonly-bar-highlight">admins</span> can send
        messages
      </div>
      {shareToast && (
        <div className="user-chat-page__share-toast">
          <span>{shareToast}</span>
        </div>
      )}
    </div>
  );
}
