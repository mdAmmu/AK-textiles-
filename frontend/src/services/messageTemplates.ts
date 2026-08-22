import { api } from "./api";

export interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  whatsapp_template_name: string;
  whatsapp_template_language: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplateCreateInput {
  name: string;
  message: string;
  button_text?: string;
}

export interface MessageTemplateUpdateInput {
  name: string;
  message: string;
}

export interface GroupTemplateSendResult {
  success: boolean;
  in_app_sent: number;
  whatsapp_sent: number;
  whatsapp_skipped: number;
}

export async function fetchMessageTemplates(): Promise<MessageTemplate[]> {
  const { data } = await api.get<MessageTemplate[]>("/api/message-templates");
  return data;
}

export async function createMessageTemplate(
  input: MessageTemplateCreateInput,
): Promise<MessageTemplate> {
  const { data } = await api.post<MessageTemplate>("/api/message-templates", input);
  return data;
}

export async function updateMessageTemplate(
  id: string,
  input: MessageTemplateUpdateInput,
): Promise<MessageTemplate> {
  const { data } = await api.put<MessageTemplate>(`/api/message-templates/${id}`, input);
  return data;
}

export async function deleteMessageTemplate(id: string): Promise<void> {
  await api.delete(`/api/message-templates/${id}`);
}

export async function sendGroupTemplate(
  groupId: string,
  templateId: string,
): Promise<GroupTemplateSendResult> {
  const { data } = await api.post<GroupTemplateSendResult>(`/groups/${groupId}/template`, {
    template_id: templateId,
  });
  return data;
}
