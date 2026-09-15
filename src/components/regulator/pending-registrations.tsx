"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CheckSquare,
  Clock3,
  Download,
  Eye,
  ExternalLink,
  FileText,
  Info,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  ShieldCheck,
  X,
  XSquare,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { api, getApiErrorMessage, type OrganizationDocument, type RegistrationConsultation } from "@/lib/api";
import {
  useDecideRegistration,
  usePendingRegistrations,
  useRegistrationDocuments,
  useConsultations,
  useOpenConsultation,
  useCancelConsultation,
  useCreateInfoRequest,
  useInfoRequests,
} from "@/hooks/organizations";
import {
  useMyRegulatoryAuthority,
  useRegulatoryAuthorities,
} from "@/hooks/regulatory-authorities";
import { cn } from "@/lib/utils";
import type { CreateInfoRequestInput, InfoRequestField, PendingRegistration, RegistrationInfoRequest } from "@/lib/api";

type DecisionType = "APPROVE" | "REQUEST_CHANGES" | "REJECT";

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

function sectorLabel(sector: string | null | undefined): string {
  if (!sector) return "Not specified";
  return sector
    .replace(/_AND_/g, " & ")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

const VERDICT_CONFIG = {
  APPROVED: {
    label: "Approved",
    icon: <CheckCircle2 className="size-3.5" />,
    className: "bg-green-50 border-green-200 text-green-700",
  },
  CONCERNS: {
    label: "Concerns noted",
    icon: <AlertCircle className="size-3.5" />,
    className: "bg-amber-50 border-amber-200 text-amber-700",
  },
  OBJECTION: {
    label: "Objection",
    icon: <XSquare className="size-3.5" />,
    className: "bg-red-50 border-red-200 text-red-700",
  },
} as const;

const STATUS_CONFIG = {
  PENDING: { label: "Pending", className: "border-sky-200 text-sky-700 bg-sky-50" },
  RESPONDED: { label: "Responded", className: "border-green-200 text-green-700 bg-green-50" },
  CANCELLED: { label: "Cancelled", className: "border-slate-200 text-slate-500 bg-slate-50" },
  OVERDUE: { label: "Overdue", className: "border-red-200 text-red-700 bg-red-50" },
} as const;

/**
 * Self-registered businesses awaiting the regulator's decision. Shows both
 * PENDING and CHANGES_REQUESTED applications. Hidden when the queue is empty.
 */
export function PendingRegistrations() {
  const { data = [], isLoading } = usePendingRegistrations();
  const [selected, setSelected] = useState<PendingRegistration | null>(null);

  if (!isLoading && data.length === 0) return null;

  const pendingCount = data.filter((o) => o.onboardingStatus === "PENDING").length;
  const changesCount = data.filter((o) => o.onboardingStatus === "CHANGES_REQUESTED").length;
  const consultCount = data.filter((o) => o.onboardingStatus === "UNDER_CONSULTATION").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4">
        <div>
          <CardTitle className="text-base">Registration review</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Approve a registration to activate the business and issue its operating licence.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {pendingCount > 0 && <Badge variant="outline">{pendingCount} pending</Badge>}
          {changesCount > 0 && (
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              {changesCount} awaiting resubmission
            </Badge>
          )}
          {consultCount > 0 && (
            <Badge variant="outline" className="border-sky-300 text-sky-700">
              {consultCount} under consultation
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Checking registrations…
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>Organisation</TableHead>
                <TableHead>Type · Sector</TableHead>
                <TableHead>TIN</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          org.onboardingStatus === "CHANGES_REQUESTED"
                            ? "bg-amber-100 text-amber-700"
                            : org.onboardingStatus === "UNDER_CONSULTATION"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-600",
                        )}
                      >
                        {org.onboardingStatus === "CHANGES_REQUESTED" ? (
                          <AlertCircle className="size-3.5" />
                        ) : org.onboardingStatus === "UNDER_CONSULTATION" ? (
                          <MessageSquare className="size-3.5" />
                        ) : (
                          <Clock3 className="size-3.5" />
                        )}
                      </div>
                      <p className="text-sm font-medium">{org.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{typeLabel(org.type)}</Badge>
                    {org.industrySector && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{sectorLabel(org.industrySector)}</p>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {org.tin ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(org.createdAt)}
                  </TableCell>
                  <TableCell>
                    {org.onboardingStatus === "CHANGES_REQUESTED" && (
                      <Badge variant="outline" className="border-amber-300 text-amber-700 text-[10px]">
                        Changes requested
                      </Badge>
                    )}
                    {org.onboardingStatus === "UNDER_CONSULTATION" && (
                      <Badge variant="outline" className="border-sky-300 text-sky-700 text-[10px]">
                        Under consultation
                      </Badge>
                    )}
                    {org.onboardingStatus === "PENDING" && (
                      <Badge variant="outline" className="text-[10px]">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelected(org)}>
                      <Eye className="mr-1 size-3" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
// Send Information Request Dialog
// ---------------------------------------------------------------------------

const DEFAULT_EXPIRY_DAYS = "7";
const FIELD_TYPES = [
  { value: "text", label: "Text answer" },
  { value: "file", label: "File / document upload" },
] as const;

function SendInfoRequestDialog({
  orgId,
  orgName,
  onClose,
}: {
  orgId: number;
  orgName: string;
  onClose: () => void;
}) {
  const createRequest = useCreateInfoRequest();

  const [requestMessage, setRequestMessage] = useState("");
  const [expiryDays, setExpiryDays] = useState(DEFAULT_EXPIRY_DAYS);
  const [fields, setFields] = useState<InfoRequestField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text" | "file">("text");
  const [newFieldRequired, setNewFieldRequired] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const addField = () => {
    const label = newFieldLabel.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    setFields((prev) => [...prev, { key, label, type: newFieldType, required: newFieldRequired }]);
    setNewFieldLabel("");
    setNewFieldType("text");
    setNewFieldRequired(true);
  };

  const removeField = (key: string) => {
    setFields((prev) => prev.filter((f) => f.key !== key));
  };

  const handleSubmit = async () => {
    setError(null);
    const input: CreateInfoRequestInput = {
      requestMessage: requestMessage.trim(),
      requestedFields: fields,
      expiryDays: parseInt(expiryDays, 10) || 7,
    };
    try {
      await createRequest.mutateAsync({ orgId, input });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-bold">Request Information</h2>
            <p className="text-xs text-muted-foreground">{orgName}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
            The applicant will receive an email with a secure link to submit the requested information. The link expires after the number of days you choose below.
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Request message *</Label>
            <Textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Clearly describe what information or documents you require from the applicant. e.g. Please provide your Rwanda FDA Premise Certificate and proof of cold-chain storage."
              className="min-h-[100px] text-sm"
            />
          </div>

          {/* Dynamic fields */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">
              Specific fields (optional)
            </h4>
            <p className="text-xs text-muted-foreground">
              Add specific inputs you want on the response form. Leave blank to let the applicant reply freely in a text box.
            </p>

            {fields.length > 0 && (
              <div className="space-y-2">
                {fields.map((f) => (
                  <div key={f.key} className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                    <span className="flex-1 font-medium">{f.label}</span>
                    <span className="text-muted-foreground">{f.type === "file" ? "File" : "Text"}</span>
                    {f.required && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">Required</span>}
                    <button type="button" onClick={() => removeField(f.key)} className="text-muted-foreground hover:text-danger">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Field label, e.g. FDA Certificate"
                value={newFieldLabel}
                onChange={(e) => setNewFieldLabel(e.target.value)}
                className="text-xs h-9 col-span-2"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addField(); } }}
              />
              <Select value={newFieldType} onValueChange={(v) => setNewFieldType(v as "text" | "file")}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs" onClick={addField}>
                <Plus className="mr-1 size-3" />
                Add field
              </Button>
            </div>
          </div>

          {/* Expiry */}
          <div className="flex items-center gap-3">
            <Label className="text-xs font-semibold whitespace-nowrap">Link expires after</Label>
            <Select value={expiryDays} onValueChange={(v) => v && setExpiryDays(v)}>
              <SelectTrigger className="h-9 text-xs w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 5, 7, 14, 21, 30].map((d) => (
                  <SelectItem key={d} value={String(d)} className="text-xs">{d} days</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={createRequest.isPending}>Cancel</Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={createRequest.isPending || !requestMessage.trim()}
          >
            {createRequest.isPending ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <Mail className="mr-2 size-4" />
            )}
            Send request
          </Button>
        </div>
      </div>
    </div>
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
  const { data: documents, isLoading: docsLoading, error: docsError } = useRegistrationDocuments(org.id);
  const { data: consultations = [], isLoading: consultsLoading } = useConsultations(org.id);
  const { data: infoRequests = [] } = useInfoRequests(org.id);
  const { data: myAuthority } = useMyRegulatoryAuthority(true);

  const [decision, setDecision] = useState<DecisionType | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [openDoc, setOpenDoc] = useState<OrganizationDocument | null>(null);
  const [showSendConsultation, setShowSendConsultation] = useState(false);
  const [showInfoRequest, setShowInfoRequest] = useState(false);

  const reasonRequired = decision === "REJECT" || decision === "REQUEST_CHANGES";
  const reasonLabel =
    decision === "REJECT"
      ? "Rejection reason *"
      : "What needs to be provided or corrected? *";
  const reasonPlaceholder =
    decision === "REJECT"
      ? "What needs to be corrected before they reapply…"
      : "e.g. Please upload your Rwanda FDA Premise Certificate and resubmit.";

  const openConsultations = consultations.filter(
    (c) => c.status === "PENDING" || c.status === "OVERDUE",
  );

  const handleDecide = async () => {
    if (!decision) return;
    setError(null);
    try {
      await decide.mutateAsync({
        orgId: org.id,
        decision: { decision, reason: reason.trim() || undefined },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const address = [org.province, org.district, org.sector, org.cell, org.village]
    .filter(Boolean)
    .join(", ");

  const confirmLabel = {
    APPROVE: `Approve & activate ${org.name}`,
    REQUEST_CHANGES: "Send changes request",
    REJECT: "Reject registration",
  } as const;

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
                {typeLabel(org.type)} registration · submitted {formatDate(org.createdAt)}
                {org.onboardingStatus === "CHANGES_REQUESTED" && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                    <AlertCircle className="size-3" />
                    Changes requested
                  </span>
                )}
                {org.onboardingStatus === "UNDER_CONSULTATION" && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">
                    <MessageSquare className="size-3" />
                    Under consultation
                  </span>
                )}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">

          {/* Previous review note */}
          {org.onboardingStatus === "CHANGES_REQUESTED" && org.reviewNote && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Previously requested changes</p>
                  <p className="mt-1 text-sm text-amber-700">{org.reviewNote}</p>
                </div>
              </div>
            </section>
          )}

          {/* Business details */}
          <section>
            <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Business details
            </h3>
            <dl className="grid gap-x-6 gap-y-2.5 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
              <Detail label="TIN" value={org.tin} mono />
              <Detail label="Registration number" value={org.registrationNumber} mono />
              <Detail label="License type" value={org.licenseType ?? typeLabel(org.type)} />
              <Detail label="Incorporated" value={formatDate(org.dateIncorporated)} />
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
                  <dd className="font-medium">{org.phone ? `+250 ${org.phone}` : "—"}</dd>
                </div>
              </div>
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="text-xs text-muted-foreground">Address</dt>
                  <dd className="font-medium">{address || "—"}</dd>
                </div>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Industry sector</dt>
                <dd className="mt-0.5 font-medium">
                  {org.industrySector ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {sectorLabel(org.industrySector)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not specified</span>
                  )}
                </dd>
              </div>
              {org.description ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Description</dt>
                  <dd className="text-sm text-foreground/80">{org.description}</dd>
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
              <p className="text-sm text-muted-foreground">No owners declared.</p>
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
                        <td className="px-3 py-2 text-muted-foreground">{owner.email || "—"}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {owner.phone ? `+250 ${owner.phone}` : "—"}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{owner.percentage}%</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{owner.idNumber || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/20 font-medium">
                      <td colSpan={5} className="px-3 py-2 text-right text-muted-foreground">
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
            ) : docsError ? (
              <p className="text-sm text-danger">
                Could not load documents — {getApiErrorMessage(docsError, "check your connection and try again")}.
              </p>
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
                          {doc.certificateNumber ? ` · ${doc.certificateNumber}` : ""}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {doc.filename} ·{" "}
                          {doc.expiryDate ? `expires ${formatDate(doc.expiryDate)}` : "no expiry"}
                        </p>
                      </div>
                    </div>
                    <Eye className="ml-2 size-4 shrink-0 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── CONSULTATIONS ── */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Inter-authority consultations
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSendConsultation(true)}
                className="h-7 text-xs"
              >
                <Plus className="mr-1 size-3" />
                Send consultation
              </Button>
            </div>

            {consultsLoading ? (
              <div className="flex justify-center py-4">
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : consultations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No consultations sent yet. Use the button above to request input from another regulatory authority.
              </p>
            ) : (
              <div className="space-y-2">
                {consultations.map((c) => (
                  <ConsultationRow
                    key={c.id}
                    consultation={c}
                    orgId={org.id}
                  />
                ))}
              </div>
            )}

            {openConsultations.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-xs text-amber-700">
                  {openConsultations.length} consultation
                  {openConsultations.length !== 1 ? "s" : ""} still pending —
                  you can still decide below, but consider waiting for responses.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ── INFORMATION REQUESTS ── */}
        <section className="px-6 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Information requests
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInfoRequest(true)}
              className="h-7 text-xs gap-1"
            >
              <Info className="size-3" />
              Request information
            </Button>
          </div>

          {infoRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No information requests sent yet. Use the button above to request specific documents or clarifications from the applicant via email.
            </p>
          ) : (
            <div className="space-y-2">
              {infoRequests.map((req) => (
                <div key={req.id} className={cn(
                  "rounded-lg border p-3 text-xs",
                  req.status === "RESPONDED"
                    ? "border-emerald-200 bg-emerald-50"
                    : req.status === "EXPIRED"
                    ? "border-slate-200 bg-slate-50 opacity-60"
                    : "border-amber-200 bg-amber-50",
                )}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      req.status === "RESPONDED" ? "bg-emerald-100 text-emerald-700" :
                      req.status === "EXPIRED" ? "bg-slate-100 text-slate-500" :
                      "bg-amber-100 text-amber-700"
                    )}>
                      {req.status === "RESPONDED" ? "✓ Responded" : req.status === "EXPIRED" ? "Expired" : "Awaiting response"}
                    </span>
                    <span className="text-muted-foreground">
                      Sent {new Date(req.createdAt).toLocaleDateString()}
                      {req.respondedAt ? ` · Responded ${new Date(req.respondedAt).toLocaleDateString()}` : ""}
                    </span>
                  </div>
                  <p className="mt-1.5 text-foreground/80 line-clamp-2">{req.requestMessage}</p>
                  {req.requestedFields.length > 0 && (
                    <p className="mt-1 text-muted-foreground">
                      {req.requestedFields.length} field{req.requestedFields.length !== 1 ? "s" : ""} requested
                    </p>
                  )}
                  {req.status === "RESPONDED" && (
                    <div className="mt-2 space-y-2 rounded-md border border-emerald-200/80 bg-white/70 p-2.5">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                        Applicant reply
                      </p>
                      {req.responseData && Object.keys(req.responseData).length > 0 ? (
                        <div className="space-y-2">
                          {Object.entries(req.responseData).map(([key, value]) => (
                            <div key={key}>
                              <p className="text-[11px] font-medium text-muted-foreground">{key}</p>
                              <div
                                className="prose prose-sm mt-0.5 max-w-none text-foreground [&_p]:my-1"
                                dangerouslySetInnerHTML={{ __html: value }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No written response provided.</p>
                      )}
                      {req.responseAttachmentFilename && (
                        <p className="text-muted-foreground">
                          Attachment: <span className="font-medium text-foreground">{req.responseAttachmentFilename}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Decision panel */}
        <div className="border-t border-border p-5">
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
                  "bg-amber-500 hover:bg-amber-600 text-white border-transparent",
              )}
            >
              <MessageSquare className="mr-1.5 size-4" />
              Request changes
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
            <div className="mt-3 space-y-1.5">
              <Label htmlFor="decision-reason" className="text-xs">
                {reasonLabel}
              </Label>
              <Textarea
                id="decision-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                className="min-h-[80px] text-sm"
              />
              {decision === "REQUEST_CHANGES" && (
                <p className="text-[11px] text-muted-foreground">
                  The applicant will see this note and can upload missing documents before resubmitting.
                </p>
              )}
            </div>
          )}

          {decision && (
            <Button
              onClick={() => void handleDecide()}
              disabled={decide.isPending || (reasonRequired && !reason.trim())}
              variant={decision === "REJECT" ? "destructive" : "default"}
              className={cn(
                "mt-3 w-full",
                decision === "REQUEST_CHANGES" && "bg-amber-500 hover:bg-amber-600 border-transparent",
              )}
            >
              {decide.isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
              {decide.isPending ? "Processing…" : confirmLabel[decision]}
            </Button>
          )}

          {error && (
            <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger">
              {error}
            </div>
          )}
        </div>
      </div>

      {openDoc && <DocumentViewer document={openDoc} onClose={() => setOpenDoc(null)} />}

      {showSendConsultation && myAuthority && (
        <SendConsultationDialog
          orgId={org.id}
          orgName={org.name}
          myAuthorityId={myAuthority.id}
          documents={documents ?? []}
          onClose={() => setShowSendConsultation(false)}
        />
      )}

      {showInfoRequest && (
        <SendInfoRequestDialog
          orgId={org.id}
          orgName={org.name}
          onClose={() => setShowInfoRequest(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Consultation row
// ---------------------------------------------------------------------------

function ConsultationRow({
  consultation: c,
  orgId,
}: {
  consultation: RegistrationConsultation;
  orgId: number;
}) {
  const cancel = useCancelConsultation(orgId);

  const statusCfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.PENDING;
  const verdictCfg = c.verdict ? VERDICT_CONFIG[c.verdict] : null;

  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {c.toAuthority?.name ?? "Unknown authority"}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                statusCfg.className,
              )}
            >
              {statusCfg.label}
              {c.status === "OVERDUE" && " ⚠"}
            </span>
            {verdictCfg && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  verdictCfg.className,
                )}
              >
                {verdictCfg.icon}
                {verdictCfg.label}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{c.subject}</p>
          {c.responseNote && (
            <p className="mt-1 text-xs text-foreground/80 line-clamp-2 italic">
              "{c.responseNote}"
            </p>
          )}
          {c.dueDate && c.status === "PENDING" && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Due {formatDate(c.dueDate)}
            </p>
          )}
        </div>
        {c.status === "PENDING" && (
          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(c.id)}
            className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-danger disabled:opacity-50"
            title="Cancel consultation"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Send consultation sub-dialog
// ---------------------------------------------------------------------------

function SendConsultationDialog({
  orgId,
  orgName,
  myAuthorityId,
  documents,
  onClose,
}: {
  orgId: number;
  orgName: string;
  myAuthorityId: number;
  documents: OrganizationDocument[];
  onClose: () => void;
}) {
  const { data: allAuthorities = [] } = useRegulatoryAuthorities();
  const openConsultation = useOpenConsultation(orgId);

  const [toAuthorityId, setToAuthorityId] = useState<number | "">("");
  const [subject, setSubject] = useState("");
  const [contextNote, setContextNote] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Exclude own authority from the list
  const otherAuthorities = allAuthorities.filter((a) => a.id !== myAuthorityId);

  const toggleDoc = (id: number) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const handleSend = async () => {
    if (!toAuthorityId || !subject.trim()) return;
    setError(null);
    try {
      await openConsultation.mutateAsync({
        toAuthorityId: Number(toAuthorityId),
        subject: subject.trim(),
        contextNote: contextNote.trim() || undefined,
        forwardedDocumentIds: selectedDocIds,
        dueDate: dueDate || undefined,
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-base font-bold">Send consultation request</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ask another authority for their input on{" "}
              <span className="font-medium">{orgName}</span>'s registration.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="space-y-4 p-5">
          {/* Authority picker */}
          <div className="space-y-1.5">
            <Label htmlFor="to-authority" className="text-xs font-semibold">
              Consult authority *
            </Label>
            <select
              id="to-authority"
              value={toAuthorityId}
              onChange={(e) => setToAuthorityId(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            >
              <option value="">Select an authority…</option>
              {otherAuthorities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="consult-subject" className="text-xs font-semibold">
              Subject *
            </Label>
            <input
              id="consult-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Verify FDA Premise Certificate and food safety compliance"
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {/* Context note — rich text so regulators can structure their brief */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Context note</Label>
            <RichTextEditor
              value={contextNote}
              onChange={setContextNote}
              placeholder="Background, specific concerns, or documents to check…"
              minHeight={70}
            />
          </div>

          {/* Document selection */}
          {documents.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Forward documents (optional)
              </Label>
              <div className="space-y-1.5 rounded-lg border border-border p-3 max-h-40 overflow-y-auto">
                {documents.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-0.5 hover:bg-muted/30"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(doc.id)}
                      onChange={() => toggleDoc(doc.id)}
                      className="size-3.5 accent-primary"
                    />
                    <span className="flex items-center gap-1.5 text-xs text-foreground">
                      <FileText className="size-3 shrink-0 text-primary" />
                      {docLabel(doc.documentType)}
                      {doc.certificateNumber ? ` · ${doc.certificateNumber}` : ""}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Due date */}
          <div className="space-y-1.5">
            <Label htmlFor="consult-due" className="text-xs font-semibold">
              Response due by (optional)
            </Label>
            <input
              id="consult-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-danger">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={!toAuthorityId || !subject.trim() || openConsultation.isPending}
            onClick={() => void handleSend()}
          >
            {openConsultation.isPending ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <MessageSquare className="mr-1.5 size-4" />
            )}
            {openConsultation.isPending ? "Sending…" : "Send consultation"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Document opener
// ---------------------------------------------------------------------------
// Document opener
// ---------------------------------------------------------------------------

/**
 * Inline document viewer.
 *
 * Fetches the document blob, creates an object URL, and renders it inside an
 * <iframe> so the regulator can read it without leaving the review dialog.
 * "Open in new tab" and "Download" are available as secondary actions.
 *
 * The object URL is revoked only when the component unmounts — not before —
 * which was the root cause of the blank-tab bug in the previous implementation.
 */
function DocumentViewer({
  document: doc,
  onClose,
}: {
  document: OrganizationDocument;
  onClose: () => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .get<Blob>(`/api/organizations/documents/${doc.id}`, { responseType: "blob" })
      .then((response) => {
        if (cancelled) return;
        const url = URL.createObjectURL(response.data);
        objectUrlRef.current = url;
        setObjectUrl(url);
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Could not load the document"));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      // Revoke only on unmount, not before — otherwise the iframe goes blank.
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [doc.id]);

  const isPdf =
    doc.contentType === "application/pdf" ||
    doc.filename.toLowerCase().endsWith(".pdf");

  const isImage =
    doc.contentType.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|svg)$/i.test(doc.filename);

  function openInNewTab() {
    if (objectUrl) {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.click();
    }
  }

  function download() {
    if (objectUrl) {
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = doc.filename;
      a.click();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/70"
      onClick={onClose}
    >
      {/* ── Toolbar ── */}
      <div
        className="flex shrink-0 items-center justify-between gap-3 bg-white px-4 py-3 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {docLabel(doc.documentType)}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">{doc.filename}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {objectUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={openInNewTab}
                className="h-8 gap-1.5 text-xs"
              >
                <ExternalLink className="size-3.5" />
                New tab
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={download}
                className="h-8 gap-1.5 text-xs"
              >
                <Download className="size-3.5" />
                Download
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Viewer body ── */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="flex flex-col items-center gap-3 text-white">
            <LoaderCircle className="size-8 animate-spin opacity-70" />
            <p className="text-sm opacity-70">Loading {doc.filename}…</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-xl max-w-sm mx-4">
            <FileText className="size-10 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold text-foreground">Could not load document</p>
              <p className="mt-1 text-xs text-muted-foreground">{error}</p>
            </div>
            <Button onClick={onClose} className="w-full">Close</Button>
          </div>
        )}

        {objectUrl && !loading && (
          isPdf ? (
            <iframe
              src={objectUrl}
              className="h-full w-full border-0"
              title={doc.filename}
            />
          ) : isImage ? (
            <div className="flex h-full w-full items-center justify-center overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={objectUrl}
                alt={doc.filename}
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
              />
            </div>
          ) : (
            /* Unsupported format — download fallback */
            <div className="flex flex-col items-center gap-4 rounded-xl bg-white p-8 text-center shadow-xl max-w-sm mx-4">
              <FileText className="size-10 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-semibold text-foreground">Preview not available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  This file type cannot be previewed in the browser. Use Download to open it.
                </p>
              </div>
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
                <Button className="flex-1" onClick={download}>
                  <Download className="mr-1.5 size-3.5" />
                  Download
                </Button>
              </div>
            </div>
          )
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
      <dd className={cn("font-medium", mono && "font-mono")}>{value || "—"}</dd>
    </div>
  );
}

function docLabel(documentType: string): string {
  return documentType
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
