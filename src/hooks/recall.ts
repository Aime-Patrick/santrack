"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recallService } from "@/services/recall.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

export function useRecalls() {
  return useQuery({ queryKey: ["recalls"], queryFn: recallService.list });
}

export function useRecall(batchId: number) {
  return useQuery({
    queryKey: ["recalls", batchId],
    queryFn: () => recallService.get(batchId),
    enabled: Number.isFinite(batchId) && batchId > 0,
  });
}

export function useRecallImpact(batchId: number) {
  return useQuery({
    queryKey: ["recalls", "impact", batchId],
    queryFn: () => recallService.getImpact(batchId),
    enabled: !!batchId,
  });
}

export function useInitiateRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recallService.recall,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["recalls"] }); toast.success("Recall initiated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useLiftRecall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, reason }: { batchId: number; reason?: string }) => recallService.lift(batchId, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["recalls"] }); toast.success("Recall lifted"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useRecordRecallRecovery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: recallService.recover,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["recalls"] });
      toast.success(`${result.item.code} recorded as ${result.outcome.toLowerCase()}`);
    },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}
