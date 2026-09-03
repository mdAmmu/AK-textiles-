export type MessageType = "TEXT" | "PRODUCT" | "IMAGE" | "DOCUMENT";

export interface ReplyPreview {
  id: string;
  sender_id: string;
  message_type: MessageType;
  text?: string | null;
  file_name?: string | null;
  is_deleted?: boolean;
}

export interface Message {
  id: string;
  conversation_id?: string | null;
  group_id?: string | null;
  sender_id: string;
  message_type: MessageType;
  text?: string | null;
  product_id?: string | null;
  price?: number | null;
  product_name?: string | null;
  product_image?: string | null;
  product_description?: string | null;
  file_name?: string | null;
  image_group_id?: string | null;
  reply_to?: ReplyPreview | null;
  is_deleted?: boolean;
  is_edited?: boolean;
  created_at: string;
  read_at?: string | null;
  /** Client-only: set while an optimistic message is still being sent. */
  _pending?: boolean;
}
