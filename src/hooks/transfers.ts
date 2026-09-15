"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  transferService,
  type DispatchInput,
  type RelocateInput,
} from "@/services/transfer.service";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useOutgoingTransfers(page = 0, size = 20) {
  return useQuery({
    queryKey: ["transfers", "outgoing", page, size],
    queryFn: () => transferService.listOutgoing(page, size),
  });
}

export function useIncomingTransfers(
  pendingOnly = false,
  page = 0,
  size = 20,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: ["transfers", "incoming", pendingOnly, page, size],
    queryFn: () => transferService.listIncoming(pendingOnly, page, size),
    enabled: options?.enabled ?? true,
  });
}

export function useTransfer(id: number) {
  return useQuery({
    queryKey: ["transfer", id],
    queryFn: () => transferService.get(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useDispatchTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DispatchInput) => transferService.dispatch(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer dispatched");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to dispatch transfer");
    },
  });
}

export function useReceiveTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      transferId,
      scannedQrCodes,
    }: {
      transferId: number;
      scannedQrCodes?: string[];
    }) => transferService.receive(transferId, scannedQrCodes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer received");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to receive transfer");
    },
  });
}

export function useRelocate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RelocateInput) => transferService.relocate(input),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`${result.movedCount} item(s) relocated`);
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to relocate items");
    },
  });
}

export function useCancelTransfer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (transferId: number) => transferService.cancel(transferId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success("Transfer cancelled");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to cancel transfer");
    },
  });
}
