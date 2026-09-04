import { api } from "@/lib/api";

export type TriageComplaint = {
  id: number; token: string; issue: string; note: string | null; locationHint: string | null;
  photoName: string | null; receivedAt: string;
  item: { id: number; code: string } | null;
  batch: { id: number; batchCode: string } | null;
};

export const regulatoryComplaintService = {
  list: () => api.get<TriageComplaint[]>("/api/regulator/complaints").then((response) => response.data),
  promote: ({ id, caseCategory }: { id: number; caseCategory: string }) => api.post(`/api/regulator/complaints/${id}/promote`, { caseCategory }).then((response) => response.data),
  dismiss: (id: number) => api.post(`/api/regulator/complaints/${id}/dismiss`).then((response) => response.data),
  async photoUrl(id: number): Promise<string> {
    const response = await api.get<Blob>(`/api/regulator/complaints/${id}/photo`, { responseType: "blob" });
    return URL.createObjectURL(response.data);
  },
};
