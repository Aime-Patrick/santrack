import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types matching the backend Product entity
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  model: string | null;
  specification: string | null;
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  category?: string;
  brand?: string;
  model?: string;
  specification?: string;
}

export interface ProductListResponse {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const productService = {
  create(input: CreateProductInput): Promise<Product> {
    return api.post<Product>("/api/products", input).then((r) => r.data);
  },

  list(page = 0, size = 20): Promise<ProductListResponse> {
    return api
      .get<ProductListResponse>("/api/products", { params: { page, size } })
      .then((r) => r.data);
  },

  get(id: number): Promise<Product> {
    return api.get<Product>(`/api/products/${id}`).then((r) => r.data);
  },

  update(id: number, input: CreateProductInput): Promise<Product> {
    return api.put<Product>(`/api/products/${id}`, input).then((r) => r.data);
  },

  remove(id: number): Promise<void> {
    return api.delete(`/api/products/${id}`).then(() => undefined);
  },
};
