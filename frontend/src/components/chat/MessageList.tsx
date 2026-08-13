import { useEffect, useMemo, useRef } from "react";
import type { Message } from "../../types/message";
import MessageBubble from "./MessageBubble";
import ImageGroupBubble from "./ImageGroupBubble";
import DeletedMessageBubble from "./DeletedMessageBubble";
import EmptyMessages from "./EmptyMessages";
import "./MessageList.css";

interface Props {
  messages: Message[];
  currentUserId: string;
  selectedIds?: Set<string>;
  onLongPressMessage?: (id: string) => void;
  onToggleSelectMessage?: (id: string) => void;
  onEmptySendClick?: () => void;
}

type ListItem =
  | { kind: "single"; message: Message }
  | { kind: "group"; messages: Message[] };

function groupMessages(messages: Message[]): ListItem[] {
  const items: ListItem[] = [];
  let i = 0;
  while (i < messages.length) {
    const m = messages[i];
    if (m.message_type === "IMAGE" && m.image_group_id) {
      const groupId = m.image_group_id;
      const group: Message[] = [m];
      let j = i + 1;
      while (
        j < messages.length &&
        messages[j].message_type === "IMAGE" &&
        messages[j].image_group_id === groupId
      ) {
        group.push(messages[j]);
        j++;
      }
      items.push({ kind: "group", messages: group });
      i = j;
    } else {
      items.push({ kind: "single", message: m });
      i++;
    }
  }
  return items;
}

export default function MessageList({
  messages,
  currentUserId,
  selectedIds,
  onLongPressMessage,
  onToggleSelectMessage,
  onEmptySendClick,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const selectionMode = !!selectedIds && selectedIds.size > 0;
  const items = useMemo(() => groupMessages(messages), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <EmptyMessages onSendClick={onEmptySendClick} />
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.length > 0 && (
        <div className="message-list__date-divider">
          <span>Today</span>
        </div>
      )}
      {items.map((item) => {
        if (item.kind === "group") {
          const isOwn = item.messages[0].sender_id === currentUserId;
          if (item.messages.every((m) => m.is_deleted)) {
            return (
              <DeletedMessageBubble key={item.messages[0].id} message={item.messages[0]} isOwn={isOwn} />
            );
          }
          return (
            <ImageGroupBubble
              key={item.messages[0].id}
              messages={item.messages}
              isOwn={isOwn}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onLongPressMessage={onLongPressMessage}
              onToggleSelectMessage={onToggleSelectMessage}
            />
          );
        }

        const isOwn = item.message.sender_id === currentUserId;
        if (item.message.is_deleted) {
          return <DeletedMessageBubble key={item.message.id} message={item.message} isOwn={isOwn} />;
        }
        return (
          <MessageBubble
            key={item.message.id}
            message={item.message}
            isOwn={isOwn}
            selectionMode={selectionMode}
            selected={selectedIds?.has(item.message.id)}
            onLongPress={onLongPressMessage ? () => onLongPressMessage(item.message.id) : undefined}
            onToggleSelect={
              onToggleSelectMessage ? () => onToggleSelectMessage(item.message.id) : undefined
            }
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
