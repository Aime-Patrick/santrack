"use client";

import { ArrowRightLeft, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcceptRegulatoryReferral, useIncomingRegulatoryReferrals, useRejectRegulatoryReferral } from "@/hooks/regulatory-referrals";

export function IncomingReferrals() {
  const { data = [], isLoading } = useIncomingRegulatoryReferrals();
  const accept = useAcceptRegulatoryReferral(); const reject = useRejectRegulatoryReferral();
  if (!isLoading && data.length === 0) return null;
  return <Card className="overflow-hidden"><CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4"><div><CardTitle className="text-base">Incoming referrals</CardTitle><p className="mt-1 text-sm text-muted-foreground">Accept only work within your authority’s mandate.</p></div><Badge variant="outline">{data.length}</Badge></CardHeader><CardContent className="divide-y divide-border/70 p-0">{isLoading ? <p className="p-5 text-sm text-muted-foreground">Checking referrals…</p> : data.map((referral) => <div key={referral.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2"><p className="font-medium">{referral.case.title}</p>{referral.overdue && <Badge variant="destructive">Response overdue</Badge>}</div><p className="mt-1 text-xs text-muted-foreground">{referral.case.caseNumber ?? `Case ${referral.case.id}`} · From {referral.fromAuthority.name}</p><p className="mt-2 text-sm text-muted-foreground">{referral.reason}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" disabled={reject.isPending} onClick={() => reject.mutate({ id: referral.id })}><X className="mr-1.5 size-3.5" />Decline</Button><Button size="sm" disabled={accept.isPending} onClick={() => accept.mutate({ id: referral.id })}><Check className="mr-1.5 size-3.5" />Accept</Button></div></div></div>)}</CardContent></Card>;
}
