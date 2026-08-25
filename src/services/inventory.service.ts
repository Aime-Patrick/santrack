import { api } from "@/lib/api";

export interface InventoryPosition {
  productId: number | null;
  productName: string | null;
  productSku: string | null;
  availableUnits: number;
  blockedUnits: number;
  inTransitUnits: number;
  identities: number;
  byStatus: Array<{ status: string; count: number }>;
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
