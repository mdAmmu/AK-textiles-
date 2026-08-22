import { api } from "./api";

export interface WhatsAppBroadcast {
  id: string;
  template_name: string;
  product_id: string;
  group_ids: string[];
  status: "DRAFT" | "SENDING" | "COMPLETED" | "PARTIALLY_COMPLETED" | "FAILED";
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppBroadcastRecipient {
  id: string;
  user_id: string;
  phone_number: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
  error_code?: string | null;
  error_message?: string | null;
  external_message_id?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
  failed_at?: string | null;
}

export interface WhatsAppBroadcastDetail extends WhatsAppBroadcast {
  recipients: WhatsAppBroadcastRecipient[];
}

export async function fetchWhatsAppBroadcasts(): Promise<WhatsAppBroadcast[]> {
  const { data } = await api.get<WhatsAppBroadcast[]>("/api/whatsapp/broadcasts");
  return data;
}

export async function fetchWhatsAppBroadcast(id: string): Promise<WhatsAppBroadcastDetail> {
  const { data } = await api.get<WhatsAppBroadcastDetail>(`/api/whatsapp/broadcasts/${id}`);
  return data;
}

export async function createWhatsAppBroadcast(
  productId: string,
  groupIds: string[],
  templateName: string,
): Promise<WhatsAppBroadcast> {
  const { data } = await api.post<WhatsAppBroadcast>("/api/whatsapp/broadcasts", {
    product_id: productId,
    group_ids: groupIds,
    template_name: templateName,
  });
  return data;
}
