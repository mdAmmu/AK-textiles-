export type MessageType = "TEXT" | "PRODUCT" | "IMAGE";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: MessageType;
  text?: string | null;
  product_id?: string | null;
  price?: number | null;
  product_name?: string | null;
  product_image?: string | null;
  product_description?: string | null;
  created_at: string;
  read_at?: string | null;
}
