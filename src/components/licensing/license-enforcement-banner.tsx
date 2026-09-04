"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMyLicenses, permitsOperation } from "@/hooks/licensing";

export function LicenseEnforcementBanner() {
  const { data: licenses, isLoading } = useMyLicenses();

  if (isLoading) {
    return (
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
    );
  }

  const activeLicense = licenses?.find((l) => permitsOperation(l.status));
  if (activeLicense) return null;

  const hasPending = licenses?.some(
    (l) =>
      l.status === "SUBMITTED" ||
      l.status === "UNDER_REVIEW" ||
      l.status === "DRAFT",
  );

  return (
    <Card className="border-warning/30 bg-amber-50">
      <CardContent className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-foreground">
            Your account is not yet licensed
          </p>
          <p className="text-sm text-muted-foreground">
            {hasPending
              ? "You have a pending application. You&apos;ll be able to operate once it&apos;s approved."
              : "Apply for a license to start registering products and managing your supply chain."}
          </p>
        </div>
        {!hasPending && (
          <Link href="/dashboard/licenses">
            <Button>Apply for License</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
