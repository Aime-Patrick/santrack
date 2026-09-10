import { api } from '@/lib/api';

export interface LabelPrintJob {
  id: number;
  poolId: number;
  poolProductName: string | null;
  poolProductSku: string | null;
  template: string;
  quantity: number;
  renderedCount: number;
  printedBy: string | null;
  createdAt: string;
}

export interface LabelPrintJobPage {
  content: LabelPrintJob[];
  total: number;
  page: number;
  size: number;
}

export const labelPrintJobService = {
  async create(input: {
    poolId: number;
    template: string;
    quantity: number;
    renderedCount: number;
  }) {
    const { data } = await api.post<LabelPrintJob>('/api/identity-pools/print-jobs', input);
    return data;
  },

  async list(page = 0, size = 50) {
    const { data } = await api.get<LabelPrintJobPage>('/api/identity-pools/print-jobs', {
      params: { page, size },
    });
    return data;
  },
};
