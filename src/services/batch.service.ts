import { api } from "@/lib/api";

export interface Batch {
  id: number;
  batchCode: string;
  productId: number;
  productName: string;
  manufacturerId: number | null;
  manufacturerName: string | null;
  manufacturedOn: string | null;
  expiresOn: string | null;
  status: string;
  statusReason: string | null;
  /** What the lot was before its last transition, so a lifted recall can restore it. */
  previousStatus: string | null;
  statusChangedAt: string | null;
}

export interface CreateBatchInput {
  productId: number;
  batchCode: string;
  /** The site that made this lot — what a scanned code names as the plant. */
  facilityId?: number;
  manufacturedOn?: string;
  expiresOn?: string;
}

export const batchService = {
  create(input: CreateBatchInput): Promise<Batch> {
    return api.post<Batch>("/api/batches", input).then((r) => r.data);
  },

  list(productId?: number): Promise<Batch[]> {
    return api
      .get<Batch[]>("/api/batches", {
        params: productId ? { productId } : undefined,
      })
      .then((r) => r.data);
  },

  get(id: number): Promise<Batch> {
    return api.get<Batch>(`/api/batches/${id}`).then((r) => r.data);
  },
};
