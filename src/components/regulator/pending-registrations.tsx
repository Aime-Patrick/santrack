"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, getApiErrorMessage, type OrganizationDocument } from "@/lib/api";
import {
  useDecideRegistration,
  usePendingRegistrations,
  useRegistrationDocuments,
} from "@/hooks/organizations";
import { cn } from "@/lib/utils";
import type { PendingRegistration } from "@/lib/api";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function typeLabel(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Self-registered businesses awaiting the regulator's decision (Digital Tax
 * Stamp flow: submit application -> government review -> approval issues the
 * operating licence). Hidden entirely when the queue is empty so the review
 * workspace only surfaces work that actually needs an officer.
 */
export function PendingRegistrations() {
  const { data = [], isLoading } = usePendingRegistrations();
  const [selected, setSelected] = useState<PendingRegistration | null>(null);

  if (!isLoading && data.length === 0) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4">
        <div>
          <CardTitle className="text-base">Registration review</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve a registration to activate the business and issue its
            operating licence.
          </p>
        </div>
        <Badge variant="outline">{data.length}</Badge>
      </CardHeader>
      <CardContent className="divide-y divide-border/70 p-0">
        {isLoading ? (
          <p className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Checking registrations…
          </p>
        ) : (
          data.map((org) => (
            <div
              key={org.id}
              className="flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Clock3 className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{org.name}</p>
                    <Badge variant="secondary">{typeLabel(org.type)}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {org.tin ? `TIN ${org.tin}` : "No TIN"} · submitted{" "}
                    {formatDate(org.createdAt)} ·{" "}
                    {org.ownership?.length ?? 0} owner
                    {(org.ownership?.length ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelected(org)}
              >
                <Eye className="mr-1.5 size-3.5" />
                Review
              </Button>
            </div>
          ))
        )}
      </CardContent>

      {selected && (
        <RegistrationReviewDialog
          key={selected.id}
          organization={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Review dialog
// ---------------------------------------------------------------------------

function RegistrationReviewDialog({
  organization: org,
  onClose,
}: {
  organization: PendingRegistration;
  onClose: () => void;
}) {
  const decide = useDecideRegistration();
  const { data: documents, isLoading: docsLoading } = useRegistrationDocuments(
    org.id,
  );
  const [decision, setDecision] = useState<"APPROVE" | "REJECT" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openDoc, setOpenDoc] = useState<OrganizationDocument | null>(null);

  const handleDecide = async () => {
    if (!decision) return;
    setError(null);
    try {
      await decide.mutateAsync({
        orgId: org.id,
        decision: { decision, reason: reason || undefined },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const address = [org.province, org.district, org.sector, org.cell, org.village]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Building2 className="size-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{org.name}</h2>
              <p className="text-sm text-muted-foreground">
                {typeLabel(org.type)} registration · submitted{" "}
                {formatDate(org.createdAt)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
          {/* Business details */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Business details
            </h3>
            <dl className="grid gap-x-6 gap-y-2.5 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
              <Detail label="TIN" value={org.tin} mono />
              <Detail
                label="Registration number"
                value={org.registrationNumber}
                mono
              />
              <Detail
                label="License type"
                value={org.licenseType ?? typeLabel(org.type)}
              />
              <Detail
                label="Incorporated"
                value={formatDate(org.dateIncorporated)}
              />
              <div className="flex items-start gap-2">
                <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="font-medium">{org.email || "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="font-medium">
                    {org.phone ? `+250 ${org.phone}` : "—"}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd className="font-medium">{address || "—"}</dd>
                </div>
              </div>
              {org.description ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">
                    Description
                  </dt>
                  <dd className="text-sm text-foreground/80">
                    {org.description}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>

          {/* Ownership */}
          <section>
            <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <ShieldCheck className="size-3.5" />
              Ownership
            </h3>
            {!org.ownership || org.ownership.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No owners declared.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Phone</th>
                      <th className="px-3 py-2 text-right">%</th>
                      <th className="px-3 py-2 text-left">ID / Passport</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {org.ownership.map((owner) => (
                      <tr key={owner.id}>
                        <td className="px-3 py-2 font-medium">{owner.name}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {owner.email || "—"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {owner.phone ? `+250 ${owner.phone}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {owner.percentage}%
                        </td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">
                          {owner.idNumber || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/20 font-medium">
                      <td
                        colSpan={5}
                        className="px-3 py-2 text-right text-muted-foreground"
                      >
                        Total:{" "}
                        <span className="font-mono text-foreground">
                          {org.ownership.reduce((s, o) => s + o.percentage, 0)}%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </section>

          {/* Documents */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Supporting documents
            </h3>
            {docsLoading ? (
              <div className="flex justify-center py-6">
                <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : !documents || documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents uploaded with this application.
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setOpenDoc(doc)}
                    className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FileText className="size-4 shrink-0 text-primary" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {docLabel(doc.documentType)}
                          {doc.certificateNumber
                            ? ` · ${doc.certificateNumber}`
                            : ""}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {doc.filename} ·{" "}
                          {doc.expiryDate
                            ? `expires ${formatDate(doc.expiryDate)}`
                            : "no expiry"}
                        </p>
                      </div>
                    </div>
                    <Eye className="ml-2 size-4 shrink-0 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Decision */}
        <div className="border-t border-border p-5">
          <div className="flex gap-2">
            <Button
              variant={decision === "APPROVE" ? "default" : "outline"}
              onClick={() => setDecision("APPROVE")}
              className={cn(
                "flex-1",
                decision === "APPROVE" && "bg-success hover:bg-success/90",
              )}
            >
              <CheckCircle2 className="mr-1.5 size-4" />
              Approve
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

          {decision === "REJECT" && (
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="reject-reason" className="text-xs">
                Rejection reason *
              </Label>
              <Textarea
                id="reject-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What needs to be corrected before they reapply..."
                className="min-h-[70px] text-sm"
              />
            </div>
          )}

          {decision && (
            <Button
              onClick={() => void handleDecide()}
              disabled={
                decide.isPending ||
                (decision === "REJECT" && !reason.trim())
              }
              variant={decision === "REJECT" ? "destructive" : "default"}
              className="mt-3 w-full"
            >
              {decide.isPending ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : null}
              {decide.isPending
                ? "Processing…"
                : decision === "APPROVE"
                  ? `Approve & activate ${org.name}`
                  : "Reject registration"}
            </Button>
          )}

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger">
              {error}
            </div>
          )}
        </div>
      </div>

      {openDoc && (
        <DocumentOpener
          document={openDoc}
          onClose={() => setOpenDoc(null)}
        />
      )}
    </div>
  );
}

/** Fetches a filed certificate with the auth header and opens it. */
function DocumentOpener({
  document: doc,
  onClose,
}: {
  document: OrganizationDocument;
  onClose: () => void;
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    api
      .get<Blob>(`/api/organizations/documents/${doc.id}`, {
        responseType: "blob",
      })
      .then((response) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        window.open(objectUrl, "_blank", "noopener,noreferrer");
        onClose();
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not open the document"));
        }
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id, onClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
        {error ? (
          <>
            <p className="text-sm font-medium text-danger">{error}</p>
            <Button className="mt-4 w-full" onClick={onClose}>
              Close
            </Button>
          </>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Opening {doc.filename}…
          </p>
        )}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-medium", mono && "font-mono")}>
        {value || "—"}
      </dd>
    </div>
  );
}

/** RDB_CERTIFICATE -> RDB certificate */
function docLabel(documentType: string): string {
  return documentType.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) =>
    c.toUpperCase(),
  );
}
