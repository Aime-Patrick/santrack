"use client";

import { AlertTriangle, ClipboardCheck, Radar, ScanLine, ShieldAlert, UserRoundX } from "lucide-react";
import { useRegulatoryCommand } from "@/hooks/regulatory-command";

const cards = [
  { key: "activeCases", label: "Active cases", icon: ClipboardCheck, tone: "text-primary" },
  { key: "overdueCases", label: "Overdue", icon: AlertTriangle, tone: "text-danger" },
  { key: "unassignedCases", label: "Need owner", icon: UserRoundX, tone: "text-warning" },
  { key: "activeRecalls", label: "Active recalls", icon: ShieldAlert, tone: "text-danger" },
  { key: "marketReportsToTriage", label: "Market triage", icon: Radar, tone: "text-warning" },
  { key: "inspectionsToday", label: "Inspections today", icon: ScanLine, tone: "text-success" },
] as const;

export function CommandOverview() {
  const { data, isLoading } = useRegulatoryCommand();
  return <section><div className="mb-3"><h2 className="text-lg font-semibold tracking-tight">Today’s command view</h2><p className="text-sm text-muted-foreground">Work requiring attention. Signals remain review prompts, not decisions.</p></div><div className="grid grid-cols-2 gap-3 lg:grid-cols-6">{cards.map((card) => { const Icon = card.icon; const value = data?.[card.key] ?? 0; return <div key={card.key} className="rounded-xl border border-border bg-card p-3"><Icon className={`size-4 ${card.tone}`} /><p className="mt-3 text-2xl font-semibold tabular-nums">{isLoading ? "—" : value}</p><p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p></div>; })}</div>{(data?.highAttentionSignals ?? 0) > 0 && <p className="mt-3 flex items-center gap-2 text-sm text-danger"><AlertTriangle className="size-4" /> {data?.highAttentionSignals} high-attention signal{data?.highAttentionSignals === 1 ? "" : "s"} need review.</p>}</section>;
}
