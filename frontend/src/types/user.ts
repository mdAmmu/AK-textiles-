export type UserRole = "ADMIN" | "USER" | "STAFF";

export interface User {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  role: UserRole;
  group_id?: string | null;
}
