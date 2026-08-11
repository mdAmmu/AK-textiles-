import { api } from "./api";
import type { Message } from "../types/message";

export interface ConversationDetail {
  id: string;
  user_id: string;
  admin_id: string;
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  user_id: string;
  user_name: string;
  last_message_text?: string | null;
  last_message_at?: string | null;
}

// User side

export async function fetchMyConversation(): Promise<ConversationDetail> {
  const { data } = await api.get<ConversationDetail>("/chats/me");
  return data;
}

export async function sendMyMessage(text: string): Promise<Message> {
  const { data } = await api.post<Message>("/chats/me/messages", { text });
  return data;
}

// Admin side

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const { data } = await api.get<ConversationSummary[]>("/chats");
  return data;
}

export async function fetchConversationMessages(
  conversationId: string,
): Promise<ConversationDetail> {
  const { data } = await api.get<ConversationDetail>(`/chats/${conversationId}/messages`);
  return data;
}

export async function sendAdminMessage(conversationId: string, text: string): Promise<Message> {
  const { data } = await api.post<Message>(`/chats/${conversationId}/messages`, { text });
  return data;
}

export async function sendAdminProductMessage(
  conversationId: string,
  productId: string,
): Promise<Message> {
  const { data } = await api.post<Message>(`/chats/${conversationId}/messages/product`, {
    product_id: productId,
  });
  return data;
}
