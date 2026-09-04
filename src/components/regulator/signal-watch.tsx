"use client";

import { TriangleAlert, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRegulatorySignals } from "@/hooks/regulatory-signals";

export function SignalWatch() {
  const { data: signals = [], isLoading } = useRegulatorySignals();
  return <Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4"><div><CardTitle className="text-base">Pattern watch</CardTitle><p className="mt-1 text-sm text-muted-foreground">Signals to investigate, not findings or enforcement decisions.</p></div><Badge variant="outline">{signals.length} signals</Badge></CardHeader><CardContent className="p-0">
    {isLoading ? <div className="flex justify-center py-10"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div> : signals.length === 0 ? <div className="px-5 py-8 text-center text-sm text-muted-foreground">No matching patterns detected.</div> : <div className="divide-y divide-border/70">{signals.slice(0, 8).map((signal, index) => <div key={`${signal.type}-${signal.itemCode ?? signal.batchCode}-${index}`} className="flex gap-3 p-4"><TriangleAlert className={signal.severity === "HIGH" ? "mt-0.5 size-4 shrink-0 text-danger" : "mt-0.5 size-4 shrink-0 text-warning"} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium">{signal.title}</p><Badge variant="outline" className={signal.severity === "HIGH" ? "border-danger/30 text-danger" : "border-warning/30"}>{signal.severity === "HIGH" ? "High attention" : "Watch"}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{signal.detail}</p><p className="mt-1 text-xs text-muted-foreground">{signal.itemCode ?? signal.batchCode ?? "Unlinked signal"} · Last seen {new Date(signal.lastSeenAt).toLocaleString()}</p></div></div>)}</div>}
  </CardContent></Card>;
}
