import { api } from "@/lib/api";
import type { Symbology } from "./barcode.service";

// ---------------------------------------------------------------------------
// Types matching the backend Product entity
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  organizationId: number;
  name: string;
  sku: string;
  category: string | null;
  categoryId: number | null;
  categoryCode: string | null;
  categoryName: string | null;
  brand: string | null;
  model: string | null;
  specification: string | null;
  /** Manufacturer barcode — GTIN/EAN/UPC/ISBN. The number a till looks up. */
  gtin: string | null;
  /**
   * The code type this product labels as by default: ISBN for a book, EAN-13
   * for a retail pack, Code 128 for an internal part. Null means QR, the
   * platform's own identity code.
   *
   * A default, not a restriction — the same product carries different codes on
   * the pack, the carton and the pallet, so printing takes an override.
   */
  barcodeSymbology: Symbology | null;
}

export interface ProductCategory {
  id: number;
  code: string;
  name: string;
  /** The broader category this sits under. Taxonomy only, never inheritance. */
  parentId: number | null;
  /** Withdrawn categories stay readable so old products still describe themselves. */
  active: boolean;
  /** How many products are filed under it — what makes withdrawing a decision. */
  productCount: number;
}

/**
 * A mark the organization files products under.
 *
 * `categories` is derived from its products, never stored — a brand belongs to
 * a business, not to a category, and one manufacturer's marks routinely cross
 * categories.
 */
export interface Brand {
  id: number;
  code: string;
  name: string;
  active: boolean;
  productCount: number;
  categories: string[];
}

export interface CreateCategoryInput {
  name: string;
  /** Derived from the name by the server when omitted, which is the norm. */
  code?: string;
  parentId?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  parentId?: number | null;
  active?: boolean;
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  categoryId?: number;
  brandId?: number;
  model?: string;
  specification?: string;
  gtin?: string;
  barcodeSymbology?: Symbology;
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
  categories(): Promise<ProductCategory[]> {
    return api.get<ProductCategory[]>("/api/product-categories").then((r) => r.data);
  },

  brands(): Promise<Brand[]> {
    return api.get<Brand[]>("/api/brands").then((r) => r.data);
  },

  createBrand(name: string): Promise<Brand> {
    return api.post<Brand>("/api/brands", { name }).then((r) => r.data);
  },

  updateBrand(
    id: number,
    input: { name?: string; active?: boolean },
  ): Promise<Brand> {
    return api.patch<Brand>(`/api/brands/${id}`, input).then((r) => r.data);
  },

  withdrawBrand(id: number): Promise<Brand> {
    return api.delete<Brand>(`/api/brands/${id}`).then((r) => r.data);
  },

  createCategory(input: CreateCategoryInput): Promise<ProductCategory> {
    return api
      .post<ProductCategory>("/api/product-categories", input)
      .then((r) => r.data);
  },

  updateCategory(
    id: number,
    input: UpdateCategoryInput,
  ): Promise<ProductCategory> {
    return api
      .patch<ProductCategory>(`/api/product-categories/${id}`, input)
      .then((r) => r.data);
  },

  /** Withdraws a category. Never deletes — products still refer to it. */
  withdrawCategory(id: number): Promise<ProductCategory> {
    return api
      .delete<ProductCategory>(`/api/product-categories/${id}`)
      .then((r) => r.data);
  },

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
