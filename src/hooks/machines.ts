"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { machineService } from "@/services/machine.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

export function useMachines() {
  return useQuery({ queryKey: ["machines"], queryFn: machineService.list });
}

export function useCreateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: machineService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["machines"] }); toast.success("Machine registered"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}
