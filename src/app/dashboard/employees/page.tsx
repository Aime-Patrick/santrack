"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, ClipboardList, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeesPanel } from "@/components/people/employees-panel";
import { DepartmentsPanel } from "@/components/people/departments-panel";
import { JobPositionsPanel } from "@/components/people/job-positions-panel";

/**
 * The HR record. Employees, the departments they sit in and the positions they
 * are hired into are one subject looked at three ways, and the last two are
 * edited perhaps twice a year — as their own menu entries they sat permanently
 * beside a screen somebody opens daily.
 *
 * Retired routes redirect here with ?tab=, so saved links still land where
 * they named.
 */
function PeopleWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "employees");

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted && wanted !== tab) setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/employees?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Users className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">People</h1>
            <p className="text-sm text-muted-foreground">Who works here, how they are organised, and what they are hired as.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href="/dashboard/employees/payroll-runs" />}
          >
            Payroll
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/dashboard/employees/new" />}>
            <Plus className="mr-1.5 size-4" /> Add employee
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="employees" className="gap-2">
            <Users className="size-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="size-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="positions" className="gap-2">
            <ClipboardList className="size-4" />
            Job positions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <EmployeesPanel />
        </TabsContent>
        <TabsContent value="departments">
          <DepartmentsPanel />
        </TabsContent>
        <TabsContent value="positions">
          <JobPositionsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense fallback={null}>
      <PeopleWorkspace />
    </Suspense>
  );
}
