export interface Product {
  id: string;
  name: string;
  description?: string | null;
  image_1?: string | null;
  image_2?: string | null;
  image_3?: string | null;
  image_4?: string | null;
  dubai_price?: number | null;
  south_africa_price?: number | null;
  india_price?: number | null;
  local_price?: number | null;
}
