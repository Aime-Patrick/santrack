"use client";
import { Eye, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRegulatoryOversightSummary } from "@/hooks/regulatory-oversight";

export function OversightDashboard() {
  const { data, isLoading } = useRegulatoryOversightSummary(true);
  if (isLoading) return <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">Loading oversight…</div>;
  if (!data) return null;
  const overdueReferrals = data.authorities.reduce((total, row) => total + row.overdueReferrals, 0);
  return <div className="space-y-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white"><Eye className="size-4" /></div><div><h1 className="text-xl font-bold tracking-tight">Regulatory oversight</h1><p className="text-sm text-muted-foreground">Aggregate system health. Operational decisions remain with each authority.</p></div></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-4"><Stat label="Pending referrals" value={data.referrals.pending} /><Stat label="Referral responses overdue" value={overdueReferrals} /><Stat label="Accepted referrals" value={data.referrals.accepted} /><Stat label="Declined referrals" value={data.referrals.declined} /></div><Card><CardHeader><CardTitle className="text-base">Authorities in scope</CardTitle></CardHeader><CardContent className="divide-y divide-border p-0">{data.authorities.map((row) => <div key={row.authority.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-medium">{row.authority.name}</p><p className="mt-1 text-xs text-muted-foreground">{row.authority.code}</p></div><div className="flex flex-wrap gap-2 text-sm"><Badge variant="outline">{row.open} open</Badge>{row.overdue > 0 && <Badge variant="destructive">{row.overdue} overdue</Badge>}{row.overdueReferrals > 0 && <Badge variant="destructive">{row.overdueReferrals} referral responses overdue</Badge>}<Badge variant="outline">{row.unassigned} unassigned</Badge><Badge variant="outline">{row.resolved} resolved</Badge></div></div>)}</CardContent></Card></div>;
}
function Stat({ label, value }: { label: string; value: number }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></CardContent></Card>; }
