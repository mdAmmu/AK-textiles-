export interface NewMessageEvent {
  type: "new_message";
  message: import("../types/message").Message;
}

export async function openChatSocket(
  onMessage: (event: NewMessageEvent) => void,
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
