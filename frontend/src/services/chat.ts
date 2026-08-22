import { api } from "./api";
import type { Message } from "../types/message";

export interface ConversationDetail {
  id: string;
  user_id: string;
  admin_id: string;
  user_name: string;
  messages: Message[];
}

export interface ConversationSummary {
  id: string;
  user_id: string;
  user_name: string;
  last_message_text?: string | null;
  last_message_at?: string | null;
  unread_count: number;
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

export async function markMyConversationRead(): Promise<void> {
  await api.post("/chats/me/read");
}

// WhatsApp deep link -> lands the customer in their own conversation

export async function openWhatsAppDeepLink(
  productId: string,
  broadcastId: string | null,
): Promise<ConversationDetail> {
  const { data } = await api.post<ConversationDetail>(
    `/api/whatsapp/deep-link/${productId}`,
    null,
    { params: broadcastId ? { broadcast_id: broadcastId } : {} },
  );
  return data;
}

// What a real product template's CTA button actually points to — Meta only
// allows one dynamic URL suffix variable, so it carries just the broadcast
// id and the backend resolves the product from it.
export async function openWhatsAppDeepLinkByBroadcast(
  broadcastId: string,
): Promise<ConversationDetail> {
  const { data } = await api.post<ConversationDetail>(
    `/api/whatsapp/deep-link/by-broadcast/${broadcastId}`,
  );
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
): Promise<Message[]> {
  const { data } = await api.post<Message[]>(`/chats/${conversationId}/messages/product`, {
    product_id: productId,
  });
  return data;
}

export async function sendAdminImageMessage(
  conversationId: string,
  file: File,
): Promise<Message> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<Message>(
    `/chats/${conversationId}/messages/image`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.post(`/chats/${conversationId}/read`);
}
