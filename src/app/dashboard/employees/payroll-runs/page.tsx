"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BarChart3, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollRunsPanel } from "@/components/people/payroll-runs-panel";
import { PayrollReportsPanel } from "@/components/people/payroll-reports-panel";

/**
 * A payroll run and the report of that run are one monthly job. Splitting them
 * across two menu entries meant finishing the run and then hunting for its
 * output somewhere else.
 *
 * Retired routes redirect here with ?tab=, so saved links still land where
 * they named.
 */
function PayrollWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "runs");

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted && wanted !== tab) setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/employees/payroll-runs?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-success text-white">
            <Wallet className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Payroll</h1>
            <p className="text-sm text-muted-foreground">Run the payroll, then read what it produced.</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="runs" className="gap-2">
            <Wallet className="size-4" />
            Runs
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="size-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="runs">
          <PayrollRunsPanel />
        </TabsContent>
        <TabsContent value="reports">
          <PayrollReportsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PayrollPage() {
  return (
    <Suspense fallback={null}>
      <PayrollWorkspace />
    </Suspense>
  );
}
