"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  stockInService,
  type StockInConfirmInput,
} from "@/services/stock-in.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

// ---------------------------------------------------------------------------
// Query — read-only preview
// ---------------------------------------------------------------------------

/**
 * Fetches the preview of the scanned container.
 * Disabled until a QR code is available.
 */
export function useStockInPreview(qrCode: string | null) {
  return useQuery({
    queryKey: ["stock-in-preview", qrCode],
    queryFn: () => stockInService.preview(qrCode as string),
    enabled: !!qrCode,
    retry: false,
  });
}

// ---------------------------------------------------------------------------
// Mutation — confirm Stock In
// ---------------------------------------------------------------------------

export function useConfirmStockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StockInConfirmInput) => stockInService.confirm(input),
    onSuccess: (receipt) => {
      // Invalidate inventory and item lists so the new stock is reflected
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["stock-in-preview"] });

      const msg =
        receipt.outcome === "idempotent"
          ? `Already received — ${receipt.totalItemsRegistered} item(s) in your inventory`
          : `Stock received — ${receipt.unitCount} unit(s) added to inventory`;
      toast.success(msg);
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to confirm Stock In"));
    },
  });
}
