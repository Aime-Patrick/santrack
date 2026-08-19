"use client";

import { useQuery } from "@tanstack/react-query";
import { traceService } from "@/services/trace.service";

export function useTraceTimeline(qrCode: string) {
  return useQuery({
    queryKey: ["trace", qrCode],
    queryFn: () => traceService.timeline(qrCode),
    enabled: !!qrCode,
  });
}

export function useVerifyItem(token: string) {
  return useQuery({
    queryKey: ["verify", token],
    queryFn: () => traceService.verify(token),
    enabled: !!token,
  });
}
