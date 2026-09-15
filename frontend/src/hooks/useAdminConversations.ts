import { useEffect, useState } from "react";
import { fetchConversations, startConversation } from "../services/chat";
import type { ConversationSummary } from "../services/chat";
import type { User } from "../types/user";
import { useCurrentUser } from "./useCurrentUser";
import { useChatSocket } from "./useChatSocket";

// Kept outside the hook so it survives unmount/remount — switching between
// the Chats/Groups/Broadcast tabs and back shows the last-known list
// immediately instead of a loading flash, while a fresh fetch runs quietly
// underneath.
let cachedConversations: ConversationSummary[] | null = null;

/**
 * Shared conversation-list state for the admin chat list pane, used both by
 * the chats home screen and — on desktop, where the list stays visible next
 * to an open thread — the chat screen itself.
 */
export function useAdminConversations() {
  const { user } = useCurrentUser();
  const [conversations, setConversationsState] = useState<ConversationSummary[] | null>(
    cachedConversations,
  );

  function setConversations(update: ConversationSummary[] | null | ((prev: ConversationSummary[] | null) => ConversationSummary[] | null)) {
    setConversationsState((prev) => {
      const next = typeof update === "function" ? update(prev) : update;
      cachedConversations = next;
      return next;
    });
  }

  useEffect(() => {
    fetchConversations().then(setConversations);
  }, []);

  useChatSocket((event) => {
    if (event.type !== "new_message") return;
    const message = event.message;
    if (!message.conversation_id) return;
    setConversations((prev) => {
      if (!prev) return prev;
      const idx = prev.findIndex((c) => c.id === message.conversation_id);
      if (idx === -1) {
        // A brand new conversation (first-ever message) — refetch to get its
        // customer name rather than guessing at a partial summary.
        fetchConversations().then(setConversations);
        return prev;
      }
      const updated: ConversationSummary = {
        ...prev[idx],
        last_message_text: message.text ?? null,
        last_message_type: message.message_type,
        last_message_at: message.created_at,
        unread_count:
          message.sender_id !== user?.id ? prev[idx].unread_count + 1 : prev[idx].unread_count,
      };
      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });
  }, !!user);

  async function startChat(customer: User) {
    return startConversation(customer.id);
  }

  return { conversations, startChat };
}
