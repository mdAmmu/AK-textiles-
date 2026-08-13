import { api } from "./api";
import type { Group, GroupUser } from "../types/group";
import type { User } from "../types/user";
import type { Message } from "../types/message";

export async function fetchGroups(): Promise<Group[]> {
  const { data } = await api.get<Group[]>("/groups");
  return data;
}

export async function createGroup(name: string, description?: string): Promise<Group> {
  const { data } = await api.post<Group>("/groups", { name, description });
  return data;
}

export async function deleteGroup(groupId: string): Promise<void> {
  await api.delete(`/groups/${groupId}`);
}

export async function fetchMyGroup(): Promise<Group | null> {
  const { data } = await api.get<Group | null>("/groups/mine");
  return data;
}

export async function fetchGroupUsers(groupId: string): Promise<GroupUser[]> {
  const { data } = await api.get<GroupUser[]>(`/groups/${groupId}/users`);
  return data;
}

export async function assignUserGroup(userId: string, groupId: string | null): Promise<GroupUser> {
  const { data } = await api.patch<GroupUser>(`/groups/users/${userId}`, { group_id: groupId });
  return data;
}

export async function fetchUnassignedUsers(search?: string): Promise<User[]> {
  const { data } = await api.get<User[]>("/users", {
    params: { unassigned_only: true, search },
  });
  return data;
}

export async function fetchMyGroupMessages(): Promise<Message[]> {
  const { data } = await api.get<Message[]>("/groups/mine/messages");
  return data;
}

export async function fetchGroupMessages(groupId: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/groups/${groupId}/messages`);
  return data;
}

export async function sendGroupMessage(groupId: string, text: string): Promise<Message> {
  const { data } = await api.post<Message>(`/groups/${groupId}/messages`, { text });
  return data;
}

export async function editGroupMessage(
  groupId: string,
  messageId: string,
  text: string,
): Promise<Message> {
  const { data } = await api.patch<Message>(`/groups/${groupId}/messages/${messageId}`, { text });
  return data;
}

export async function sendGroupProductMessage(
  groupId: string,
  productId: string,
): Promise<Message[]> {
  const { data } = await api.post<Message[]>(`/groups/${groupId}/messages/product`, {
    product_id: productId,
  });
  return data;
}

export async function sendGroupImageMessage(
  groupId: string,
  files: File[],
  imageGroupId?: string,
): Promise<Message[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (imageGroupId) formData.append("image_group_id", imageGroupId);
  const { data } = await api.post<Message[]>(`/groups/${groupId}/messages/image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteGroupMessages(
  groupId: string,
  messageIds: string[],
): Promise<string[]> {
  const { data } = await api.post<string[]>(`/groups/${groupId}/messages/delete`, {
    message_ids: messageIds,
  });
  return data;
}

export async function forwardGroupMessages(
  groupId: string,
  messageIds: string[],
  targetGroupIds: string[],
  imageGroupId?: string,
): Promise<Message[]> {
  const { data } = await api.post<Message[]>(`/groups/${groupId}/messages/forward`, {
    message_ids: messageIds,
    group_ids: targetGroupIds,
    image_group_id: imageGroupId,
  });
  return data;
}
