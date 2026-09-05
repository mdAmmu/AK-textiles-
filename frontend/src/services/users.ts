import { api } from "./api";
import type { User } from "../types/user";

export async function createUser(
  name: string,
  phone: string,
  password: string,
  role: "USER" | "STAFF" = "USER",
): Promise<User> {
  const { data } = await api.post<User>("/users", { name, phone, password, role });
  return data;
}

export async function fetchUsers(search?: string, filterAudience = false): Promise<User[]> {
  // `filterAudience` is broadcast-specific: with no search term, only show
  // customers not already in another broadcast audience (a clean "pick
  // someone" list); once the admin searches, broaden to every match —
  // including people already in another broadcast — so a searched phone
  // number that's already there surfaces with `audience_names` set instead
  // of nothing. Callers outside the broadcast flow should leave this off.
  const { data } = await api.get<User[]>("/users", {
    params: { search, not_in_any_audience: filterAudience && !search },
  });
  return data;
}
