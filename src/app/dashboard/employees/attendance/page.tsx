"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttendancePanel } from "@/components/people/attendance-panel";
import { LeavePanel } from "@/components/people/leave-panel";

/**
 * Attendance and leave are the same question — was this person at work today —
 * answered from two directions, so they belong on one screen rather than two
 * menu entries a supervisor has to flip between.
 *
 * Retired routes redirect here with ?tab=, so saved links still land where
 * they named.
 */
function TimeWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(() => searchParams.get("tab") ?? "attendance");

  useEffect(() => {
    const wanted = searchParams.get("tab");
    if (wanted && wanted !== tab) setTab(wanted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const select = (next: string) => {
    setTab(next);
    router.replace(`/dashboard/employees/attendance?tab=${next}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Clock className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Time</h1>
            <p className="text-sm text-muted-foreground">Who was in, and who was away.</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={select} className="space-y-4">
        <TabsList className="rounded-xl border border-border/80 bg-muted/50 p-1">
          <TabsTrigger value="attendance" className="gap-2">
            <Clock className="size-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-2">
            <Calendar className="size-4" />
            Leave
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <AttendancePanel />
        </TabsContent>
        <TabsContent value="leave">
          <LeavePanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TimePage() {
  return (
    <Suspense fallback={null}>
      <TimeWorkspace />
    </Suspense>
  );
}
