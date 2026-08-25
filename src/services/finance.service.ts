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

export interface Budget {
  id: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  costCentreId: number | null;
  costCentreCode: string | null;
  period: string;
  amount: number;
  createdAt: string;
}

export const budgetService = {
  list: () => api.get<Budget[]>("/api/finance/budgets").then((r) => r.data),
  /** `amount` is sent as a string — the API validates it with IsNumberString. */
  create: (data: { accountId: number; costCentreId?: number; period: string; amount: string }) =>
    api.post<Budget>("/api/finance/budgets", data).then((r) => r.data),
  update: (id: number, data: Partial<Pick<Budget, "period" | "amount">>) =>
    api.patch<Budget>(`/api/finance/budgets/${id}`, data).then((r) => r.data),
};

export interface CostCentre {
  id: number;
  code: string;
  name: string;
  active: boolean;
  createdAt: string;
}

export const costCentreService = {
  list: () => api.get<CostCentre[]>("/api/finance/cost-centres").then((r) => r.data),
  get: (id: number) => api.get<CostCentre>(`/api/finance/cost-centres/${id}`).then((r) => r.data),
  create: (data: { code: string; name: string }) =>
    api.post<CostCentre>("/api/finance/cost-centres", data).then((r) => r.data),
  update: (id: number, data: Partial<Pick<CostCentre, "name" | "active">>) =>
    api.patch<CostCentre>(`/api/finance/cost-centres/${id}`, data).then((r) => r.data),
};

export interface JournalLine {
  accountId: number;
  accountCode: string;
  accountName: string;
  costCentreId: number | null;
  costCentreCode: string | null;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  id: number;
  entryNumber: string;
  description: string;
  postedOn: string;
  createdById: number | null;
  createdAt: string;
  lines: JournalLine[];
}

export const journalService = {
  list: () => api.get<JournalEntry[]>("/api/finance/journal").then((r) => r.data),
  get: (id: number) => api.get<JournalEntry>(`/api/finance/journal/${id}`).then((r) => r.data),
  create: (data: { description: string; postedOn: string; lines: { accountId: number; costCentreId?: number; debit: number; credit: number }[] }) =>
    api.post<JournalEntry>("/api/finance/journal", data).then((r) => r.data),
};

export interface TrialBalanceLine {
  accountId: number;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface ProfitAndLossReport {
  period: string;
  revenue: { accountCode: string; accountName: string; total: number }[];
  expenses: { accountCode: string; accountName: string; total: number }[];
  netIncome: number;
}

export interface BalanceSheetReport {
  assets: { accountCode: string; accountName: string; total: number }[];
  liabilities: { accountCode: string; accountName: string; total: number }[];
  equity: { accountCode: string; accountName: string; total: number }[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface CostCentreReport {
  costCentreId: number;
  costCentreCode: string;
  costCentreName: string;
  totalCost: number;
}

export interface ReceivableLine {
  accountCode: string;
  accountName: string;
  balance: number;
}

export const financeReportService = {
  trialBalance: () => api.get<TrialBalanceLine[]>("/api/finance/reports/trial-balance").then((r) => r.data),
  profitAndLoss: (period?: string) =>
    api.get<ProfitAndLossReport>("/api/finance/reports/profit-and-loss", { params: { period } }).then((r) => r.data),
  balanceSheet: () => api.get<BalanceSheetReport>("/api/finance/reports/balance-sheet").then((r) => r.data),
  costCentreReport: (period?: string) =>
    api.get<CostCentreReport[]>("/api/finance/reports/cost-centres", { params: { period } }).then((r) => r.data),
  receivables: () => api.get<ReceivableLine[]>("/api/finance/reports/receivables").then((r) => r.data),
};
