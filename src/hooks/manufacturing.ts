"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productionService, rawMaterialService, qualityInspectionService, bomService } from "@/services/manufacturing.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

/**
 * The API answers a broken business rule with a sentence worth reading — "batch
 * is PENDING_QC and cannot be inspected". Axios throws "Request failed with
 * status code 409" instead, so pull the real message out before showing it.
 */
export function apiMessage(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    fallback
  );
}

// ── Production Orders ──
export function useProductionOrders(status?: string, page = 0, size = 20) {
  return useQuery({ queryKey: ["production-orders", status, page, size], queryFn: () => productionService.list(status, page, size) });
}

export function useProductionOrder(id: number) {
  return useQuery({ queryKey: ["production-orders", id], queryFn: () => productionService.get(id), enabled: !!id });
}

export function useCreateProductionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productionService.create,
    onSuccess: () => {
      // Planning an order opens its batch, so the batch list changes too.
      qc.invalidateQueries({ queryKey: ["production-orders"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      toast.success("Production order created");
    },
    onError: (e) => toast.error(apiMessage(e, "Could not create the order")),
  });
}

export function useStartProduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productionService.start,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production-orders"] }); toast.success("Production started"); },
    onError: (e) => toast.error(apiMessage(e, "Could not start the run")),
  });
}

export function useCompleteProduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: { producedQuantity?: number; expiresOn?: string; notes?: string } }) =>
      productionService.complete(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-orders"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      toast.success("Production run completed");
    },
    onError: (e) => toast.error(apiMessage(e, "Could not complete the run")),
  });
}

export function useAmendQuantity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { newQuantity: number; reason: string } }) =>
      productionService.amendQuantity(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Produced quantity amended");
    },
    onError: (e) => toast.error(apiMessage(e, "Could not amend the quantity")),
  });
}

export function useAllocateMaterials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { materials: { materialId: number; quantity: number }[] } }) =>
      productionService.allocateMaterials(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production-orders"] }); toast.success("Materials allocated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useIssueMaterials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { materials: { materialId: number; quantity: number }[] } }) =>
      productionService.issueMaterials(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production-orders"] }); toast.success("Materials issued"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useCloseProduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productionService.close,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production-orders"] }); toast.success("Production closed"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useCancelProduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { reason: string } }) => productionService.cancel(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production-orders"] }); toast.success("Production cancelled"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Raw Materials ──
export function useRawMaterials() {
  return useQuery({ queryKey: ["raw-materials"], queryFn: rawMaterialService.list });
}

export function useCreateRawMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: rawMaterialService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["raw-materials"] }); toast.success("Raw material registered"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Quality Inspections ──
export function useQualityInspections(page = 0, size = 20) {
  return useQuery({ queryKey: ["quality-inspections", page, size], queryFn: () => qualityInspectionService.list(page, size) });
}

export function useInspectionEligibility(batchId: number | null) {
  return useQuery({
    queryKey: ["quality-inspectability", batchId],
    queryFn: () => qualityInspectionService.inspectability(batchId!),
    enabled: batchId != null && batchId > 0,
  });
}

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: qualityInspectionService.create,
    onSuccess: () => {
      // The verdict moves the lot, so the batch and production views change with it.
      qc.invalidateQueries({ queryKey: ["quality-inspections"] });
      qc.invalidateQueries({ queryKey: ["batches"] });
      qc.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Verdict recorded");
    },
    onError: (e) => toast.error(apiMessage(e, "Could not record the inspection")),
  });
}

// ── BOM ──
export function useBoms() {
  return useQuery({ queryKey: ["boms"], queryFn: bomService.list });
}

export function useCreateBom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bomService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["boms"] }); toast.success("BOM created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}
