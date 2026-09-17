"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { traceService, type ItemAction } from "@/services/trace.service";

export const traceKeys = {
  all: ["trace"] as const,
  timeline: (qrCode: string) => ["trace", qrCode] as const,
};

/**
 * Everything about one identity: what it is, what it came from, what is inside
 * it, where it has been, and what this caller can do to it.
 */
export function useTraceTimeline(qrCode: string) {
  return useQuery({
    queryKey: traceKeys.timeline(qrCode),
    queryFn: () => traceService.timeline(qrCode),
    enabled: !!qrCode,
  });
}

/**
 * Refreshes the console after an action.
 *
 * Everything on the screen is derived from the item's state — the timeline, the
 * contents, and which buttons are enabled — so acting on it has to re-read all
 * of it. Quarantining a box does not just add an event: it closes off dispatch
 * and selling, and the page must stop offering them.
 */
export function useRefreshTrace(qrCode: string) {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: traceKeys.timeline(qrCode) });
    qc.invalidateQueries({ queryKey: ["items"] });
    qc.invalidateQueries({ queryKey: ["item", qrCode] });
    qc.invalidateQueries({ queryKey: ["item-contents", qrCode] });
    qc.invalidateQueries({ queryKey: ["inventory"] });
  }, [qc, qrCode]);
}

/** Looks one action up in the list the server sent. */
export function findAction(
  actions: { action: ItemAction; available: boolean; reason?: string }[] | undefined,
  action: ItemAction,
) {
  return actions?.find((a) => a.action === action);
}

export function useVerifyItem(token: string) {
  return useQuery({
    queryKey: ["verify", token],
    queryFn: () => traceService.verify(token),
    enabled: !!token,
  });
}

export function useVerificationAttempts(options?: { unknownOnly?: boolean; minAttempts?: number; limit?: number; enabled?: boolean }) {
  return useQuery({
    queryKey: ["trace", "verification-attempts", options?.unknownOnly ?? false, options?.minAttempts ?? 1, options?.limit ?? 50],
    queryFn: () =>
      traceService.verificationAttempts({
        unknownOnly: options?.unknownOnly,
        minAttempts: options?.minAttempts,
        limit: options?.limit,
      }),
    enabled: options?.enabled ?? true,
    staleTime: 30_000,
  });
}
