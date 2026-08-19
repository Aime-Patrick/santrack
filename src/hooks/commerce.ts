"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService, invoiceService, returnService, quotationService } from "@/services/commerce.service";
import { toast } from "sonner";

// ── Customers ──
export function useCustomers() {
  return useQuery({ queryKey: ["commerce", "customers"], queryFn: customerService.list });
}

export function useCustomer(id: number) {
  return useQuery({ queryKey: ["commerce", "customers", id], queryFn: () => customerService.get(id), enabled: !!id });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: customerService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "customers"] }); toast.success("Customer created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Invoices ──
export function useInvoices(page = 0, size = 20) {
  return useQuery({ queryKey: ["commerce", "invoices", page, size], queryFn: () => invoiceService.list(page, size) });
}

export function useInvoice(id: number) {
  return useQuery({ queryKey: ["commerce", "invoices", id], queryFn: () => invoiceService.get(id), enabled: !!id });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invoiceService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "invoices"] }); toast.success("Invoice created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invoiceService.issue,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "invoices"] }); toast.success("Invoice issued"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { amount: number; method: string; reference?: string } }) => invoiceService.pay(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "invoices"] }); toast.success("Payment recorded"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Returns ──
export function useReturns(page = 0, size = 20) {
  return useQuery({ queryKey: ["commerce", "returns", page, size], queryFn: () => returnService.list(page, size) });
}

export function useRequestReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: returnService.request,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "returns"] }); toast.success("Return requested"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApproveReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { refundMethod: string } }) => returnService.approve(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "returns"] }); toast.success("Return approved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Quotations ──
export function useQuotations(page = 0, size = 20) {
  return useQuery({ queryKey: ["commerce", "quotations", page, size], queryFn: () => quotationService.list(page, size) });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quotationService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "quotations"] }); toast.success("Quotation created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useSendQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quotationService.send,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "quotations"] }); toast.success("Quotation sent"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAcceptQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quotationService.accept,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "quotations"] }); toast.success("Quotation accepted"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
