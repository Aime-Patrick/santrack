"use client";

import { useQuery } from "@tanstack/react-query";
import { inventoryService } from "@/services/inventory.service";

export function useInventoryPositions(locationId?: number) {
  return useQuery({
    queryKey: ["inventory", locationId],
    queryFn: () => inventoryService.positions(locationId),
  });
}
