"use client";

import { ScrollText, ShieldCheck } from "lucide-react";
import { BusinessCaseInbox } from "@/components/compliance/business-case-inbox";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

/**
 * Compliance → Regulatory cases.
 *
 * The business half of the corrective-action loop. Regulators open cases in
 * their workspace and request corrective action; this screen is where this
 * organisation sees those requests, their full timeline, and submits the
 * evidence that closes the loop.
 */
export default function ComplianceCasesPage() {
  const { data: me } = useCurrentUser();

  if (me && !me.organization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <ShieldCheck className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Regulatory cases</h1>
            <p className="text-sm text-muted-foreground">
              Cases belong to the business they are opened against.
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8">
            <p className="text-sm text-muted-foreground">
              Cases are opened against an organisation. Sign in as a business to
              see yours.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button render={<Link href="/dashboard/compliance" />}>Back to Compliance</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <ScrollText className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Regulatory cases</h1>
            <p className="text-sm text-muted-foreground">
              What the regulator opened against this business — and what it is
              waiting on from you.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/dashboard/compliance" />}
        >
          Compliance overview
        </Button>
      </div>

      <BusinessCaseInbox />
    </div>
  );
}
