"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { batchService, type CreateBatchInput } from "@/services/batch.service";
import { toast } from "sonner";

export function useBatches(productId?: number) {
  return useQuery({
    queryKey: ["batches", productId],
    queryFn: () => batchService.list(productId),
  });
}

export function useBatch(id: number) {
  return useQuery({
    queryKey: ["batch", id],
    queryFn: () => batchService.get(id),
    enabled: !!id,
  });
}

export function useCreateBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBatchInput) => batchService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["batches"] });
      toast.success("Batch created successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to create batch");
    },
  });
}
