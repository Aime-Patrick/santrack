"use client";

import { ArrowRightLeft, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAcceptRegulatoryReferral, useIncomingRegulatoryReferrals, useRejectRegulatoryReferral } from "@/hooks/regulatory-referrals";

export function IncomingReferrals() {
  const { data = [], isLoading } = useIncomingRegulatoryReferrals();
  const accept = useAcceptRegulatoryReferral();
  const reject = useRejectRegulatoryReferral();

  if (!isLoading && data.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4">
        <div>
          <CardTitle className="text-base">Incoming referrals</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Accept only work within your authority's mandate.
          </p>
        </div>
        <Badge variant="outline">{data.length}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-5 text-sm text-muted-foreground">Checking referrals…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>Case</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((referral) => (
                <TableRow key={referral.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ArrowRightLeft className="size-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{referral.case.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {referral.case.caseNumber ?? `Case ${referral.case.id}`}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {referral.fromAuthority.name}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs text-muted-foreground line-clamp-2">{referral.reason}</p>
                    {referral.overdue && (
                      <Badge variant="destructive" className="mt-1 text-[10px]">
                        Response overdue
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={reject.isPending}
                        onClick={() => reject.mutate({ id: referral.id })}
                      >
                        <X className="mr-1 size-3" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={accept.isPending}
                        onClick={() => accept.mutate({ id: referral.id })}
                      >
                        <Check className="mr-1 size-3" />
                        Accept
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
