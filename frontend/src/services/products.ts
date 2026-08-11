import { api } from "./api";
import type { Product, ProductInput } from "../types/product";

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/products");
  return data;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await api.post<Product>("/products", input);
  return data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const { data } = await api.patch<Product>(`/products/${id}`, input);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function uploadProductImage(id: string, file: File): Promise<Product> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<Product>(`/products/${id}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
