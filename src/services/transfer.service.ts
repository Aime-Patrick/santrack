import { api } from "@/lib/api";
import type { Item } from "./item.service";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TransferLine {
  id: number;
  itemId: number;
  itemCode: string;
  itemQrCode: string;
  quantity: number;
}

export interface Transfer {
  id: number;
  reference: string;
  status: string;
  sourceOrganizationId: number;
  sourceOrganizationName: string;
  sourceLocationName: string | null;
  destinationOrganizationId: number;
  destinationOrganizationName: string;
  destinationLocationName: string | null;
  dispatchedAt: string | null;
  receivedAt: string | null;
  notes: string | null;
  lineCount: number;
  lines: TransferLine[];
  missing: string[];
}

export interface DispatchInput {
  destinationOrganizationId: number;
  destinationLocationId?: number;
  sourceLocationId?: number;
  itemQrCodes: string[];
  notes?: string;
}

export interface RelocateInput {
  itemQrCodes: string[];
  destinationLocationId: number;
}

export interface TransferListResponse {
  content: Transfer[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const transferService = {
  /** Dispatch items to another organization. */
  dispatch(input: DispatchInput): Promise<Transfer> {
    return api.post<Transfer>("/api/transfers", input).then((r) => r.data);
  },

  /** Receive a pending transfer (confirm receipt). */
  receive(
    transferId: number,
    scannedQrCodes?: string[]
  ): Promise<Transfer & { missing: string[] }> {
    return api
      .post<Transfer & { missing: string[] }>(
        `/api/transfers/${transferId}/receive`,
        scannedQrCodes ? { scannedQrCodes } : undefined
      )
      .then((r) => r.data);
  },

  /** Move items between the organization's own locations. */
  relocate(input: RelocateInput): Promise<{ movedCount: number; items: Item[] }> {
    return api
      .post<{ movedCount: number; items: Item[] }>("/api/transfers/relocate", input)
      .then((r) => r.data);
  },

  /** Cancel a pending dispatch. */
  cancel(transferId: number): Promise<Transfer> {
    return api
      .post<Transfer>(`/api/transfers/${transferId}/cancel`)
      .then((r) => r.data);
  },

  /** List outgoing transfers. */
  listOutgoing(
    page = 0,
    size = 20
  ): Promise<TransferListResponse> {
    return api
      .get<TransferListResponse>("/api/transfers/outgoing", {
        params: { page, size },
      })
      .then((r) => r.data);
  },

  /** List incoming transfers. */
  listIncoming(
    pendingOnly = false,
    page = 0,
    size = 20
  ): Promise<TransferListResponse> {
    return api
      .get<TransferListResponse>("/api/transfers/incoming", {
        params: { pendingOnly, page, size },
      })
      .then((r) => r.data);
  },

  /** Get a single transfer with its lines. */
  get(transferId: number): Promise<Transfer> {
    return api.get<Transfer>(`/api/transfers/${transferId}`).then((r) => r.data);
  },
};
