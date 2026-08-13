import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Camera, Forward, MoreVertical, Pencil, Trash2, X } from "lucide-react";
import {
  deleteGroupMessages,
  editGroupMessage,
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
import ForwardPreviewBar, { type StagedImage } from "../components/chat/ForwardPreviewBar";
import EditingMessageBar from "../components/chat/EditingMessageBar";
import LoadingScreen from "../components/common/LoadingScreen";
import { randomUUID } from "../utils/uuid";
import "./UserChat.css";
import "./GroupChat.css";
import "./AdminChat.css";

interface PendingForwardState {
  sourceGroupId: string;
  imageMessageIds: string[];
  imageUrls: string[];
  text: string;
}

export default function GroupChat() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();

  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [stagedImages, setStagedImages] = useState<StagedImage[]>([]);
  const [forwardSourceGroupId, setForwardSourceGroupId] = useState<string | null>(null);
  const [draftText, setDraftText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const selectionMode = selectedIds.size > 0;

  useEffect(() => {
    if (!groupId) return;
    fetchGroups().then((all) => setGroup(all.find((g) => g.id === groupId) ?? null));
    fetchGroupMessages(groupId).then(setMessages);
  }, [groupId]);

  useEffect(() => {
    const pending = (location.state as { pendingForward?: PendingForwardState } | null)
      ?.pendingForward;
    if (!pending) return;
    setStagedImages(
      pending.imageMessageIds.map((id, i) => ({
        key: id,
        url: pending.imageUrls[i],
        sourceMessageId: id,
      })),
    );
    setForwardSourceGroupId(pending.sourceGroupId);
    setDraftText(pending.text);
    navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

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
      setMessages(
        (prev) =>
          prev?.map((m) =>
            event.message_ids.includes(m.id) ? { ...m, is_deleted: true } : m,
          ) ?? prev,
      );
    }
    if (event.type === "group_message_edited") {
      if (event.group_id !== groupId) return;
      setMessages(
        (prev) => prev?.map((m) => (m.id === event.message.id ? event.message : m)) ?? prev,
      );
    }
  }, !!user && !!groupId);

  async function handleSend(text: string) {
    if (!groupId) return;
    if (editingMessageId) {
      await handleSaveEdit(text);
      return;
    }
    if (stagedImages.length > 0) {
      await handleSendStaged(text);
      return;
    }
    const message = await sendGroupMessage(groupId, text);
    setMessages((prev) => [...(prev ?? []), message]);
  }

  async function handleSaveEdit(text: string) {
    if (!groupId || !editingMessageId) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const updated = await editGroupMessage(groupId, editingMessageId, trimmed);
    setMessages((prev) => prev?.map((m) => (m.id === updated.id ? updated : m)) ?? prev);
    setEditingMessageId(null);
    setDraftText("");
  }

  function handleCancelEdit() {
    setEditingMessageId(null);
    setDraftText("");
  }

  async function handleSendStaged(text: string) {
    if (!groupId) return;
    const forwardedIds = stagedImages
      .filter((img) => img.sourceMessageId)
      .map((img) => img.sourceMessageId as string);
    const newFiles = stagedImages.filter((img) => img.file).map((img) => img.file as File);

    // When more than one image is going out together, fold them into a
    // single shared image_group_id so they render as one WhatsApp-style
    // grid in the target chat, even if they weren't originally grouped.
    const batchImageGroupId =
      forwardedIds.length + newFiles.length > 1 ? randomUUID() : undefined;

    const collected: Message[] = [];
    if (forwardedIds.length > 0 && forwardSourceGroupId) {
      const forwarded = await forwardGroupMessages(
        forwardSourceGroupId,
        forwardedIds,
        [groupId],
        batchImageGroupId,
      );
      collected.push(...forwarded);
    }
    if (newFiles.length > 0) {
      const uploaded = await sendGroupImageMessage(groupId, newFiles, batchImageGroupId);
      collected.push(...uploaded);
    }
    const trimmed = text.trim();
    if (trimmed) {
      const textMessage = await sendGroupMessage(groupId, trimmed);
      collected.push(textMessage);
    }

    setMessages((prev) => [...(prev ?? []), ...collected]);
    stagedImages.forEach((img) => {
      if (img.file) URL.revokeObjectURL(img.url);
    });
    setStagedImages([]);
    setForwardSourceGroupId(null);
    setDraftText("");
  }

  function handleRemoveStagedImage(key: string) {
    setStagedImages((prev) => {
      const target = prev.find((img) => img.key === key);
      if (target?.file) URL.revokeObjectURL(target.url);
      return prev.filter((img) => img.key !== key);
    });
  }

  function handleProductSent(newMessages: Message[]) {
    setMessages((prev) => [...(prev ?? []), ...newMessages]);
    setShowPicker(false);
  }

  async function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (files.length === 0 || !groupId) return;
    if (stagedImages.length > 0) {
      const newItems: StagedImage[] = files.map((file) => ({
        key: `new-${randomUUID()}`,
        url: URL.createObjectURL(file),
        file,
      }));
      setStagedImages((prev) => [...prev, ...newItems]);
      return;
    }
    const newMessages = await sendGroupImageMessage(groupId, files);
    setMessages((prev) => [...(prev ?? []), ...newMessages]);
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
    setMessages(
      (prev) => prev?.map((m) => (ids.includes(m.id) ? { ...m, is_deleted: true } : m)) ?? prev,
    );
    setSelectedIds(new Set());
  }

  function handleEditSelected() {
    if (selectedIds.size !== 1 || !messages) return;
    const [id] = Array.from(selectedIds);
    const target = messages.find((m) => m.id === id);
    if (!target || target.message_type !== "TEXT" || target.is_deleted) return;
    setEditingMessageId(id);
    setDraftText(target.text ?? "");
    setSelectedIds(new Set());
  }

  const canEditSelection =
    selectedIds.size === 1 &&
    (() => {
      const [id] = Array.from(selectedIds);
      const target = messages?.find((m) => m.id === id);
      return !!target && target.message_type === "TEXT" && !target.is_deleted;
    })();

  async function handleForward(targetGroupIds: string[]) {
    if (!groupId || selectedIds.size === 0 || !messages) return;

    const selected = messages.filter((m) => selectedIds.has(m.id));
    const onlyTextOrImage = selected.every(
      (m) => m.message_type === "TEXT" || m.message_type === "IMAGE",
    );

    if (targetGroupIds.length === 1 && onlyTextOrImage) {
      const targetId = targetGroupIds[0];
      const imageMessages = selected.filter(
        (m) => m.message_type === "IMAGE" && m.product_image,
      );
      const textMessage = selected.find((m) => m.message_type === "TEXT");

      setShowForward(false);
      setSelectedIds(new Set());
      navigate(`/admin/groups/${targetId}/chat`, {
        state: {
          pendingForward: {
            sourceGroupId: groupId,
            imageMessageIds: imageMessages.map((m) => m.id),
            imageUrls: imageMessages.map((m) => m.product_image as string),
            text: textMessage?.text ?? "",
          } satisfies PendingForwardState,
        },
      });
      return;
    }

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
          {canEditSelection && (
            <button
              className="group-chat-header__icon-btn"
              onClick={handleEditSelected}
              aria-label="Edit"
            >
              <Pencil size={19} />
            </button>
          )}
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

      {editingMessageId && <EditingMessageBar onCancel={handleCancelEdit} />}

      <ForwardPreviewBar images={stagedImages} onRemove={handleRemoveStagedImage} />

      <MessageInput
        onSend={handleSend}
        value={draftText}
        onChange={setDraftText}
        canSubmitEmpty={stagedImages.length > 0}
        extraAction={
          <>
            {/* <span
              className="message-input__icon"
              onClick={() => setShowPicker(true)}
              role="button"
              aria-label="Send a product"
            >
              <Package size={20} />
            </span> */}
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
              multiple
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
