"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService, budgetService, costCentreService, journalService, financeReportService } from "@/services/finance.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

export function useAccounts() {
  return useQuery({ queryKey: ["finance", "accounts"], queryFn: accountService.list });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: accountService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "accounts"] }); toast.success("Account created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useBudgets() {
  return useQuery({ queryKey: ["finance", "budgets"], queryFn: budgetService.list });
}

export function useCostCentres() {
  return useQuery({ queryKey: ["finance", "cost-centres"], queryFn: costCentreService.list });
}

export function useJournals() {
  return useQuery({ queryKey: ["finance", "journal"], queryFn: journalService.list });
}

export function useFinanceReports() {
  return {
    trialBalance: useQuery({ queryKey: ["finance", "reports", "trial-balance"], queryFn: financeReportService.trialBalance }),
    balanceSheet: useQuery({ queryKey: ["finance", "reports", "balance-sheet"], queryFn: financeReportService.balanceSheet }),
    receivables: useQuery({ queryKey: ["finance", "reports", "receivables"], queryFn: financeReportService.receivables }),
  };
}

// ── Budget mutations ──
export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: budgetService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "budgets"] }); toast.success("Budget created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<import("@/services/finance.service").Budget, "period" | "amount">> }) => budgetService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "budgets"] }); toast.success("Budget updated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Cost Centre mutations ──
export function useCreateCostCentre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: costCentreService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cost-centres"] }); toast.success("Cost centre created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateCostCentre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Pick<import("@/services/finance.service").CostCentre, "name" | "active">> }) => costCentreService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "cost-centres"] }); toast.success("Cost centre updated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Journal Entry mutation ──
export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: journalService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance", "journal"] }); toast.success("Journal entry created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}
