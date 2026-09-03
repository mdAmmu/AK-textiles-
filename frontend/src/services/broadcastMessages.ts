import { api } from "./api";
import type {
  BroadcastAudience,
  BroadcastAudienceDetail,
  BroadcastMessage,
  BroadcastMessageDetail,
  BroadcastRecipientRow,
} from "../types/broadcastMessage";

export interface CreateBroadcastPayload {
  name?: string;
  text: string;
  group_ids?: string[];
  user_ids?: string[];
  audience_ids?: string[];
  send_mode: "now" | "draft";
  idempotency_key: string;
  reply_to_broadcast_id?: string;
}

export async function fetchBroadcasts(
  status?: string,
  audienceId?: string,
): Promise<BroadcastMessage[]> {
  const params: Record<string, string> = {};
  if (status) params.status_filter = status;
  if (audienceId) params.audience_id = audienceId;
  const { data } = await api.get<BroadcastMessage[]>("/broadcasts", {
    params: Object.keys(params).length ? params : undefined,
  });
  return data;
}

export async function fetchBroadcast(id: string): Promise<BroadcastMessageDetail> {
  const { data } = await api.get<BroadcastMessageDetail>(`/broadcasts/${id}`);
  return data;
}

export async function fetchBroadcastRecipients(
  id: string,
  status?: string,
): Promise<BroadcastRecipientRow[]> {
  const { data } = await api.get<BroadcastRecipientRow[]>(`/broadcasts/${id}/recipients`, {
    params: status ? { status_filter: status } : undefined,
  });
  return data;
}

export async function createBroadcast(payload: CreateBroadcastPayload): Promise<BroadcastMessage> {
  const { data } = await api.post<BroadcastMessage>("/broadcasts", payload);
  return data;
}

export async function sendBroadcastMedia(
  audienceId: string,
  files: File[],
  replyToBroadcastId?: string,
): Promise<BroadcastMessage[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (replyToBroadcastId) formData.append("reply_to_broadcast_id", replyToBroadcastId);
  const { data } = await api.post<BroadcastMessage[]>(
    `/broadcasts/audiences/${audienceId}/media`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return data;
}

export async function forwardBroadcast(id: string, groupIds: string[]): Promise<void> {
  await api.post(`/broadcasts/${id}/forward`, { group_ids: groupIds });
}

export async function retryFailedRecipients(id: string): Promise<BroadcastMessage> {
  const { data } = await api.post<BroadcastMessage>(`/broadcasts/${id}/retry-failed`);
  return data;
}

export async function cancelBroadcast(id: string): Promise<BroadcastMessage> {
  const { data } = await api.post<BroadcastMessage>(`/broadcasts/${id}/cancel`);
  return data;
}

export async function duplicateBroadcast(id: string): Promise<BroadcastMessage> {
  const { data } = await api.post<BroadcastMessage>(`/broadcasts/${id}/duplicate`);
  return data;
}

export async function deleteBroadcast(id: string): Promise<void> {
  await api.delete(`/broadcasts/${id}`);
}

export async function fetchAudiences(): Promise<BroadcastAudience[]> {
  const { data } = await api.get<BroadcastAudience[]>("/broadcasts/audiences");
  return data;
}

export async function fetchAudience(id: string): Promise<BroadcastAudienceDetail> {
  const { data } = await api.get<BroadcastAudienceDetail>(`/broadcasts/audiences/${id}`);
  return data;
}

export async function createAudience(
  name: string,
  userIds: string[],
  groupIds: string[] = [],
): Promise<BroadcastAudience> {
  const { data } = await api.post<BroadcastAudience>("/broadcasts/audiences", {
    name,
    user_ids: userIds,
    group_ids: groupIds,
  });
  return data;
}

export async function updateAudience(
  id: string,
  name?: string,
  userIds?: string[],
  groupIds: string[] = [],
): Promise<BroadcastAudience> {
  const { data } = await api.patch<BroadcastAudience>(`/broadcasts/audiences/${id}`, {
    name,
    user_ids: userIds,
    group_ids: groupIds,
  });
  return data;
}

export async function deleteAudience(id: string): Promise<void> {
  await api.delete(`/broadcasts/audiences/${id}`);
}
