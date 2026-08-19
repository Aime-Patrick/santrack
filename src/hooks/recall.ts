"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recallService } from "@/services/recall.service";
import { toast } from "sonner";

export function useRecalls() {
  return useQuery({ queryKey: ["recalls"], queryFn: recallService.list });
}

export function useRecallImpact(batchId: number) {
  return useQuery({ queryKey: ["recalls", "impact", batchId], queryFn: () => recallService.getImpact(batchId), enabled: !!batchId });
}

export function useInitiateRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recallService.recall,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["recalls"] }); toast.success("Recall initiated"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useLiftRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, reason }: { batchId: number; reason?: string }) => recallService.lift(batchId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["recalls"] }); toast.success("Recall lifted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
