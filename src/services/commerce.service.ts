import { api } from "@/lib/api";

export interface Customer {
  id: number;
  /** The seller. This is the tenant that owns the record, never the buyer. */
  organizationId: number;
  /**
   * The buying organization, when the buyer is a business on the platform.
   * Null for everyone else — and that decides what fulfilment does: a transfer
   * the buyer confirms, or a sale that takes the goods out of the chain.
   */
  buyerOrganizationId: number | null;
  buyerOrganizationName: string | null;
  code: string;
  name: string;
  type: string;
  segment: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  creditLimit: number | null;
  active: boolean;
  createdAt: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  status: string;
  customerId: number;
  customerName: string;
  salesOrderId: number | null;
  salesOrderNumber: string | null;
  issuedOn: string;
  dueOn: string;
  subtotal: number | null;
  taxPercent: number | null;
  totalAmount: number | null;
  amountPaid: number;
  balance: number | null;
  notes: string;
  createdAt: string;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  paymentNumber: string;
  invoiceId: number;
  invoiceNumber: string;
  amount: number;
  method: string;
  reference: string;
  paidOn: string;
  createdAt: string;
}

export interface SalesReturn {
  id: number;
  returnNumber: string;
  status: string;
  customerId: number;
  customerName: string;
  invoiceId: number | null;
  invoiceNumber: string | null;
  reason: string;
  refundAmount: number | null;
  createdAt: string;
}

export interface Quotation {
  id: number;
  quotationNumber: string;
  status: string;
  customerId: number;
  customerName: string;
  validUntilOn: string;
  subtotal: number | null;
  taxPercent: number | null;
  totalAmount: number | null;
  notes: string;
  createdAt: string;
  lines: QuotationLine[];
}

export interface QuotationLine {
  id: number;
  productId: number;
  productName: string;
  description: string;
  salesUnit: string | null;
  requestedQuantity: number;
  /** Alias of requestedQuantity — kept for older display paths. */
  quantity: number;
  unitPrice: number;
  lineTotal: number | null;
}

export interface PaginatedResponse<T> {
  total: number;
  content: T[];
}

export interface SalesOrder {
  id: number;
  orderNumber: string;
  status: string;
  customerId: number;
  customerName: string;
  quotationId: number | null;
  quotationNumber: string | null;
  invoiceId: number | null;
  invoiceNumber: string | null;
  subtotal: number | null;
  taxPercent: number | null;
  totalAmount: number | null;
  notes: string;
  /** Set when the goods went to a registered buyer, who confirms receipt. */
  transferId: number | null;
  /** Set when they left the chain instead. Exactly one of the two once fulfilled. */
  saleId: number | null;
  /** Set when warehouse rounding was accepted before confirm (DR-09). */
  roundingAcceptedAt: string | null;
  createdAt: string;
  lines: SalesOrderLine[];
}

export interface SalesOrderLine {
  id: number;
  productId: number;
  productName: string;
  description: string;
  salesUnit: string | null;
  requestedQuantity: number;
  fulfilmentQuantity: number | null;
  /** Alias of requestedQuantity — kept for older display paths. */
  quantity: number;
  unitPrice: number;
  lineTotal: number | null;
}

export interface FulfilmentPlanLine {
  lineId: number;
  productId: number;
  productName: string;
  salesUnit: string | null;
  baseUnit: string | null;
  packUnit: string | null;
  unitsPerPack: number | null;
  requestedQuantity: number;
  requestedProductUnits: number;
  plannedFulfilmentQuantity: number | null;
  plannedIdentityCount: number | null;
  availableProductUnits: number;
  roundedUp: boolean;
  shortfall: boolean;
}

export interface FulfilmentPlan {
  orderId: number;
  orderNumber: string;
  roundingAcceptedAt: string | null;
  lines: FulfilmentPlanLine[];
  needsRoundingAccept: boolean;
}

export type CommerceLineInput = {
  productId: number;
  requestedQuantity: string;
  unitPrice: string;
  salesUnit?: string;
  description?: string;
};

