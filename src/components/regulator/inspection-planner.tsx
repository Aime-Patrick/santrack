"use client";

import { ClipboardCheck, Clock, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuthorityInspections, useRegulatoryCases } from "@/hooks/regulatory-cases";
import { cn } from "@/lib/utils";
import type { RegulatoryCase } from "@/services/regulatory-case.service";

const RESULT_BADGE: Record<string, string> = {
  PASS: "bg-emerald-600 text-white",
  CONDITIONAL: "bg-amber-500 text-white",
  FAIL: "bg-danger text-white",
};

function startOfDay(d: Date) {
  const next = new Date(d);
  next.setHours(0, 0, 0, 0);
  return next;
}

function dueLabel(dueOn: string) {
  const days = Math.ceil((new Date(`${dueOn}T00:00:00`).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days}d`;
}

function isRosterCase(caseRecord: RegulatoryCase) {
  if (caseRecord.status === "CLOSED" || caseRecord.status === "RESOLVED") return false;
  if (!caseRecord.dueOn) return false;
  const due = startOfDay(new Date(`${caseRecord.dueOn}T00:00:00`));
  const horizon = startOfDay(new Date());
  horizon.setDate(horizon.getDate() + 7);
  return due.getTime() <= horizon.getTime();
}

export function InspectionPlanner({ onOpenCase }: { onOpenCase?: (id: number) => void }) {
  const { data: cases = [], isLoading: casesLoading } = useRegulatoryCases();
  const { data: inspections = [], isLoading: inspectionsLoading } = useAuthorityInspections(40);

  const roster = [...cases.filter(isRosterCase)].sort((a, b) => String(a.dueOn).localeCompare(String(b.dueOn)));
  const todayStart = startOfDay(new Date()).getTime();
  const recordedToday = inspections.filter((row) => new Date(row.inspectedAt).getTime() >= todayStart);
  const recordedEarlier = inspections.filter((row) => new Date(row.inspectedAt).getTime() < todayStart).slice(0, 8);

  const loading = casesLoading || inspectionsLoading;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-border">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Clock className="size-4 text-primary" />
          <h3 className="text-sm font-semibold">Visit roster</h3>
          <Badge className="ml-auto bg-primary text-white">{roster.length}</Badge>
        </header>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : roster.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No open cases due in the next 7 days.</p>
          ) : (
            roster.map((caseRecord) => (
              <button
                key={caseRecord.id}
                type="button"
                onClick={() => onOpenCase?.(caseRecord.id)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{caseRecord.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {caseRecord.organization.name}
                    {caseRecord.facility ? ` · ${caseRecord.facility.name}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-medium",
                    dueLabel(caseRecord.dueOn!).includes("overdue") ? "text-danger" : "text-muted-foreground",
                  )}
                >
                  {dueLabel(caseRecord.dueOn!)}
                </span>
              </button>
            ))
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border">
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <ClipboardCheck className="size-4 text-success" />
          <h3 className="text-sm font-semibold">Recorded visits</h3>
          <Badge className="ml-auto bg-success text-white">{recordedToday.length} today</Badge>
        </header>
        <div className="divide-y divide-border">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : inspections.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">No field inspections recorded yet.</p>
          ) : (
            [...recordedToday, ...recordedEarlier].map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => onOpenCase?.(row.caseId)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.caseTitle ?? row.organization.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.inspector.name} · {row.organization.name}
                  </p>
                </div>
                <Badge className={`${RESULT_BADGE[row.result] ?? "bg-slate-500 text-white"} shrink-0`}>
                  {row.result}
                </Badge>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
