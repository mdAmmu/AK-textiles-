export interface Group {
  id: string;
  name: string;
  description?: string | null;
  customer_count: number;
}

export interface GroupUser {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
}
