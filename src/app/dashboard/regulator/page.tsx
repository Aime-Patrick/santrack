"use client";

import { useState, useEffect, useRef } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  useRegulatorQueue,
  useReviewLicense,
  useDecideOnLicense,
  useRegulatorDocuments,
  useLicenseHistory,
  statusLabel,
  statusColor,
} from "@/hooks/licensing";
import { usePendingRegistrations, useIncomingConsultations } from "@/hooks/organizations";
import { api, getApiErrorMessage, type License, type LicenseDocument } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CaseWorkQueue } from "@/components/regulator/case-work-queue";
import { PendingRegistrations } from "@/components/regulator/pending-registrations";
import { IncomingConsultations } from "@/components/regulator/incoming-consultations";
import { ComplaintTriage } from "@/components/regulator/complaint-triage";
import { SignalWatch } from "@/components/regulator/signal-watch";
import { FieldInspectionMode } from "@/components/regulator/field-inspection-mode";
import { useRegulatoryCommand } from "@/hooks/regulatory-command";
import { IncomingReferrals } from "@/components/regulator/incoming-referrals";
import { AuthoritySelfSetup } from "@/components/regulator/authority-self-setup";
import { RegulatorFollowUpPanel } from "@/components/licensing/regulator-followup-panel";
import { ManageCategoriesDialog } from "@/components/licensing/manage-categories-dialog";
import { ProductRegistrationQueue } from "@/components/regulator/product-registration-queue";
import {
  FileText,
  ExternalLink,
  LoaderCircle,
  X,
  CheckCircle2,
  Circle,
  Shield,
  Building2,
  Calendar,
  History,
  Eye,
  ClipboardList,
  Gavel,
  Radar,
  ScanLine,
  Settings2,
  Layers,
  Download,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** CERTIFICATE_OF_INCORPORATION -> Certificate of incorporation. */
function docLabel(documentType: string): string {
  const words = documentType.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Whether a document is a viewable image or PDF. */
function isViewable(doc: LicenseDocument): boolean {
  return (
    doc.contentType === "application/pdf" ||
    doc.contentType.startsWith("image/")
  );
}

// ---------------------------------------------------------------------------
// Document viewer — inline preview instead of download
// ---------------------------------------------------------------------------

function DocumentViewer({ document: doc }: { document: LicenseDocument }) {
  const [open, setOpen] = useState(false);

  if (!isViewable(doc)) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{docLabel(doc.documentType)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {doc.filename} · {formatBytes(doc.sizeBytes)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/30"
      >
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{docLabel(doc.documentType)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {doc.filename} · {formatBytes(doc.sizeBytes)}
            </p>
          </div>
        </div>
        <Eye className="size-4 shrink-0 text-primary" />
      </button>

      {open && (
        <DocumentPreviewModal document={doc} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function DocumentPreviewModal({
  document: doc,
  onClose,
}: {
  document: LicenseDocument;
  onClose: () => void;
}) {
  const isPdf = doc.contentType === "application/pdf";
  const isImage = doc.contentType.startsWith("image/");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch the document through the authenticated API client so auth headers are sent
  useEffect(() => {
    let objectUrl: string | null = null;
    setLoading(true);
    setFetchError(null);

    api
      .get(`/licenses/documents/${doc.id}`, { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(
          new Blob([res.data], { type: doc.contentType })
        );
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        console.error("Document fetch error:", err);
        setFetchError("Could not load document.");
      })
      .finally(() => setLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [doc.id, doc.contentType]);

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = doc.filename;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{doc.filename}</p>
            <p className="text-xs text-muted-foreground">{docLabel(doc.documentType)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={!blobUrl}
              onClick={handleDownload}
            >
              <Download className="size-3.5" />
              Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div
          className="flex flex-1 items-center justify-center overflow-hidden bg-muted/20"
          style={{ minHeight: 0 }}
        >
          {loading && (
            <div className="flex flex-col items-center gap-3 py-16 text-sm text-muted-foreground">
              <LoaderCircle className="size-6 animate-spin" />
              Loading document…
            </div>
          )}

          {!loading && fetchError && (
            <div className="py-16 text-center text-sm text-destructive">
              {fetchError}
            </div>
          )}

          {!loading && blobUrl && isPdf && (
            <iframe
              src={blobUrl}
              title={doc.filename}
              className="h-[calc(92vh-57px)] w-full border-0"
            />
          )}

          {!loading && blobUrl && isImage && (
            <div className="overflow-auto p-4">
              <img
                src={blobUrl}
                alt={doc.filename}
                className="max-h-[calc(92vh-100px)] max-w-full object-contain shadow"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review dialog — enriched with applicant details, documents, history
// ---------------------------------------------------------------------------

function ReviewDialog({
  license: lic,
  onClose,
}: {
  license: License;
  onClose: () => void;
}) {
  const reviewMutation = useReviewLicense();
  const decideMutation = useDecideOnLicense();
  const { data: documents, isLoading: docsLoading } = useRegulatorDocuments(lic.id);
  const { data: history, isLoading: historyLoading } = useLicenseHistory(lic.id);
  const [decision, setDecision] = useState<"APPROVE" | "REQUEST_CHANGES" | "REJECT" | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStartReview = async () => {
    setError(null);
    try {
      await reviewMutation.mutateAsync(lic.id);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDecide = async () => {
    if (!decision) return;
    setError(null);
    try {
      await decideMutation.mutateAsync({
        licenseId: lic.id,
        decision: { decision, reason: reason || undefined },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const isUnderReview = lic.status === "UNDER_REVIEW";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">{lic.categoryName}</h2>
            <p className="text-sm text-muted-foreground">
              {lic.licenseNumber} · {lic.organizationName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColor(lic.status)}>
              {statusLabel(lic.status)}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Body — split layout */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left: applicant details + history */}
          <div className="flex w-1/2 flex-col overflow-y-auto border-r border-border">
            {/* Applicant info */}
            <div className="space-y-3 border-b border-border p-5">
              <h3 className="text-xs font-medium uppercase text-muted-foreground">
                Applicant
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="size-4 text-muted-foreground" />
                  <span className="font-medium">{lic.organizationName}</span>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Licence</dt>
                    <dd className="font-mono text-foreground">{lic.licenseNumber}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Category</dt>
                    <dd className="text-foreground">{lic.categoryName}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Activity</dt>
                    <dd className="text-foreground">{lic.activity}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Provisional</dt>
                    <dd className="text-foreground">{lic.provisional ? "Yes" : "No"}</dd>
                  </div>
                </dl>
              </div>

              {lic.statusReason && (
                <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
                  <span className="font-medium">Applicant notes:</span>{" "}
                  {lic.statusReason}
                </div>
              )}
            </div>

            {/* Audit trail */}
            <div className="flex-1 p-5">
              <h3 className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
                <History className="size-3" />
                Audit trail
              </h3>
              {historyLoading ? (
                <div className="flex justify-center py-4">
                  <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                </div>
              ) : !history || history.length === 0 ? (
                <p className="text-xs text-muted-foreground">No events recorded.</p>
              ) : (
                <ol className="space-y-2 border-l border-border pl-4">
                  {history.map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
                      <p className="text-sm text-foreground">
                        {docLabel(event.type)}
                        {event.toStatus && (
                          <span className="text-muted-foreground">
                            {" — "}
                            {statusLabel(event.toStatus)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.recordedAt).toLocaleString()}
                        {event.actor ? ` · ${event.actor}` : ""}
                      </p>
                      {event.notes && (
                        <p className="text-xs text-faint">{event.notes}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Right: documents + decision */}
          <div className="flex w-1/2 flex-col overflow-y-auto">
            {/* Documents */}
            <div className="flex-1 p-5">
              <h3 className="mb-3 text-xs font-medium uppercase text-muted-foreground">
                Supporting Documents
              </h3>
              {docsLoading ? (
                <div className="flex justify-center py-8">
                  <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                </div>
              ) : !documents || documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center">
                  <FileText className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No documents filed
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <DocumentViewer key={doc.id} document={doc} />
                  ))}
                </div>
              )}

              {/* Conditions & Follow-up Items */}
              <div className="mt-6 border-t border-border pt-4">
                <RegulatorFollowUpPanel
                  licenseId={lic.id}
                  licenseNumber={lic.licenseNumber}
                />
              </div>
            </div>

            {/* Decision area */}
            <div className="border-t border-border p-5">
              {!isUnderReview ? (
                <Button
                  onClick={handleStartReview}
                  disabled={reviewMutation.isPending}
                  className="w-full"
                >
                  {reviewMutation.isPending ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Shield className="mr-2 size-4" />
                  )}
                  {reviewMutation.isPending ? "Starting Review..." : "Start Review"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Decision
                  </p>
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
                      variant={decision === "REQUEST_CHANGES" ? "default" : "outline"}
                      onClick={() => setDecision("REQUEST_CHANGES")}
                      className={cn(
                        "flex-1",
                        decision === "REQUEST_CHANGES" &&
                          "bg-warning text-white hover:bg-warning/90 border-transparent",
                      )}
                    >
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

                  {(decision === "REJECT" || decision === "REQUEST_CHANGES") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="reject-reason" className="text-xs">
                        {decision === "REQUEST_CHANGES"
                          ? "What should the applicant change? *"
                          : "Rejection reason *"}
                      </Label>
                      <Textarea
                        id="reject-reason"
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
                      disabled={
                        decideMutation.isPending ||
                        ((decision === "REJECT" || decision === "REQUEST_CHANGES") &&
                          !reason.trim())
                      }
                      variant={decision === "REJECT" ? "destructive" : "default"}
                      className={cn(
                        "w-full",
                        decision === "REQUEST_CHANGES" &&
                          "bg-warning text-white hover:bg-warning/90",
                      )}
                    >
                      {decideMutation.isPending ? (
                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                      ) : null}
                      {decideMutation.isPending
                        ? "Processing..."
                        : decision === "APPROVE"
                          ? "Approve Licence"
                          : decision === "REQUEST_CHANGES"
                            ? "Send changes request"
                            : "Reject Application"}
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-danger">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Queue table columns
// ---------------------------------------------------------------------------

function QueueActions({
  license,
  onSelect,
}: {
  license: License;
  onSelect: (lic: License) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs"
      onClick={() => onSelect(license)}
    >
      <Eye className="size-3" />
      <span className="ml-1">Review</span>
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type Tab = "scan" | "registrations" | "licences" | "enforcement" | "intelligence" | "setup";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "scan",          label: "Scan",            icon: ScanLine      },
  { id: "registrations", label: "Registrations",   icon: ClipboardList },
  { id: "licences",      label: "Licences",        icon: Gavel         },
  { id: "enforcement",   label: "Enforcement",     icon: Shield        },
  { id: "intelligence",  label: "Intelligence",    icon: Radar         },
  { id: "setup",         label: "Setup",           icon: Settings2     },
];

// ---------------------------------------------------------------------------
// Inline command strip — 2-row × 3-col value+label cards
// ---------------------------------------------------------------------------

const STRIP_CARDS = [
  { key: "activeCases",           label: "Active cases",   valueClass: "text-primary"  },
  { key: "overdueCases",          label: "Overdue",        valueClass: "text-destructive" },
  { key: "unassignedCases",       label: "Need owner",     valueClass: "text-warning"  },
  { key: "activeRecalls",         label: "Active recalls", valueClass: "text-destructive" },
  { key: "marketReportsToTriage", label: "Market triage",  valueClass: "text-warning"  },
  { key: "inspectionsToday",      label: "Inspections",    valueClass: "text-success"  },
] as const;

function CommandStrip() {
  const { data, isLoading } = useRegulatoryCommand();
  return (
    <div className="grid grid-cols-3 gap-x-5 gap-y-2">
      {STRIP_CARDS.map(({ key, label, valueClass }) => (
        <div key={key}>
          <p className={`text-lg font-bold tabular-nums leading-none ${valueClass}`}>
            {isLoading ? "—" : (data?.[key] ?? 0)}
          </p>
          <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Registrations tab — shows empty state when both sub-sections have nothing
// ---------------------------------------------------------------------------

function RegistrationsTab() {
  const { data: pending = [], isLoading: loadingPending } = usePendingRegistrations();
  const { data: consultations = [], isLoading: loadingConsultations } = useIncomingConsultations();

  const loading = loadingPending || loadingConsultations;
  const empty = !loading && pending.length === 0 && consultations.length === 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <LoaderCircle className="mr-2 size-5 animate-spin" />
        <span className="text-sm">Loading registration queue…</span>
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-success/10">
          <ClipboardList className="size-5 text-success" />
        </div>
        <p className="text-sm font-medium text-foreground">All clear</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          No pending registrations and no incoming consultations at this time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PendingRegistrations />
      <IncomingConsultations />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegulatorPage() {
  const { data: queue, isLoading } = useRegulatorQueue();
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [tab, setTab] = useState<Tab>("scan");
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);

  const columns: ColumnDef<TableFeatures, License>[] = [
    {
      accessorKey: "organizationName",
      header: "Applicant",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="size-4 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium">{row.getValue("organizationName")}</span>
        </div>
      ),
    },
    {
      accessorKey: "licenseNumber",
      header: "Licence",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("licenseNumber")}</span>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-sm">{row.getValue("categoryName")}</span>
      ),
    },
    {
      accessorKey: "activity",
      header: "Activity",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.getValue("activity")}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge variant="outline" className={statusColor(status)}>
            {statusLabel(status)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <QueueActions license={row.original} onSelect={setSelectedLicense} />
      ),
    },
  ];

  return (
    <div className="space-y-6">

      {/* ── Page header + inline command strip ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Shield className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Regulatory Patrol</h1>
            <p className="text-sm text-muted-foreground">
              Registrations, licences, enforcement, and market intelligence — all in one place.
            </p>
          </div>
        </div>
        <CommandStrip />
      </div>

      {/* ── Tabs ── */}
      <div>
        {/* Tab bar */}
        <div className="flex gap-1 rounded-xl border border-border bg-muted/50 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                tab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="mt-5 space-y-5">

          {/* Scan — primary workflow, first tab */}
          {tab === "scan" && (
            <FieldInspectionMode />
          )}

          {/* Registrations — review queue for new applicants */}
          {tab === "registrations" && (
            <RegistrationsTab />
          )}

          {/* Licences — submitted applications awaiting approve/reject */}
          {tab === "licences" && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <Gavel className="size-4 text-primary" />
                <h2 className="text-base font-semibold">Licence applications</h2>
                <Badge variant="outline" className="ml-auto">
                  {queue?.length ?? 0} pending
                </Badge>
              </div>
              <Card>
                <CardContent className="pt-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : queue && queue.length > 0 ? (
                    <DataTable
                      columns={columns}
                      data={queue}
                      filterPlaceholder="Search by applicant or licence number…"
                      filterColumn="organizationName"
                      pageSize={10}
                      noBorder
                      headerClassName="bg-muted"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
                        <Gavel className="size-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-foreground">Queue empty</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No licence applications are currently awaiting review.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              <ProductRegistrationQueue />
              <IncomingReferrals />
            </div>
          )}

          {/* Enforcement — cases only, scans live in the Scan tab */}
          {tab === "enforcement" && (
            <CaseWorkQueue />
          )}

          {/* Intelligence — market signals, complaint triage */}
          {tab === "intelligence" && (
            <div className="space-y-5">
              <ComplaintTriage />
              <SignalWatch />
            </div>
          )}

          {/* Setup — authority configuration */}
          {tab === "setup" && (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-4 shadow-sm">
                <div>
                  <h2 className="text-sm font-semibold">Regulatory Framework & License Categories</h2>
                  <p className="text-xs text-muted-foreground">
                    Define authorized license categories, document submission rules, and permitted product sectors.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="shadow-sm gap-1.5 text-xs h-9 shrink-0"
                  onClick={() => setShowCategoriesDialog(true)}
                >
                  <Layers className="size-4 text-primary" />
                  Manage License Categories
                </Button>
              </div>
              <AuthoritySelfSetup />
            </div>
          )}

        </div>
      </div>

      {selectedLicense && (
        <ReviewDialog
          key={selectedLicense.id}
          license={selectedLicense}
          onClose={() => setSelectedLicense(null)}
        />
      )}

      <ManageCategoriesDialog
        open={showCategoriesDialog}
        onOpenChange={setShowCategoriesDialog}
      />
    </div>
  );
}
