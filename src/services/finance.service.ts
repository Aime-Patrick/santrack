import { api } from "@/lib/api";

export interface Account {
  id: number;
  code: string;
  name: string;
  type: string;
  parentCode: string | null;
  active: boolean;
  createdAt: string;
}

export const accountService = {
  list: () => api.get<Account[]>("/api/finance/accounts").then((r) => r.data),
  get: (id: number) => api.get<Account>(`/api/finance/accounts/${id}`).then((r) => r.data),
  create: (data: { code: string; name: string; type: string; parentCode?: string }) =>
    api.post<Account>("/api/finance/accounts", data).then((r) => r.data),
  update: (id: number, data: Partial<Account>) => api.patch<Account>(`/api/finance/accounts/${id}`, data).then((r) => r.data),
};
