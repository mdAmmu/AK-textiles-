import { api } from "./api";

export type WhatsAppMessageType = "text" | "image" | "carousel";

export interface WhatsAppMessagePayload {
  phone_number: string;
  message_type: WhatsAppMessageType;
  message: string;
  image_url?: string;
  image_urls?: string[];
  preview_url?: boolean;
}

export async function sendWhatsAppMessage(payload: WhatsAppMessagePayload) {
  const { data } = await api.post("/api/whatsapp/send", payload);
  return data;
}

export async function uploadWhatsAppImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string }>("/api/whatsapp/upload-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}

export const CAROUSEL_CARD_COUNTS = [3, 4, 5] as const;
export type CarouselCardCount = (typeof CAROUSEL_CARD_COUNTS)[number];

export interface CarouselStatus {
  exists: boolean;
  status: string;
}

export type CarouselStatusByCount = Record<string, CarouselStatus>;

export async function fetchCarouselStatus(): Promise<CarouselStatusByCount> {
  const { data } = await api.get<CarouselStatusByCount>("/api/whatsapp/carousel-status");
  return data;
}