export const salesOrderService = {
  list: (page = 0, size = 20) => api.get<PaginatedResponse<SalesOrder>>("/api/commerce/orders", { params: { page, size } }).then((r) => r.data),
  get: (id: number) => api.get<SalesOrder>(`/api/commerce/orders/${id}`).then((r) => r.data),
  /**
   * Quantity, unit price and tax arrive as numeric *strings*: they are decimals
   * the API keeps exact, and it validates them with @IsNumberString. Passing
   * real numbers is rejected.
   */
  create: (data: {
    customerId: number;
    quotationId?: number;
    lines: CommerceLineInput[];
    taxPercent?: string;
    notes?: string;
  }) => api.post<SalesOrder>("/api/commerce/orders", data).then((r) => r.data),
  confirm: (id: number) => api.post<SalesOrder>(`/api/commerce/orders/${id}/confirm`).then((r) => r.data),
  acceptRounding: (id: number) =>
    api.post<SalesOrder>(`/api/commerce/orders/${id}/accept-rounding`).then((r) => r.data),
  release: (id: number) => api.post<SalesOrder>(`/api/commerce/orders/${id}/release`).then((r) => r.data),
  fulfil: (id: number) => api.post<SalesOrder>(`/api/commerce/orders/${id}/fulfil`).then((r) => r.data),
  cancel: (id: number) => api.post<SalesOrder>(`/api/commerce/orders/${id}/cancel`).then((r) => r.data),
  fulfilmentPlan: (id: number) =>
    api.get<FulfilmentPlan>(`/api/commerce/orders/${id}/fulfilment-plan`).then((r) => r.data),
};

export const customerService = {
  list: () => api.get<PaginatedResponse<Customer>>("/api/commerce/customers").then((r) => r.data),
  get: (id: number) => api.get<Customer>(`/api/commerce/customers/${id}`).then((r) => r.data),
  create: (data: Partial<Customer>) => api.post<Customer>("/api/commerce/customers", data).then((r) => r.data),
  update: (id: number, data: Partial<Customer>) => api.patch<Customer>(`/api/commerce/customers/${id}`, data).then((r) => r.data),
  statement: (id: number) => api.get(`/api/commerce/customers/${id}/statement`).then((r) => r.data),
};

export const invoiceService = {
  list: (page = 0, size = 20) => api.get<PaginatedResponse<Invoice>>("/api/commerce/invoices", { params: { page, size } }).then((r) => r.data),
  get: (id: number) => api.get<Invoice>(`/api/commerce/invoices/${id}`).then((r) => r.data),
  /**
   * An invoice bills a sales order, so `salesOrderId` is what identifies it —
   * the customer and the amounts come from the order. There are no invoice
   * lines: this posted { customerId, lines } before, which the API has never
   * accepted.
   *
   * Amounts are numeric strings, kept exact and validated as such.
   */
  create: (data: {
    salesOrderId: number;
    issuedOn?: string;
    dueOn?: string;
    subtotal?: string;
    totalAmount?: string;
    notes?: string;
  }) => api.post<Invoice>("/api/commerce/invoices", data).then((r) => r.data),
  issue: (id: number) => api.post<Invoice>(`/api/commerce/invoices/${id}/issue`).then((r) => r.data),
  pay: (id: number, data: { amount: string; method: string; reference?: string }) =>
    api.post(`/api/commerce/invoices/${id}/pay`, data).then((r) => r.data),
  void: (id: number) => api.post<Invoice>(`/api/commerce/invoices/${id}/void`).then((r) => r.data),
};

export const returnService = {
  list: (page = 0, size = 20) => api.get<PaginatedResponse<SalesReturn>>("/api/commerce/returns", { params: { page, size } }).then((r) => r.data),
  get: (id: number) => api.get<SalesReturn>(`/api/commerce/returns/${id}`).then((r) => r.data),
  request: (data: { invoiceId: number; reason: string; items: { invoiceLineId: number; quantity: number }[] }) =>
    api.post<SalesReturn>("/api/commerce/returns", data).then((r) => r.data),
  approve: (id: number, data: { refundMethod: string }) =>
    api.post<SalesReturn>(`/api/commerce/returns/${id}/approve`, data).then((r) => r.data),
  refund: (id: number) => api.post<SalesReturn>(`/api/commerce/returns/${id}/refund`).then((r) => r.data),
  reject: (id: number, data: { reason: string }) =>
    api.post<SalesReturn>(`/api/commerce/returns/${id}/reject`, data).then((r) => r.data),
};

export const quotationService = {
  list: (page = 0, size = 20) => api.get<PaginatedResponse<Quotation>>("/api/commerce/quotations", { params: { page, size } }).then((r) => r.data),
  get: (id: number) => api.get<Quotation>(`/api/commerce/quotations/${id}`).then((r) => r.data),
  create: (data: {
    customerId: number;
    lines: CommerceLineInput[];
    taxPercent?: string;
    notes?: string;
    validUntilOn?: string;
  }) => api.post<Quotation>("/api/commerce/quotations", data).then((r) => r.data),
  send: (id: number) => api.post<Quotation>(`/api/commerce/quotations/${id}/send`).then((r) => r.data),
  accept: (id: number) => api.post<Quotation>(`/api/commerce/quotations/${id}/accept`).then((r) => r.data),
  reject: (id: number, data: { reason: string }) =>
    api.post<Quotation>(`/api/commerce/quotations/${id}/reject`, data).then((r) => r.data),
  expire: (id: number) => api.post<Quotation>(`/api/commerce/quotations/${id}/expire`).then((r) => r.data),
};
