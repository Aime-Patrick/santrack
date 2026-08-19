"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMyLicenses } from "@/hooks/licensing";
import { LicenseCard } from "@/components/licensing/license-card";
import { ApplyLicenseForm } from "@/components/licensing/apply-license-form";
import { LoaderCircle } from "lucide-react";

export default function LicensesPage() {
  const { data: licenses, isLoading } = useMyLicenses();
  const [showApplyForm, setShowApplyForm] = useState(false);

  const activeLicenses = licenses?.filter((l) => l.status === "ACTIVE") ?? [];
  const draftLicenses = licenses?.filter((l) => l.status === "DRAFT") ?? [];
  const pendingLicenses =
    licenses?.filter(
      (l) =>
        l.status === "SUBMITTED" ||
        l.status === "UNDER_REVIEW" ||
        l.status === "REJECTED",
    ) ?? [];

  if (showApplyForm) {
    return (
      <ApplyLicenseForm
        onSuccess={() => setShowApplyForm(false)}
        onCancel={() => setShowApplyForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Licenses</h1>
          <p className="text-sm text-muted-foreground">
            Manage your business licenses and applications
          </p>
        </div>
        <Button onClick={() => setShowApplyForm(true)}>Apply for License</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : licenses && licenses.length > 0 ? (
        <>
          {activeLicenses.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase text-muted-foreground">
                Active ({activeLicenses.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activeLicenses.map((license) => (
                  <LicenseCard key={license.id} license={license} />
                ))}
              </div>
            </section>
          )}

          {pendingLicenses.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase text-muted-foreground">
                Pending ({pendingLicenses.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pendingLicenses.map((license) => (
                  <LicenseCard key={license.id} license={license} />
                ))}
              </div>
            </section>
          )}

          {draftLicenses.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium uppercase text-muted-foreground">
                Drafts ({draftLicenses.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {draftLicenses.map((license) => (
                  <LicenseCard key={license.id} license={license} />
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Licenses Yet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You need an active license to operate on the SANTRACK platform.
              Apply for a license to start registering products and managing
              your supply chain.
            </p>
            <Button className="mt-4" onClick={() => setShowApplyForm(true)}>
              Apply for Your First License
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
