export interface NewMessageEvent {
  type: "new_message";
  message: import("../types/message").Message;
}

export interface MessagesReadEvent {
  type: "messages_read";
  conversation_id: string;
  message_ids: string[];
}

export interface NewGroupMessageEvent {
  type: "new_group_message";
  group_id: string;
  message: import("../types/message").Message;
}

export interface GroupMessagesDeletedEvent {
  type: "group_messages_deleted";
  group_id: string;
  message_ids: string[];
}

export type ChatSocketEvent =
  | NewMessageEvent
  | MessagesReadEvent
  | NewGroupMessageEvent
  | GroupMessagesDeletedEvent;

export async function openChatSocket(
  onMessage: (event: ChatSocketEvent) => void,
): Promise<WebSocket | null> {
  const token = await window.Clerk?.session?.getToken();
  if (!token) return null;

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
  const wsBase = apiBase.replace(/^http/, "ws");
  const socket = new WebSocket(`${wsBase}/ws/chat?token=${encodeURIComponent(token)}`);

  socket.onmessage = (event) => {
    onMessage(JSON.parse(event.data));
  };

  return socket;
}
