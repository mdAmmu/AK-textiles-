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
  last_message_type?: string | null;
  last_message_at?: string | null;
  unread_count: number;
}

// User side

export async function fetchMyConversation(): Promise<ConversationDetail> {
  const { data } = await api.get<ConversationDetail>("/chats/me");
  return data;
}

export async function sendMyMessage(text: string, replyToId?: string): Promise<Message> {
  const { data } = await api.post<Message>("/chats/me/messages", {
    text,
    reply_to_id: replyToId,
  });
  return data;
}

export async function sendMyImageMessage(files: File[], replyToId?: string): Promise<Message[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (replyToId) formData.append("reply_to_id", replyToId);
  const { data } = await api.post<Message[]>("/chats/me/messages/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function sendMyDocumentMessage(file: File, replyToId?: string): Promise<Message> {
  const formData = new FormData();
  formData.append("file", file);
  if (replyToId) formData.append("reply_to_id", replyToId);
  const { data } = await api.post<Message>("/chats/me/messages/document", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteMyConversationMessages(messageIds: string[]): Promise<string[]> {
  const { data } = await api.post<string[]>("/chats/me/messages/delete", {
    message_ids: messageIds,
  });
  return data;
}

export async function markMyConversationRead(): Promise<void> {
  await api.post("/chats/me/read");
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

export async function sendAdminMessage(
  conversationId: string,
  text: string,
  replyToId?: string,
): Promise<Message> {
  const { data } = await api.post<Message>(`/chats/${conversationId}/messages`, {
    text,
    reply_to_id: replyToId,
  });
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
  files: File[],
  replyToId?: string,
): Promise<Message[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (replyToId) formData.append("reply_to_id", replyToId);
  const { data } = await api.post<Message[]>(
    `/chats/${conversationId}/messages/image`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function sendAdminDocumentMessage(
  conversationId: string,
  file: File,
): Promise<Message> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<Message>(
    `/chats/${conversationId}/messages/document`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function markConversationRead(conversationId: string): Promise<void> {
  await api.post(`/chats/${conversationId}/read`);
}

export async function deleteConversationMessages(
  conversationId: string,
  messageIds: string[],
): Promise<string[]> {
  const { data } = await api.post<string[]>(`/chats/${conversationId}/messages/delete`, {
    message_ids: messageIds,
  });
  return data;
}

export async function forwardConversationMessages(
  conversationId: string,
  messageIds: string[],
  groupIds: string[],
): Promise<Message[]> {
  const { data } = await api.post<Message[]>(`/chats/${conversationId}/messages/forward`, {
    message_ids: messageIds,
    group_ids: groupIds,
  });
  return data;
}
