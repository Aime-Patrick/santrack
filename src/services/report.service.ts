import { api } from "@/lib/api";

export interface ReportMeta {
  name: string;
  label: string;
  description: string;
}

export const REPORT_TYPES: ReportMeta[] = [
  { name: "production", label: "Production", description: "Manufacturing orders, output, and efficiency" },
  { name: "inventory", label: "Inventory", description: "Stock levels across all positions" },
  { name: "stock-movement", label: "Stock Movements", description: "All inbound and outbound movements" },
  { name: "quality", label: "Quality", description: "Inspection results and pass/fail rates" },
  { name: "batch", label: "Batches", description: "Batch codes, status, and expiry dates" },
  { name: "shipment", label: "Shipments", description: "Logistics and delivery tracking" },
  { name: "sales", label: "Sales", description: "Sales lines, buyers, and revenue" },
  { name: "transfer", label: "Transfers", description: "Stock transfers between locations" },
  { name: "licensing", label: "Licensing", description: "License status and expiry tracking" },
  { name: "materials", label: "Materials", description: "Raw material catalog and reorder levels" },
];

export const reportService = {
  async getData(name: string): Promise<Record<string, unknown>[]> {
    const r = await api.get<Record<string, unknown>[]>(`/api/reporting/${name}`);
    return r.data;
  },

  async exportCsv(name: string): Promise<void> {
    const r = await api.get(`/api/reporting/${name}/export`, { responseType: "blob" });
    const blob = new Blob([r.data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
