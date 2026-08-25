import type { SelectOption } from "@/components/ui/resource-form-dialog";

/**
 * The five account types of double-entry bookkeeping.
 *
 * Mirrors `AccountType` in the backend's finance enums. The hints say which way
 * each one moves, because the sign convention is the thing people get wrong
 * when setting up a chart of accounts, and getting it wrong is only visible
 * later, in a trial balance that will not balance.
 */
export const ACCOUNT_TYPES: SelectOption[] = [
  { value: "ASSET", label: "Asset", hint: "increases on debit" },
  { value: "LIABILITY", label: "Liability", hint: "increases on credit" },
  { value: "EQUITY", label: "Equity", hint: "increases on credit" },
  { value: "REVENUE", label: "Revenue", hint: "increases on credit" },
  { value: "EXPENSE", label: "Expense", hint: "increases on debit" },
];
