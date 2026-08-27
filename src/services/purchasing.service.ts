import { api } from "@/lib/api";

export interface Supplier {
  id: number;
  organizationId: number;
  code: string;
  name: string;
  linkedOrganizationId: number | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  createdAt: string;
}

export interface PurchaseOrderLine {
  id: number;
  productId: number;
  productName: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number | null;
  receivedQuantity: number;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  status: string;
  supplierId: number;
  supplierName: string;
  expectedOn: string | null;
  subtotal: number | null;
  taxPercent: number | null;
  totalAmount: number | null;
  notes: string | null;
  createdAt: string;
  lines: PurchaseOrderLine[];
}

export interface PaginatedPurchaseOrders {
  content: PurchaseOrder[];
  total: number;
  page: number;
  size: number;
}

export const supplierService = {
  list: () =>
    api
      .get<{ total: number; content: Supplier[] }>("/api/purchasing/suppliers")
      .then((r) => r.data.content),
  create: (data: {
    name: string;
    code?: string;
    linkedOrganizationId?: number;
    contactPerson?: string;
    phone?: string;
    email?: string;
  }) => api.post<Supplier>("/api/purchasing/suppliers", data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{
      name: string;
      contactPerson: string;
      phone: string;
      email: string;
      active: boolean;
      linkedOrganizationId: number | null;
    }>,
  ) =>
    api.patch<Supplier>(`/api/purchasing/suppliers/${id}`, data).then((r) => r.data),
};

export const purchaseOrderService = {
  list: (page = 0, size = 20) =>
    api
      .get<PaginatedPurchaseOrders>("/api/purchasing/orders", {
        params: { page, size },
      })
      .then((r) => r.data),
  get: (id: number) =>
    api.get<PurchaseOrder>(`/api/purchasing/orders/${id}`).then((r) => r.data),
  create: (data: {
    supplierId: number;
    lines: { productId: number; quantity: string; unitPrice: string; description?: string }[];
    expectedOn?: string;
    taxPercent?: string;
    notes?: string;
  }) =>
    api.post<PurchaseOrder>("/api/purchasing/orders", data).then((r) => r.data),
  send: (id: number) =>
    api.post<PurchaseOrder>(`/api/purchasing/orders/${id}/send`).then((r) => r.data),
  confirm: (id: number) =>
    api
      .post<PurchaseOrder>(`/api/purchasing/orders/${id}/confirm`)
      .then((r) => r.data),
  cancel: (id: number) =>
    api
      .post<PurchaseOrder>(`/api/purchasing/orders/${id}/cancel`)
      .then((r) => r.data),
  receive: (
    id: number,
    data: { receipts: { lineId: number; quantity: string }[] },
  ) =>
    api
      .post<PurchaseOrder>(`/api/purchasing/orders/${id}/receive`, data)
      .then((r) => r.data),
};
