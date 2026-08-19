"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService, invoiceService, returnService, quotationService, salesOrderService } from "@/services/commerce.service";
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

export function useRejectQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { reason: string } }) => quotationService.reject(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "quotations"] }); toast.success("Quotation rejected"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExpireQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quotationService.expire,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "quotations"] }); toast.success("Quotation expired"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Invoice extras ──
export function useVoidInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invoiceService.void,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "invoices"] }); toast.success("Invoice voided"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Return extras ──
export function useRefundReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: returnService.refund,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "returns"] }); toast.success("Return refunded"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRejectReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { reason: string } }) => returnService.reject(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "returns"] }); toast.success("Return rejected"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ── Customer statement ──
export function useCustomerStatement(id: number) {
  return useQuery({ queryKey: ["commerce", "customers", id, "statement"], queryFn: () => customerService.statement(id), enabled: !!id });
}

// ── Sales Orders ──
export function useSalesOrders(page = 0, size = 20) {
  return useQuery({ queryKey: ["commerce", "sales-orders", page, size], queryFn: () => salesOrderService.list(page, size) });
}

export function useCreateSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] }); toast.success("Sales order created"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useConfirmSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.confirm,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] }); toast.success("Sales order confirmed"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useFulfilSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.fulfil,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] }); toast.success("Sales order fulfilled"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCancelSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.cancel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] }); toast.success("Sales order cancelled"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
