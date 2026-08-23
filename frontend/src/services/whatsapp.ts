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

export interface CarouselStatus {
  exists: boolean;
  status: string;
}

export async function fetchCarouselStatus(): Promise<CarouselStatus> {
  const { data } = await api.get<CarouselStatus>("/api/whatsapp/carousel-status");
  return data;
}
