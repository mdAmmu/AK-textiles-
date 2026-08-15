import { api, clearToken, setToken } from "./api";
import type { User } from "../types/user";

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export function logout(): void {
  clearToken();
}

export async function login(phone: string, password: string): Promise<User> {
  const { data } = await api.post<TokenResponse>("/auth/login", { phone, password });
  setToken(data.access_token);
  return data.user;
}

export async function register(name: string, phone: string, password: string): Promise<User> {
  const { data } = await api.post<TokenResponse>("/auth/register", { name, phone, password });
  setToken(data.access_token);
  return data.user;
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}
