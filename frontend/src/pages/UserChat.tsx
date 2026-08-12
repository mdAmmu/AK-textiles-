import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MoreVertical } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useChatSocket } from "../hooks/useChatSocket";
import { fetchMyGroup, fetchMyGroupMessages } from "../services/groups";
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
  const { signOut } = useClerk();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [group, setGroup] = useState<Group | null>(null);

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
      signOut().then(() => navigate("/login", { replace: true }));
    }
  }, !!user && !!group);

  if (messages === null || !user) return <LoadingScreen />;

  const groupName = group?.name ?? "Admin";
  const memberCount = (group?.customer_count ?? 0) + 1;

  return (
    <div className="user-chat-page">
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
      <div className="user-chat-page__messages">
        <MessageList messages={messages} currentUserId={user.id} />
      </div>
      <div className="user-chat-page__readonly-bar">
        Only <span className="user-chat-page__readonly-bar-highlight">admins</span> can send
        messages
      </div>
    </div>
  );
}
