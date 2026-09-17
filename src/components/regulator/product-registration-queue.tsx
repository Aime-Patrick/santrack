"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Eye, LoaderCircle, Package, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  productStatusColor,
  productStatusLabel,
  useDecideProductRegistration,
  useProductRegistrationQueue,
  useStartProductReview,
} from "@/hooks/product-registration";
import { getApiErrorMessage, type ProductRegistration } from "@/lib/api";
import { cn } from "@/lib/utils";

type DecisionType = "APPROVE" | "REQUEST_CHANGES" | "REJECT";

export function ProductRegistrationQueue() {
  const { data: queue = [], isLoading } = useProductRegistrationQueue();
  const [selected, setSelected] = useState<ProductRegistration | null>(null);

  const columns: ColumnDef<TableFeatures, ProductRegistration>[] = [
    {
      accessorKey: "productName",
      header: "Product",
      cell: ({ row }) => (
        <div>
          <p className="text-sm font-medium">{row.original.productName}</p>
          {row.original.brandName && (
            <p className="text-xs text-muted-foreground">{row.original.brandName}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "registrationNumber",
      header: "Reg. no.",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("registrationNumber")}</span>
      ),
    },
    {
      id: "applicant",
      header: "Applicant",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.organizationName ?? row.original.organization?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={productStatusColor(row.original.status)}>
          {productStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setSelected(row.original)}
        >
          <Eye className="size-3" />
          <span className="ml-1">Review</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Package className="size-4 text-primary" />
        <h2 className="text-base font-semibold">Product registrations</h2>
        <Badge variant="outline" className="ml-auto">
          {queue.length} pending
        </Badge>
      </div>
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : queue.length > 0 ? (
            <DataTable
              columns={columns}
              data={queue}
              filterPlaceholder="Search by product…"
              filterColumn="productName"
              pageSize={10}
              noBorder
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Package className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Queue empty</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No product registrations are currently awaiting review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <ProductReviewDialog registration={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function ProductReviewDialog({
  registration,
  onClose,
}: {
  registration: ProductRegistration;
  onClose: () => void;
}) {
  const startReview = useStartProductReview();
  const decide = useDecideProductRegistration();
  const [decision, setDecision] = useState<DecisionType | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isUnderReview = registration.status === "UNDER_REVIEW";
  const reasonRequired = decision === "REJECT" || decision === "REQUEST_CHANGES";

  const handleStart = async () => {
    setError(null);
    try {
      await startReview.mutateAsync(registration.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDecide = async () => {
    if (!decision) return;
    if (reasonRequired && !reason.trim()) return;
    setError(null);
    try {
      await decide.mutateAsync({
        id: registration.id,
        decision: { decision, reason: reason.trim() || undefined },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-foreground">{registration.productName}</h2>
            <p className="text-sm text-muted-foreground">
              {registration.registrationNumber}
              {(registration.organizationName ?? registration.organization?.name)
                ? ` · ${registration.organizationName ?? registration.organization?.name}`
                : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          {registration.statusReason && (
            <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              <span className="font-medium">Notes:</span> {registration.statusReason}
            </div>
          )}

          {!isUnderReview ? (
            <Button onClick={handleStart} disabled={startReview.isPending} className="w-full">
              {startReview.isPending ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : null}
              Start review
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant={decision === "APPROVE" ? "default" : "outline"}
                  onClick={() => setDecision("APPROVE")}
                  className={cn("flex-1", decision === "APPROVE" && "bg-success hover:bg-success/90")}
                >
                  <CheckCircle2 className="mr-1.5 size-4" />
                  Approve
                </Button>
                <Button
                  variant={decision === "REQUEST_CHANGES" ? "default" : "outline"}
                  onClick={() => setDecision("REQUEST_CHANGES")}
                  className={cn(
                    "flex-1",
                    decision === "REQUEST_CHANGES" &&
                      "border-transparent bg-warning text-white hover:bg-warning/90",
                  )}
                >
                  Changes
                </Button>
                <Button
                  variant={decision === "REJECT" ? "destructive" : "outline"}
                  onClick={() => setDecision("REJECT")}
                  className="flex-1"
                >
                  <X className="mr-1.5 size-4" />
                  Reject
                </Button>
              </div>

              {reasonRequired && (
                <div className="space-y-1.5">
                  <Label htmlFor="product-decision-reason" className="text-xs">
                    {decision === "REQUEST_CHANGES"
                      ? "What should the applicant change? *"
                      : "Rejection reason *"}
                  </Label>
                  <Textarea
                    id="product-decision-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="What needs to be corrected..."
                    className="min-h-[80px] text-sm"
                  />
                </div>
              )}

              {decision && (
                <Button
                  onClick={handleDecide}
                  disabled={decide.isPending || (reasonRequired && !reason.trim())}
                  variant={decision === "REJECT" ? "destructive" : "default"}
                  className={cn(
                    "w-full",
                    decision === "REQUEST_CHANGES" && "bg-warning text-white hover:bg-warning/90",
                  )}
                >
                  {decide.isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
                  {decision === "APPROVE"
                    ? "Approve product"
                    : decision === "REQUEST_CHANGES"
                      ? "Send changes request"
                      : "Reject application"}
                </Button>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-danger">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
