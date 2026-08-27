"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customerService, invoiceService, returnService, quotationService, salesOrderService } from "@/services/commerce.service";
import { toast } from "sonner";

/**
 * Commerce rules answer with a sentence worth reading - "has no reserved stock
 * - confirm it first". Axios reports "Request failed with status code 409", so
 * unwrap the API message before showing it.
 */
function commerceError(error: unknown, fallback: string): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback
  );
}

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "customers"] }); toast.success("Customer added"); },
    onError: (e) => toast.error(commerceError(e, "Could not add the customer")),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof customerService.update>[1] }) =>
      customerService.update(id, data),
    onSuccess: (_row, { id }) => {
      qc.invalidateQueries({ queryKey: ["commerce", "customers"] });
      qc.invalidateQueries({ queryKey: ["commerce", "customers", id] });
      toast.success("Customer updated");
    },
    onError: (e) => toast.error(commerceError(e, "Could not update the customer")),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commerce", "invoices"] });
      toast.success("Invoice drafted");
    },
    onError: (e) => toast.error(commerceError(e, "Could not create the invoice")),
  });
}

export function useIssueInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: invoiceService.issue,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "invoices"] }); toast.success("Invoice issued"); },
    onError: (e) => toast.error(commerceError(e, "Could not issue the invoice")),
  });
}

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { amount: string; method: string; reference?: string } }) =>
      invoiceService.pay(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "invoices"] }); toast.success("Payment recorded"); },
    onError: (e) => toast.error(commerceError(e, "Could not record the payment")),
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
    onError: (e) => toast.error(commerceError(e, "Could not create the quotation")),
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] }); toast.success("Sales order placed"); },
    onError: (e) => toast.error(commerceError(e, "Could not place the order")),
  });
}

export function useConfirmSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.confirm,
    onSuccess: () => {
      // Confirming reserves identities, so stock and item views change with it.
      qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] });
      qc.invalidateQueries({ queryKey: ["commerce", "fulfilment-plan"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock reserved for this order");
    },
    onError: (e) => toast.error(commerceError(e, "Could not confirm the order")),
  });
}

export function useAcceptRounding() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.acceptRounding,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] });
      qc.invalidateQueries({ queryKey: ["commerce", "fulfilment-plan"] });
      toast.success("Rounding accepted");
    },
    onError: (e) => toast.error(commerceError(e, "Could not accept rounding")),
  });
}

export function useReleaseSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.release,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Reserved stock released");
    },
    onError: (e) => toast.error(commerceError(e, "Could not release stock")),
  });
}

export function useFulfilmentPlan(orderId: number | null, enabled = true) {
  return useQuery({
    queryKey: ["commerce", "fulfilment-plan", orderId],
    queryFn: () => salesOrderService.fulfilmentPlan(orderId!),
    enabled: enabled && !!orderId,
  });
}

/**
 * Optional helper: place a sales order from an accepted quotation, carrying
 * the quote's lines through as requestedQuantity / salesUnit / unitPrice.
 */
export function useCreateSalesOrderFromQuotation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (quotation: {
      id: number;
      customerId: number;
      lines: {
        productId: number;
        requestedQuantity?: number;
        quantity?: number;
        salesUnit?: string | null;
        unitPrice: number;
        description?: string;
      }[];
      taxPercent?: number | null;
      notes?: string;
    }) => {
      // List payloads may omit lines — fetch the quote when needed.
      let lines = quotation.lines;
      if (!lines?.length) {
        const full = await quotationService.get(quotation.id);
        lines = full.lines;
      }
      return salesOrderService.create({
        customerId: quotation.customerId,
        quotationId: quotation.id,
        lines: lines.map((line) => ({
          productId: line.productId,
          requestedQuantity: String(line.requestedQuantity ?? line.quantity ?? 0),
          unitPrice: String(line.unitPrice),
          salesUnit: line.salesUnit ?? undefined,
          description: line.description,
        })),
        taxPercent:
          quotation.taxPercent === null || quotation.taxPercent === undefined
            ? undefined
            : String(quotation.taxPercent),
        notes: quotation.notes,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] });
      qc.invalidateQueries({ queryKey: ["commerce", "quotations"] });
      toast.success("Sales order placed from quotation");
    },
    onError: (e) => toast.error(commerceError(e, "Could not place the order")),
  });
}

export function useFulfilSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.fulfil,
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["transfers"] });
      toast.success(
        order?.transferId
          ? "Dispatched — the buyer confirms on receipt"
          : "Sold — the goods have left the chain",
      );
    },
    onError: (e) => toast.error(commerceError(e, "Could not fulfil the order")),
  });
}

export function useCancelSalesOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: salesOrderService.cancel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["commerce", "sales-orders"] });
      qc.invalidateQueries({ queryKey: ["items"] });
      toast.success("Sales order cancelled");
    },
    onError: (e) => toast.error(commerceError(e, "Could not cancel the order")),
  });
}
