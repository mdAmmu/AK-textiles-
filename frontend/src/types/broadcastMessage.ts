export type BroadcastStatus =
  | "draft"
  | "queued"
  | "processing"
  | "completed"
  | "partially_completed"
  | "failed"
  | "cancelled";

export type BroadcastRecipientStatus = "pending" | "sent" | "failed" | "cancelled";

export type BroadcastMessageType = "text" | "image" | "document";

export interface BroadcastMessage {
  id: string;
  name?: string | null;
  status: BroadcastStatus;
  message_type: BroadcastMessageType;
  text?: string | null;
  media_url?: string | null;
  file_name?: string | null;
  reply_to_broadcast_id?: string | null;
  image_group_id?: string | null;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  delivered_count: number;
  read_count: number;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface BroadcastRecipientRow {
  id: string;
  recipient_id: string;
  recipient_name: string;
  recipient_phone?: string | null;
  status: BroadcastRecipientStatus;
  failure_reason?: string | null;
  sent_at?: string | null;
  read_at?: string | null;
}

export interface BroadcastMessageDetail extends BroadcastMessage {
  recipients: BroadcastRecipientRow[];
}

export interface BroadcastAudience {
  id: string;
  name: string;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface BroadcastAudienceMember {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}

export interface BroadcastAudienceDetail extends BroadcastAudience {
  member_ids: string[];
  members: BroadcastAudienceMember[];
}

export interface BroadcastAudienceStats {
  total_broadcasts: number;
  total_recipients_reached: number;
  total_read: number;
  total_failed: number;
  delivery_rate: number;
  read_rate: number;
}
