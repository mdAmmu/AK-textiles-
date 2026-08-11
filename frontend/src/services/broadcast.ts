import { api } from "./api";

export interface BroadcastGroupBreakdown {
  group_id: string;
  group_name: string;
  customer_count: number;
  price?: number | null;
}

export interface BroadcastPreview {
  product_id: string;
  product_name: string;
  groups: BroadcastGroupBreakdown[];
  total_customers: number;
}

export interface BroadcastResult {
  product_id: string;
  total_sent: number;
  groups: BroadcastGroupBreakdown[];
}

export async function fetchBroadcastPreview(productId: string): Promise<BroadcastPreview> {
  const { data } = await api.get<BroadcastPreview>(`/products/${productId}/broadcast/preview`);
  return data;
}

export async function sendBroadcast(
  productId: string,
  groupIds?: string[],
): Promise<BroadcastResult> {
  const { data } = await api.post<BroadcastResult>(`/products/${productId}/broadcast`, {
    group_ids: groupIds ?? null,
  });
  return data;
}
