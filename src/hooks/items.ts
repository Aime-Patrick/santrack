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
import { getApiErrorMessage } from "@/lib/api";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useItems(params: {
  kind?: ItemKind;
  topLevel?: boolean;
  page?: number;
  size?: number;
  productId?: number;
} = {}) {
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
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to register units"));
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
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to register package"));
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
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to pack items"));
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
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to open package"));
    },
  });
}

/**
 * Identifies a scanned code, on demand.
 *
 * A scanner input needs the answer at the moment of the scan, not on the next
 * render, so this is a mutation rather than a query — the caller awaits it and
 * decides what to do with what came back. It is how one scan box can serve a
 * whole workflow: the platform already records whether an identity is a unit
 * or a container, so the operator never has to say which they are holding.
 *
 * Deliberately silent on failure. An unknown code is an ordinary event at a
 * packing bench — someone scans the courier's own label — and the calling
 * screen says so in place, where the operator is looking.
 */
export function useResolveScan() {
  return useMutation({
    mutationFn: (qrCode: string) => itemService.get(qrCode.trim()),
  });
}

/**
 * Takes one item back out of an open container.
 *
 * Removal is an event, not a deletion — the item keeps its identity and the
 * container keeps the record that it was once inside (business rule 9).
 */
export function useRemoveUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      qrCode,
      childQrCode,
      notes,
    }: {
      qrCode: string;
      childQrCode: string;
      notes?: string;
    }) => itemService.removeUnit(qrCode, childQrCode, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["item-contents"] });
      toast.success("Item removed from the container");
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to remove the item"));
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
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, "Failed to apply lifecycle action"));
    },
  });
}
