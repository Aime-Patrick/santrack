"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useRegulatorQueue,
  useReviewLicense,
  useDecideOnLicense,
  useSuspendLicense,
  useRevokeLicense,
  useReinstateLicense,
  useLicenseDocuments,
  statusLabel,
  statusColor,
} from "@/hooks/licensing";
import { getApiErrorMessage } from "@/lib/api";
import type { License } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LoaderCircle } from "lucide-react";

function ReviewDialog({
  license,
  onClose,
}: {
  license: License;
  onClose: () => void;
}) {
  const reviewMutation = useReviewLicense();
  const decideMutation = useDecideOnLicense();
  const { data: documents } = useLicenseDocuments(license.id);
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStartReview = async () => {
    setError(null);
    try {
      await reviewMutation.mutateAsync(license.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDecide = async () => {
    if (!decision) return;
    setError(null);
    try {
      await decideMutation.mutateAsync({
        licenseId: license.id,
        decision: { decision, reason: reason || undefined },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const isUnderReview = license.status === "UNDER_REVIEW";

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{license.categoryName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {license.licenseNumber} • {license.organizationName}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Documents */}
        {documents && documents.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Documents ({documents.length})
            </p>
            <div className="space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded bg-muted px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{doc.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.documentType}
                    </p>
                  </div>
                  <a
                    href={`/api/licenses/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {license.statusReason && (
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <span className="font-medium">Applicant notes:</span>{" "}
            {license.statusReason}
          </div>
        )}

        {/* Actions */}
        {!isUnderReview ? (
          <Button
            onClick={handleStartReview}
            disabled={reviewMutation.isPending}
          >
            {reviewMutation.isPending ? "Starting..." : "Start Review"}
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={decision === "APPROVE" ? "default" : "outline"}
                onClick={() => setDecision("APPROVE")}
              >
                Approve
              </Button>
              <Button
                variant={decision === "REJECT" ? "destructive" : "outline"}
                onClick={() => setDecision("REJECT")}
              >
                Reject
              </Button>
            </div>

            {decision === "REJECT" && (
              <div className="space-y-2">
                <Label htmlFor="reject-reason">Rejection Reason *</Label>
                <Textarea
                  id="reject-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain what needs to be corrected..."
                />
              </div>
            )}

            {decision && (
              <Button
                onClick={handleDecide}
                disabled={
                  decideMutation.isPending ||
                  (decision === "REJECT" && !reason.trim())
                }
                variant={decision === "REJECT" ? "destructive" : "default"}
              >
                {decideMutation.isPending
                  ? "Processing..."
                  : decision === "APPROVE"
                    ? "Approve License"
                    : "Reject Application"}
              </Button>
            )}
          </div>
        )}

        {error && (
          <div className="rounded-md bg-danger/5 p-3 text-sm text-danger">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RegulatorPage() {
  const { data: queue, isLoading } = useRegulatorQueue();
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          License Review Queue
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and decide on pending license applications
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : queue && queue.length > 0 ? (
        <div className="space-y-4">
          {queue.map((license) => (
            <Card
              key={license.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                selectedLicense?.id === license.id &&
                  "border-primary ring-1 ring-primary",
              )}
              onClick={() => setSelectedLicense(license)}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-foreground">
                    {license.organizationName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {license.categoryName} • {license.licenseNumber}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    statusColor(license.status),
                  )}
                >
                  {statusLabel(license.status)}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Queue Empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No license applications are currently awaiting review. Applications
              will appear here when businesses submit them for screening.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedLicense && (
        <ReviewDialog
          key={selectedLicense.id}
          license={selectedLicense}
          onClose={() => setSelectedLicense(null)}
        />
      )}
    </div>
  );
}
