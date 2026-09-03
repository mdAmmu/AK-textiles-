import { api } from "./api";
import type { User } from "../types/user";

export async function fetchUsers(search?: string): Promise<User[]> {
  const { data } = await api.get<User[]>("/users", {
    params: search ? { search } : undefined,
  });
  return data;
}
