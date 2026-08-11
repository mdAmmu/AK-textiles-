import { api } from "./api";
import type { User } from "../types/user";

export async function syncCurrentUser(
  name: string,
  email?: string,
  phone?: string,
): Promise<User> {
  const { data } = await api.post<User>("/auth/sync", { name, email, phone });
  return data;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}
