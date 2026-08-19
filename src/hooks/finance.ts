"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accountService, budgetService, costCentreService, journalService, financeReportService } from "@/services/finance.service";
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
