import { api } from "@/lib/api";

export interface Machine {
  id: number;
  code: string;
  name: string;
  type: string;
  status: string;
  active: boolean;
  createdAt: string;
}

export const machineService = {
  list: () => api.get<Machine[]>("/api/machines").then((r) => r.data),
  get: (id: number) => api.get<Machine>(`/api/machines/${id}`).then((r) => r.data),
  create: (data: { code: string; name: string; type: string }) => api.post<Machine>("/api/machines", data).then((r) => r.data),
};
