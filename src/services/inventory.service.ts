import { api } from "@/lib/api";

export interface InventoryPosition {
  itemId: number;
  itemCode: string;
  itemQrCode: string;
  productName: string;
  productSku: string;
  batchCode: string | null;
  locationId: number;
  locationName: string;
  quantity: number;
  status: string;
}

export const inventoryService = {
  /** Get current stock positions, optionally filtered by location. */
  positions(locationId?: number): Promise<InventoryPosition[]> {
    return api
      .get<InventoryPosition[]>("/api/inventory", {
        params: locationId ? { locationId } : undefined,
      })
      .then((r) => r.data);
  },
};
