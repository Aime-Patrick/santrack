"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  purchaseOrderService,
  supplierService,
} from "@/services/purchasing.service";
import { toast } from "sonner";

function purchasingError(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data
      ?.message ?? fallback
  );
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["purchasing", "suppliers"],
    queryFn: supplierService.list,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: supplierService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchasing", "suppliers"] });
      toast.success("Supplier added");
    },
    onError: (e) => toast.error(purchasingError(e, "Could not add supplier")),
  });
}

export function usePurchaseOrders(page = 0, size = 20) {
  return useQuery({
    queryKey: ["purchasing", "orders", page, size],
    queryFn: () => purchaseOrderService.list(page, size),
  });
}

export function useCreatePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: purchaseOrderService.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchasing", "orders"] });
      toast.success("Purchase order drafted");
    },
    onError: (e) => toast.error(purchasingError(e, "Could not create PO")),
  });
}

export function useSendPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: purchaseOrderService.send,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchasing", "orders"] });
      toast.success("Purchase order sent");
    },
    onError: (e) => toast.error(purchasingError(e, "Could not send PO")),
  });
}

export function useConfirmPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: purchaseOrderService.confirm,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchasing", "orders"] });
      toast.success("Purchase order confirmed");
    },
    onError: (e) => toast.error(purchasingError(e, "Could not confirm PO")),
  });
}

export function useCancelPurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: purchaseOrderService.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchasing", "orders"] });
      toast.success("Purchase order cancelled");
    },
    onError: (e) => toast.error(purchasingError(e, "Could not cancel PO")),
  });
}

export function useReceivePurchaseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { receipts: { lineId: number; quantity: string }[] };
    }) => purchaseOrderService.receive(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchasing", "orders"] });
      toast.success("Receipt recorded on the PO");
    },
    onError: (e) => toast.error(purchasingError(e, "Could not record receipt")),
  });
}
