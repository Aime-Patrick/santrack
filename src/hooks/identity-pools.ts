"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";
import {
  identityPoolService,
  type CancellationReason,
} from "@/services/identity-pool.service";

export const poolKeys = {
  all: ["identity-pools"] as const,
  list: (productId?: number) => ["identity-pools", "list", productId] as const,
  detail: (id: number) => ["identity-pools", "detail", id] as const,
};

/** Pools for one product, or all of the organization's when no product given. */
export function useIdentityPools(productId?: number) {
  return useQuery({
    queryKey: poolKeys.list(productId),
    queryFn: () => identityPoolService.list(productId),
    refetchInterval: (query) =>
      query.state.data?.content?.some((p) => p.status === "GENERATING")
        ? 1000
        : false,
  });
}

/**
 * One pool, polled while it is still minting.
 *
 * Ten thousand codes take a couple of seconds, so the poll is short-lived by
 * nature; it stops the moment the pool leaves GENERATING. Polling only in that
 * state means a finished pool costs nothing to leave open on screen.
 */
export function useIdentityPool(id: number | null) {
  return useQuery({
    queryKey: poolKeys.detail(id ?? 0),
    queryFn: () => identityPoolService.get(id as number),
    enabled: id !== null,
    refetchInterval: (query) =>
      query.state.data?.status === "GENERATING" ? 700 : false,
  });
}

/**
 * Ask for codes.
 *
 * The toast deliberately says what did *not* happen. Somebody who has just
 * asked for ten thousand codes and then looks at an unchanged stock page needs
 * to know that is correct, not a bug — it is the single point about this
 * feature most likely to be misread.
 */
export function useRequestIdentities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityPoolService.request,
    onSuccess: (pool) => {
      qc.invalidateQueries({ queryKey: poolKeys.all });
      toast.success(
        `Preparing ${pool.requestedCount.toLocaleString()} codes`,
        { description: "These are labels, not stock. Nothing is in inventory yet." },
      );
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not prepare those codes")),
  });
}

/** Claim codes from a pool for a production run. */
export function useAssignIdentities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityPoolService.assign,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: poolKeys.all });
      qc.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success(
        `${result.assigned.toLocaleString()} codes claimed by ${result.orderNumber}`,
        { description: `${result.firstCode} – ${result.lastCode}` },
      );
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not assign those codes")),
  });
}

/** The moment codes become product — and the only thing that creates stock. */
export function useConfirmProduced() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityPoolService.confirmProduced,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: poolKeys.all });
      qc.invalidateQueries({ queryKey: ["production-orders"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success(
        `${result.confirmed.toLocaleString()} units confirmed and now in stock`,
        result.stillAwaitingProduction > 0
          ? {
              description: `${result.stillAwaitingProduction.toLocaleString()} assigned codes are still unaccounted for — cancel them or confirm them.`,
            }
          : undefined,
      );
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not confirm production")),
  });
}

/**
 * End codes that will never name a product.
 *
 * Reports unknown codes rather than failing the batch: an operator scanning a
 * stack of failed labels should be told which one did not register, not have
 * the whole tray refused.
 */
export function useCancelIdentities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      codes: string[];
      reason: CancellationReason;
      notes?: string;
    }) => identityPoolService.cancel(input),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: poolKeys.all });
      toast.success(`${result.cancelled.toLocaleString()} codes cancelled`, {
        description:
          result.unknown.length > 0
            ? `${result.unknown.length} not recognised: ${result.unknown.slice(0, 3).join(", ")}`
            : "Kept on record — scanning one will report it as invalid.",
      });
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not cancel those codes")),
  });
}

/** Mint whatever a stalled job left behind. */
export function useResumePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: identityPoolService.resume,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: poolKeys.all });
      toast.success("Resumed minting");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not resume that pool")),
  });
}

/** Export pool codes as a downloadable CSV file. */
export function useExportPool() {
  return useMutation({
    mutationFn: async ({ id, filename }: { id: number; filename?: string }) => {
      const blob = await identityPoolService.export(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `pool-${id}-codes.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success("Code pool exported successfully");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not export pool codes")),
  });
}

/**
 * Export pool codes as a ZIP of PNG QR code images.
 *
 * Returns `{ progress }` in addition to the standard mutation state so the
 * caller can render a progress bar while the ZIP is being built.
 */
export function useExportPoolImages() {
  return useMutation({
    mutationFn: async ({
      id,
      filename,
      onProgress,
    }: {
      id: number;
      filename: string;
      onProgress?: (done: number, total: number) => void;
    }) => {
      await identityPoolService.exportImages(id, filename, onProgress);
    },
    onSuccess: () => {
      toast.success("QR images downloaded as ZIP");
    },
    onError: (error) =>
      toast.error(getApiErrorMessage(error, "Could not export QR images")),
  });
}
