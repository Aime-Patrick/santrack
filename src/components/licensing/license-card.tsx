"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  statusLabel,
  statusColor,
  permitsOperation,
  useLicenseDocuments,
  useLicenseHistory,
  useLicenseCategories,
} from "@/hooks/licensing";
import type { License } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, FileText } from "lucide-react";

interface LicenseCardProps {
  license: License;
  onUploadDocument?: (licenseId: number) => void;
  onSubmit?: (licenseId: number) => void;
}

export function LicenseCard({
  license,
  onUploadDocument,
  onSubmit,
}: LicenseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { data: documents } = useLicenseDocuments(license.id);
  const { data: history } = useLicenseHistory(license.id);
  const { data: categories } = useLicenseCategories();

  const isDraft = license.status === "DRAFT";
  const isSubmitted = license.status === "SUBMITTED";
  const canOperate = permitsOperation(license.status);

  const category = categories?.find((c) => c.id === license.categoryId);
  const requiredDocs = category?.requiredDocuments ?? [];
  const uploadedTypes = new Set(documents?.map((d) => d.documentType) ?? []);
  const allDocsUploaded = requiredDocs.length > 0 && requiredDocs.every((d) => uploadedTypes.has(d));

  return (
    <Card
      className={cn(
        "transition-all",
        canOperate && "border-success/30",
        license.status === "SUSPENDED" && "border-danger/30",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">
              {license.categoryName}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {license.licenseNumber}
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
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Key dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {license.issuedOn && (
            <div>
              <p className="text-muted-foreground">Issued</p>
              <p className="font-medium">{license.issuedOn}</p>
            </div>
          )}
          {license.expiresOn && (
            <div>
              <p className="text-muted-foreground">Expires</p>
              <p className="font-medium">{license.expiresOn}</p>
            </div>
          )}
          {license.reviewedByName && (
            <div>
              <p className="text-muted-foreground">Reviewed by</p>
              <p className="font-medium">{license.reviewedByName}</p>
            </div>
          )}
          {license.issuedByName && (
            <div>
              <p className="text-muted-foreground">Issued by</p>
              <p className="font-medium">{license.issuedByName}</p>
            </div>
          )}
        </div>

        {/* Rejection/suspension reason */}
        {license.statusReason && (
          <div className="rounded-md bg-danger/5 p-3 text-sm text-danger">
            {license.statusReason}
          </div>
        )}

        {/* Required documents progress for draft licences */}
        {isDraft && requiredDocs.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Required Documents ({uploadedTypes.size}/{requiredDocs.length})
            </p>
            <div className="space-y-1.5">
              {requiredDocs.map((docType) => {
                const uploaded = uploadedTypes.has(docType);
                return (
                  <div
                    key={docType}
                    className={cn(
                      "flex items-center gap-2 rounded px-3 py-1.5 text-sm",
                      uploaded ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {uploaded ? (
                      <CheckCircle2 className="size-4 shrink-0" />
                    ) : (
                      <Circle className="size-4 shrink-0" />
                    )}
                    <span className="truncate">{docType.replace(/_/g, " ").toLowerCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Uploaded documents list */}
        {documents && documents.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
              Uploaded
            </p>
            <div className="space-y-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded bg-muted px-3 py-1.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="truncate">{doc.filename}</span>
                  </div>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {doc.documentType.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions for draft licenses */}
        {isDraft && (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUploadDocument?.(license.id)}
            >
              Upload Document
            </Button>
            <Button
              size="sm"
              onClick={() => onSubmit?.(license.id)}
              disabled={requiredDocs.length > 0 && !allDocsUploaded}
            >
              {requiredDocs.length > 0 && !allDocsUploaded
                ? `Submit (${requiredDocs.length - uploadedTypes.size} docs missing)`
                : "Submit for Review"}
            </Button>
          </div>
        )}

        {/* History toggle */}
        {history && history.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs font-medium text-primary hover:underline"
            >
              {expanded ? "Hide" : "Show"} history ({history.length} events)
            </button>
            {expanded && (
              <div className="mt-2 space-y-1">
                {history.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <span className="font-medium text-foreground">
                      {event.type}
                    </span>
                    {event.fromStatus && event.toStatus && (
                      <span>
                        {statusLabel(event.fromStatus)} →{" "}
                        {statusLabel(event.toStatus)}
                      </span>
                    )}
                    {event.actor && <span>by {event.actor}</span>}
                    {event.notes && (
                      <span className="italic">— {event.notes}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
