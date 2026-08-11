import { useEffect, useRef } from "react";
import { openChatSocket } from "../services/socket";
import type { ChatSocketEvent } from "../services/socket";

export function useChatSocket(onMessage: (event: ChatSocketEvent) => void, enabled: boolean) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let cancelled = false;

    openChatSocket((event) => handlerRef.current(event)).then((s) => {
      if (cancelled) {
        s?.close();
        return;
      }
      socket = s;
    });

    return () => {
      cancelled = true;
      socket?.close();
    };
  }, [enabled]);
}
