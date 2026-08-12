import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Forward, MoreVertical, Package, Trash2, X } from "lucide-react";
import {
  deleteGroupMessages,
  fetchGroupMessages,
  fetchGroups,
  forwardGroupMessages,
  sendGroupImageMessage,
  sendGroupMessage,
  sendGroupProductMessage,
} from "../services/groups";
import type { Group } from "../types/group";
import type { Message } from "../types/message";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import GroupIcon from "../components/admin/GroupIcon";
import MessageList from "../components/chat/MessageList";
import MessageInput from "../components/chat/MessageInput";
import GroupProductComposer from "../components/chat/GroupProductComposer";
import ForwardPicker from "../components/chat/ForwardPicker";
import LoadingScreen from "../components/common/LoadingScreen";
import "./UserChat.css";
import "./GroupChat.css";
import "./AdminChat.css";

export default function GroupChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const selectionMode = selectedIds.size > 0;

  useEffect(() => {
    if (!groupId) return;
    fetchGroups().then((all) => setGroup(all.find((g) => g.id === groupId) ?? null));
    fetchGroupMessages(groupId).then(setMessages);
  }, [groupId]);

  useChatSocket((event) => {
    if (event.type === "new_group_message") {
      if (event.group_id !== groupId) return;
      setMessages((prev) => {
        if (!prev || prev.some((m) => m.id === event.message.id)) return prev;
        return [...prev, event.message];
      });
    }
    if (event.type === "group_messages_deleted") {
      if (event.group_id !== groupId) return;
      setMessages((prev) => prev?.filter((m) => !event.message_ids.includes(m.id)) ?? prev);
    }
  }, !!user && !!groupId);

  async function handleSend(text: string) {
    if (!groupId) return;
    const message = await sendGroupMessage(groupId, text);
    setMessages((prev) => [...(prev ?? []), message]);
  }

  function handleProductSent(newMessages: Message[]) {
    setMessages((prev) => [...(prev ?? []), ...newMessages]);
    setShowPicker(false);
  }

  async function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !groupId) return;
    const message = await sendGroupImageMessage(groupId, file);
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

  async function handleDelete() {
    if (!groupId || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await deleteGroupMessages(groupId, ids);
    setMessages((prev) => prev?.filter((m) => !ids.includes(m.id)) ?? prev);
    setSelectedIds(new Set());
  }

  async function handleForward(targetGroupIds: string[]) {
    if (!groupId || selectedIds.size === 0) return;
    await forwardGroupMessages(groupId, Array.from(selectedIds), targetGroupIds);
    setShowForward(false);
    setSelectedIds(new Set());
  }

  if (group === null || messages === null || !user) return <LoadingScreen />;

  return (
    <div className="user-chat-page admin-chat-page">
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
            onClick={() => setShowForward(true)}
            aria-label="Forward"
          >
            <Forward size={20} />
          </button>
          <button className="group-chat-header__icon-btn" onClick={handleDelete} aria-label="Delete">
            <Trash2 size={20} />
          </button>
        </header>
      ) : (
        <header className="group-chat-header">
          <button
            className="group-chat-header__icon-btn"
            onClick={() => navigate("/admin")}
            aria-label="Back"
          >
            <ArrowLeft size={22} />
          </button>
          <button
            className="group-chat-header__identity"
            onClick={() => navigate(`/admin/groups/${groupId}/chat/info`)}
          >
            <GroupIcon name={group.name} size={36} />
            <div className="group-chat-header__info">
              <div className="group-chat-header__title">{group.name}</div>
              <div className="group-chat-header__subtitle">{group.customer_count} members</div>
            </div>
          </button>
          <button className="group-chat-header__icon-btn" aria-label="More options">
            <MoreVertical size={20} />
          </button>
        </header>
      )}

      <div className="group-chat__body">
        <MessageList
          messages={messages}
          currentUserId={user.id}
          selectedIds={selectedIds}
          onLongPressMessage={handleLongPress}
          onToggleSelectMessage={handleToggleSelect}
        />
      </div>

      <MessageInput
        onSend={handleSend}
        extraAction={
          <>
            <span
              className="message-input__icon"
              onClick={() => setShowPicker(true)}
              role="button"
              aria-label="Send a product"
            >
              <Package size={20} />
            </span>
            <span
              className="message-input__icon"
              onClick={() => cameraInputRef.current?.click()}
              role="button"
              aria-label="Take a photo"
            >
              <Camera size={20} />
            </span>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleCameraCapture}
            />
          </>
        }
      />

      {showPicker && groupId && (
        <GroupProductComposer
          groupName={group.name}
          onSent={handleProductSent}
          onClose={() => setShowPicker(false)}
          sendProduct={(productId) => sendGroupProductMessage(groupId, productId)}
        />
      )}

      {showForward && (
        <ForwardPicker
          excludeGroupId={groupId}
          onForward={handleForward}
          onClose={() => setShowForward(false)}
        />
      )}
    </div>
  );
}
