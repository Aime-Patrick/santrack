"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ClipboardList, List, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsPanel } from "@/components/finance-panels/accounts-panel";
import { JournalPanel } from "@/components/finance-panels/journal-panel";
import { BudgetsPanel } from "@/components/finance-panels/budgets-panel";
import { CostCentresPanel } from "@/components/finance-panels/cost-centres-panel";

/**
 * One ledger, four views of it. Chart of accounts, journal entries, budgets and
 * cost centres are not four places a bookkeeper goes — they are the structure,
 * the postings and the plan for the same set of books, and a posting is
 * routinely checked against all three.
 *
 * Retired routes redirect here with ?tab=, so saved links still land where
 * they named.
 */
function AccountingWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "accounts");

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted && wanted !== tab) setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/finance/accounts?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
          <Wallet className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Accounting</h1>
          <p className="text-sm text-muted-foreground">The ledger: what the accounts are, what was posted, and what was planned.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="accounts" className="gap-2">
            <List className="size-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-2">
            <ClipboardList className="size-4" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="budgets" className="gap-2">
            <Wallet className="size-4" />
            Budgets
          </TabsTrigger>
          <TabsTrigger value="cost-centres" className="gap-2">
            <Building2 className="size-4" />
            Cost centres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <AccountsPanel />
        </TabsContent>
        <TabsContent value="journal">
          <JournalPanel />
        </TabsContent>
        <TabsContent value="budgets">
          <BudgetsPanel />
        </TabsContent>
        <TabsContent value="cost-centres">
          <CostCentresPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountingPage() {
  return (
    <Suspense fallback={null}>
      <AccountingWorkspace />
    </Suspense>
  );
}
