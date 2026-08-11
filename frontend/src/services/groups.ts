import { api } from "./api";
import type { Group, GroupUser } from "../types/group";
import type { User } from "../types/user";

export async function fetchGroups(): Promise<Group[]> {
  const { data } = await api.get<Group[]>("/groups");
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
