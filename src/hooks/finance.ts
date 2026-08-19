"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService } from "@/services/finance.service";
import { toast } from "sonner";

export function useAccounts() {
  return useQuery({ queryKey: ["finance", "accounts"], queryFn: accountService.list });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "accounts"] }); toast.success("Account created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
