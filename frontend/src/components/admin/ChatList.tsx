import type { ConversationSummary } from "../../services/chat";
import ChatListItem from "./ChatListItem";

interface Props {
  conversations: ConversationSummary[];
}

export default function ChatList({ conversations }: Props) {
  if (conversations.length === 0) {
    return <p className="p-4 text-[#8b8798]">No conversations yet.</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {conversations.map((c) => (
        <ChatListItem key={c.id} conversation={c} />
      ))}
    </div>
  );
}
