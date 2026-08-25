"use client";

import { useMutation } from "@tanstack/react-query";
import { scanService, type ScanResult } from "@/services/scan.service";

/**
 * Resolves a scan at the moment it happens.
 *
 * A mutation rather than a query: the caller awaits the answer and branches on
 * it, which is what makes one scan box able to serve a whole workflow.
 */
export function useResolveCode() {
  return useMutation<ScanResult, unknown, string>({
    mutationFn: (code: string) => scanService.resolve(code),
  });
}
