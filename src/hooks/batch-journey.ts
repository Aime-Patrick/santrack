import { useQuery } from "@tanstack/react-query";
import { recallService } from "@/services/recall.service";
import { traceService } from "@/services/trace.service";

export function useBatchImpact(batchId: number | null) {
  return useQuery({
    queryKey: ["batch-impact", batchId],
    queryFn: () => recallService.getImpact(batchId as number),
    enabled: batchId !== null && batchId > 0,
  });
}

export function useBatchJourney(batchId: number | null) {
  return useQuery({
    queryKey: ["batch-journey", batchId],
    queryFn: () => traceService.batchJourney(batchId as number),
    enabled: batchId !== null && batchId > 0,
    staleTime: 30_000,
  });
}
