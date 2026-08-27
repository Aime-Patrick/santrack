import { api } from "@/lib/api";

export type SaleType = "BUSINESS" | "CONSUMER";

export interface SaleLine {
  id: number;
  itemId: number;
  itemCode: string;
  itemQrCode: string;
  quantity: number;
}

export interface Sale {
  id: number;
  reference: string;
  type: SaleType;
  sellerOrganizationId: number;
  sellerOrganizationName: string;
  buyerOrganizationId: number | null;
  buyerOrganizationName: string | null;
  consumerRef: string | null;
  totalAmount: string | null;
  transferId: number | null;
  soldAt: string;
  notes: string | null;
  lines: SaleLine[];
}

export interface SaleListResponse {
  content: Sale[];
  total: number;
  page: number;
  size: number;
}

export interface SellInput {
  type: SaleType;
  buyerOrganizationId?: number;
  consumerRef?: string;
  sellerLocationId?: number;
  deliveryLocationId?: number;
  /** Scan path — omit when using quantityLines only. */
  itemQrCodes?: string[];
  /** Wholesale path: product + qty + piece/carton/box. */
  quantityLines?: {
    productId: number;
    requestedQuantity: string;
    salesUnit?: string;
  }[];
  totalAmount?: string;
  notes?: string;
}

export interface ScannedItem {
  qrCode: string;
  code: string;
  productName: string | null;
  productSku: string | null;
  batchCode: string | null;
  status: string;
}

export const saleService = {
  list(page = 0, size = 20): Promise<SaleListResponse> {
    return api
      .get<SaleListResponse>("/api/sales", { params: { page, size } })
      .then((r) => r.data);
  },

  sell(input: SellInput): Promise<{ sale: Sale; lines: SaleLine[] }> {
    return api
      .post<{ sale: Sale; lines: SaleLine[] }>("/api/sales", input)
      .then((r) => r.data);
  },
};
