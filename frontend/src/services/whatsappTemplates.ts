import { api } from "./api";

export interface WhatsAppTemplate {
  id?: string | null;
  name: string;
  status: string;
  category?: string | null;
  language?: string | null;
  is_ours: boolean;
}

export async function fetchTemplates(): Promise<WhatsAppTemplate[]> {
  const { data } = await api.get<WhatsAppTemplate[]>("/api/whatsapp/templates");
  return data;
}

export async function createTemplate(input: {
  name: string;
  category: string;
  languageCode: string;
  buttonText: string;
  file: File;
}): Promise<{ id?: string | null; status?: string | null }> {
  const formData = new FormData();
  formData.append("name", input.name);
  formData.append("category", input.category);
  formData.append("language_code", input.languageCode);
  formData.append("button_text", input.buttonText);
  formData.append("file", input.file);

  const { data } = await api.post("/api/whatsapp/templates", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
