"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productionService, rawMaterialService, qualityInspectionService, bomService } from "@/services/manufacturing.service";
import { toast } from "sonner";

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production-orders"] }); toast.success("Production order created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useStartProduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: productionService.start,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production-orders"] }); toast.success("Production started"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCompleteProduction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: { producedQuantity?: number } }) => productionService.complete(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["production-orders"] }); toast.success("Production completed"); },
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Quality Inspections ──
export function useQualityInspections(page = 0, size = 20) {
  return useQuery({ queryKey: ["quality-inspections", page, size], queryFn: () => qualityInspectionService.list(page, size) });
}

export function useCreateInspection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: qualityInspectionService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quality-inspections"] }); toast.success("Inspection recorded"); },
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
  });
}
