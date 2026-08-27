"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useRecall, useLiftRecall } from "@/hooks/recall";
import { useCapabilities } from "@/hooks/permissions";
import { cn } from "@/lib/utils";

export default function RecallDetailPage() {
  const params = useParams<{ batchId: string }>();
  const router = useRouter();
  const batchId = Number(params.batchId);
  const { data: recall, isLoading, isError, error } = useRecall(batchId);
  const lift = useLiftRecall();
  const permissions = useCapabilities();
  const canManageRecall = permissions.can("MANAGE_RECALL");

  if (!Number.isFinite(batchId) || batchId <= 0) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Invalid recall link.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-muted-foreground">Loading recall…</p>
      </div>
    );
  }

  if (isError || !recall) {
    return (
      <div className="space-y-4">
        <BackLink />
        <Card>
          <CardHeader>
            <CardTitle>Recall not found</CardTitle>
            <CardDescription>
              {(error as { response?: { data?: { message?: string } } })?.response
                ?.data?.message ??
                "This lot is not under recall, or you cannot see it."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const holders = recall.impactedLocations ?? [];
  const productName = recall.productName?.trim() || "Unknown product";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <BackLink />
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-danger text-white">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{productName}</h1>
              <p className="font-mono text-sm text-muted-foreground">
                Lot {recall.batchNumber}
                {recall.productSku ? ` · SKU ${recall.productSku}` : ""}
              </p>
              <Badge variant="destructive" className="mt-2">
                RECALLED
              </Badge>
            </div>
          </div>
        </div>
        {canManageRecall ? (
          <Button
            variant="outline"
            disabled={lift.isPending || permissions.loading}
            onClick={() =>
              lift.mutate(
                {
                  batchId: recall.batchId,
                  reason: "Recall lifted from detail page",
                },
                { onSuccess: () => router.push("/dashboard/recall") },
              )
            }
          >
            {lift.isPending ? "Lifting…" : "Lift recall"}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recall record</CardTitle>
            <CardDescription>Why this lot was pulled</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Manufacturer</dt>
                <dd className="font-medium">
                  {recall.manufacturerName ?? recall.initiatedBy}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Recall date</dt>
                <dd className="font-medium">
                  {new Date(recall.recallDate).toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reason</dt>
                <dd className="mt-1 whitespace-pre-wrap font-medium">
                  {recall.reason}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Units affected</dt>
                <dd className="font-medium">{recall.affectedUnits}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Identities</dt>
                <dd className="font-medium">
                  {recall.affectedIdentities ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Destroyed</dt>
                <dd className="font-medium">{recall.destroyedUnits ?? 0} units</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Where the stock is</CardTitle>
            <CardDescription>
              Holders and statuses for units from this lot — work the recall from
              this list
            </CardDescription>
          </CardHeader>
          <CardContent>
            {holders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No holders recorded for this lot.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Holder</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium text-right">Units</th>
                      <th className="px-3 py-2 font-medium text-right">
                        Identities
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {holders.map((h) => (
                      <tr key={`${h.locationId}-${h.locationName}-${h.eventType}`}>
                        <td className="px-3 py-2.5 font-medium">
                          {h.locationName}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline">{h.eventType}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {h.qty}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                          {h.identities ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/recall"
      className={cn(
        buttonVariants({ variant: "ghost", size: "sm" }),
        "-ml-2 h-8",
      )}
    >
      <ArrowLeft className="mr-1.5 size-4" />
      All recalls
    </Link>
  );
}
