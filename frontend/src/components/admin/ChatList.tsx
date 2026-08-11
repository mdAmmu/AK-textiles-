import type { ConversationSummary } from "../../services/chat";
import ChatListItem from "./ChatListItem";
import "./ChatList.css";

interface Props {
  conversations: ConversationSummary[];
}

export default function ChatList({ conversations }: Props) {
  if (conversations.length === 0) {
    return <p className="chat-list__empty">No conversations yet.</p>;
  }

  return (
    <div className="chat-list">
      {conversations.map((c) => (
        <ChatListItem key={c.id} conversation={c} />
      ))}
    </div>
  );
}
