"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  itemService,
  type RegisterUnitsInput,
  type RegisterPackageInput,
  type PackInput,
  type LifecycleAction,
  type ItemKind,
} from "@/services/item.service";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useItems(params: { kind?: ItemKind; topLevel?: boolean; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ["items", params],
    queryFn: () => itemService.list(params),
  });
}

export function useItem(qrCode: string) {
  return useQuery({
    queryKey: ["item", qrCode],
    queryFn: () => itemService.get(qrCode),
    enabled: !!qrCode,
  });
}

export function useItemContents(qrCode: string) {
  return useQuery({
    queryKey: ["item-contents", qrCode],
    queryFn: () => itemService.contents(qrCode),
    enabled: !!qrCode,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useRegisterUnits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterUnitsInput) => itemService.registerUnits(input),
    onSuccess: (items) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success(`${items.length} unit(s) registered`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to register units");
    },
  });
}

export function useRegisterPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterPackageInput) => itemService.registerPackage(input),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success(`Package registered: ${item.code}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to register package");
    },
  });
}

export function usePackItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qrCode, input }: { qrCode: string; input: PackInput }) =>
      itemService.pack(qrCode, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item-contents"] });
      toast.success("Items packed successfully");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to pack items");
    },
  });
}

export function useOpenPackage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ qrCode, notes }: { qrCode: string; notes?: string }) =>
      itemService.open(qrCode, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Package opened");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to open package");
    },
  });
}

export function useLifecycleAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      qrCode,
      action,
      reason,
    }: {
      qrCode: string;
      action: LifecycleAction;
      reason?: string;
    }) => itemService.lifecycle(qrCode, action, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item"] });
      toast.success("Lifecycle action applied");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to apply lifecycle action");
    },
  });
}
