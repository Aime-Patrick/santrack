"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  useMyLicenses,
  useLicenseDocuments,
  useLicenseHistory,
  useDownloadDocument,
  useLicenseCategories,
  useAttachDocument,
  useSubmitLicense,
  useCancelLicense,
  statusLabel,
  statusColor,
} from "@/hooks/licensing";
import { ApplyLicenseDialog } from "@/components/licensing/apply-license-dialog";
import {
  getApiErrorMessage,
  type License,
  type LicenseDocument,
} from "@/lib/api";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  FileText,
  Send,
  LoaderCircle,
  ExternalLink,
  X,
  CheckCircle2,
  Circle,
  Upload,
  Pencil,
  AlertCircle,
  Download,
  History,
} from "lucide-react";

/**
 * Mirrors ALLOWED_CONTENT_TYPES and MAX_DOCUMENT_BYTES in the licensing
 * service. Checked here as well as there because a file is now chosen long
 * before it is sent — finding out at submit time that the wrong file was
 * picked is finding out too late.
 */
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

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

/** Inline actions for a DRAFT licence — owns its own hooks. */
function DraftActions({ license }: { license: License }) {
  const { data: documents } = useLicenseDocuments(license.id);
  const { data: categories, isLoading: categoriesLoading } =
    useLicenseCategories();
  const cancelMutation = useCancelLicense();
  const [showDetail, setShowDetail] = useState(false);

  const category = categories?.find((c) => c.id === license.categoryId);
  const requiredDocs = category?.requiredDocuments ?? [];

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setShowDetail(true)}
        >
          <Pencil className="size-3" />
          <span className="ml-1">Continue</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-danger hover:text-danger hover:bg-danger/10"
          onClick={async () => {
            try {
              await cancelMutation.mutateAsync(license.id);
            } catch (error) {
              toast.error(
                getApiErrorMessage(error, "Could not cancel this application"),
              );
            }
          }}
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? (
            <LoaderCircle className="size-3 animate-spin" />
          ) : (
            <X className="size-3" />
          )}
          <span className="ml-1">Cancel</span>
        </Button>
      </div>

      {/* Continue Application Dialog */}
      <DraftDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        license={license}
        requiredDocs={requiredDocs}
        documents={documents ?? []}
        categoriesLoading={categoriesLoading}
      />
    </>
  );
}

/** What one row of the checklist is doing, in the order that decides it. */
type RowState = "missing" | "ready" | "uploading" | "uploaded" | "failed";

const ROW_TONE: Record<RowState, string> = {
  missing: "",
  ready: "",
  uploading: "",
  uploaded: "",
  failed: "",
};

/**
 * The document checklist for a draft licence.
 *
 * Choosing a file stages it in the browser and nothing more. Uploading is part
 * of submitting, so an application is never half-filed on the server while the
 * applicant still thinks they are filling it in — and a file picked by mistake
 * can be swapped for the right one without anything having been sent.
 */
function DraftDetailDialog({
  open,
  onOpenChange,
  license,
  requiredDocs,
  documents,
  categoriesLoading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  license: License;
  requiredDocs: string[];
  documents: LicenseDocument[];
  categoriesLoading: boolean;
}) {
  const attachMutation = useAttachDocument(license.id);
  const submitMutation = useSubmitLicense();
  const cancelMutation = useCancelLicense();

  const [staged, setStaged] = useState<Record<string, File>>({});
  /**
   * Filename per type uploaded in this session, so a row does not blink back
   * to "missing" in the gap between the upload landing and the refetched
   * document list arriving.
   */
  const [justUploaded, setJustUploaded] = useState<Record<string, string>>({});
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [failedType, setFailedType] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  /**
   * One picker per row rather than one shared between them: the row a file
   * belongs to is then part of the element that produced it, instead of state
   * that has to be set on the way in and cleared on the way out.
   */
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

  // Last one wins: attaching adds a row rather than replacing one, so a type
  // uploaded twice appears twice and the earlier entry is the stale one.
  const attached = new Map<string, LicenseDocument>();
  for (const doc of documents) {
    attached.set(doc.documentType, doc);
  }

  const isSatisfied = (docType: string) =>
    Boolean(staged[docType]) ||
    attached.has(docType) ||
    Boolean(justUploaded[docType]);

  const stateOf = (docType: string): RowState => {
    if (uploadingType === docType) return "uploading";
    if (failedType === docType) return "failed";
    if (staged[docType]) return "ready";
    if (attached.has(docType) || justUploaded[docType]) return "uploaded";
    return "missing";
  };

  const satisfiedCount = requiredDocs.filter(isSatisfied).length;
  const missingCount = requiredDocs.length - satisfiedCount;
  const stagedCount = requiredDocs.filter((t) => staged[t]).length;
  const busy = uploadingType !== null || submitMutation.isPending;
  const canSubmit = !categoriesLoading && missingCount === 0 && !busy;

  const handlePick = (docType: string) => {
    inputsRef.current[docType]?.click();
  };

  const handleFileChange = (
    docType: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    // Cleared either way: re-picking the same file fires no change event
    // otherwise, so a row that failed could not be retried with the same file.
    e.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`${file.name} is not a PDF or an image`);
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error(
        `${file.name} is ${formatBytes(file.size)} — the limit is ${formatBytes(MAX_DOCUMENT_BYTES)}`,
      );
      return;
    }

    setStaged((prev) => ({ ...prev, [docType]: file }));
    setFailedType((prev) => (prev === docType ? null : prev));
  };

  const unstage = (docType: string) => {
    setStaged((prev) => {
      const next = { ...prev };
      delete next[docType];
      return next;
    });
    setFailedType((prev) => (prev === docType ? null : prev));
  };

  /** The only step that sends anything: every staged file, then the licence. */
  const handleSubmit = async () => {
    const queue = requiredDocs.filter((docType) => staged[docType]);
    setProgress({ done: 0, total: queue.length });

    for (const [index, docType] of queue.entries()) {
      const file = staged[docType];
      setUploadingType(docType);
      try {
        await attachMutation.mutateAsync({ documentType: docType, file });
      } catch (error) {
        // Stop at the first failure rather than pressing on: whatever already
        // uploaded stays uploaded, and the row that failed says so.
        setUploadingType(null);
        setFailedType(docType);
        toast.error(
          getApiErrorMessage(error, `Could not upload ${docLabel(docType)}`),
        );
        return;
      }
      setJustUploaded((prev) => ({ ...prev, [docType]: file.name }));
      setStaged((prev) => {
        const next = { ...prev };
        delete next[docType];
        return next;
      });
      setProgress({ done: index + 1, total: queue.length });
    }
    setUploadingType(null);

    try {
      await submitMutation.mutateAsync(license.id);
      toast.success(`${license.licenseNumber} submitted for review`);
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not submit this application"));
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(license.id);
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not cancel this application"));
    }
  };

  const submitLabel = () => {
    if (uploadingType) {
      return `Uploading ${progress.done + 1} of ${progress.total}...`;
    }
    if (submitMutation.isPending) return "Submitting...";
    if (missingCount > 0) {
      return `Submit (${missingCount} doc${missingCount === 1 ? "" : "s"} missing)`;
    }
    if (stagedCount > 0) {
      return `Upload ${stagedCount} file${stagedCount === 1 ? "" : "s"} & submit`;
    }
    return "Submit for Review";
  };

  const rowCaption = (
    state: RowState,
    file: File | undefined,
    uploadedName: string | undefined,
  ): string => {
    switch (state) {
      case "ready":
        return file ? `${file.name} · ${formatBytes(file.size)} · ready` : "";
      case "uploading":
        return "Uploading...";
      case "failed":
        return "Upload failed — choose the file again";
      case "uploaded":
        return `${uploadedName} · uploaded`;
      default:
        return "Not chosen yet";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogTitle>Continue Application</DialogTitle>
        <DialogDescription>
          {license.licenseNumber} — {license.categoryName}
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : requiredDocs.length === 0 ? (
            <p className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
              This licence category needs no supporting documents.
            </p>
          ) : (
            <div className="space-y-3">
              {requiredDocs.map((docType) => {
                const state = stateOf(docType);
                const file = staged[docType];
                const uploadedName =
                  justUploaded[docType] ?? attached.get(docType)?.filename;
                return (
                  <motion.div
                    key={docType}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-2.5"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={state}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [0.5, 1.25, 1], opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="shrink-0"
                      >
                        {state === "uploading" ? (
                          <LoaderCircle className="size-4 animate-spin text-primary" />
                        ) : state === "failed" ? (
                          <AlertCircle className="size-4 text-danger" />
                        ) : state === "ready" ? (
                          <CheckCircle2 className="size-4 text-primary" />
                        ) : state === "uploaded" ? (
                          <CheckCircle2 className="size-4 text-success" />
                        ) : (
                          <Circle className="size-4 text-muted-foreground" />
                        )}
                      </motion.div>
                    </AnimatePresence>

                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground">
                        {docLabel(docType)}
                      </span>
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.p
                          key={state}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "truncate text-xs",
                            state === "uploaded" && "text-success",
                            state === "failed" && "text-danger",
                            (state === "ready" || state === "uploading") &&
                              "text-primary",
                            state === "missing" && "text-muted-foreground",
                          )}
                        >
                          {rowCaption(state, file, uploadedName)}
                        </motion.p>
                      </AnimatePresence>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        ref={(el) => {
                          inputsRef.current[docType] = el;
                        }}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        data-doc-type={docType}
                        onChange={(e) => handleFileChange(docType, e)}
                      />
                      {(state === "ready" || state === "failed") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-danger hover:bg-danger/10"
                          onClick={() => unstage(docType)}
                          disabled={busy}
                          aria-label={`Remove ${docLabel(docType)}`}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                      <Button
                        variant={state === "missing" ? "outline" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-7 px-2 text-xs",
                          state !== "missing" &&
                            "text-primary hover:text-primary hover:bg-primary/10",
                        )}
                        onClick={() => handlePick(docType)}
                        disabled={busy}
                      >
                        <Upload className="size-3" />
                        <span className="ml-1">
                          {state === "missing" ? "Choose file" : "Change"}
                        </span>
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelMutation.isPending || busy}
            >
              {cancelMutation.isPending ? (
                <LoaderCircle className="mr-1 size-3 animate-spin" />
              ) : (
                <X className="mr-1 size-3" />
              )}
              Cancel Application
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
              {busy ? (
                <LoaderCircle className="mr-1 size-3 animate-spin" />
              ) : (
                <Send className="mr-1 size-3" />
              )}
              {submitLabel()}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

/** Opens the read-only view of a licence that is past the draft stage. */
function ViewLicenseAction({ license }: { license: License }) {
  const [showDetail, setShowDetail] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => setShowDetail(true)}
        >
          <ExternalLink className="size-3" />
          <span className="ml-1">View</span>
        </Button>
      </div>
      <LicenseDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        license={license}
      />
    </>
  );
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}

/**
 * Everything on record for one licence: where it stands, what was filed with
 * it, and how it got here.
 *
 * A dialog rather than a page because the compliance screen this used to link
 * to answers a different question — which licence governs the company today —
 * and so gave the same answer for every row in the table.
 */
function LicenseDetailDialog({
  open,
  onOpenChange,
  license,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  license: License;
}) {
  const { data: documents, isLoading: documentsLoading } = useLicenseDocuments(
    license.id,
  );
  const { data: history, isLoading: historyLoading } = useLicenseHistory(
    license.id,
  );
  const downloadMutation = useDownloadDocument();
  const downloadingId = downloadMutation.isPending
    ? downloadMutation.variables.documentId
    : null;

  const handleDownload = (documentId: number, filename: string) => {
    downloadMutation.mutate(
      { documentId, filename },
      {
        onError: (error) =>
          toast.error(
            getApiErrorMessage(error, `Could not download ${filename}`),
          ),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogTitle>{license.licenseNumber}</DialogTitle>
        <DialogDescription>{license.categoryName}</DialogDescription>

        <div className="mt-4 space-y-4">
          {/* Where it stands */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={statusColor(license.status)}>
                {statusLabel(license.status)}
              </Badge>
              {license.provisional && (
                <Badge
                  variant="outline"
                  className="border-warning bg-warning text-[10px] text-white"
                >
                  Provisional
                </Badge>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Issued</dt>
                <dd className="text-foreground">{formatDate(license.issuedOn)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Expires</dt>
                <dd className="text-foreground">{formatDate(license.expiresOn)}</dd>
              </div>
              {license.issuedByName && (
                <div>
                  <dt className="text-muted-foreground">Issued by</dt>
                  <dd className="text-foreground">{license.issuedByName}</dd>
                </div>
              )}
              {license.reviewedByName && (
                <div>
                  <dt className="text-muted-foreground">Reviewed by</dt>
                  <dd className="text-foreground">{license.reviewedByName}</dd>
                </div>
              )}
            </dl>

            {license.statusReason && (
              <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground">
                {license.statusReason}
                {license.statusChangedAt && (
                  <span className="text-faint">
                    {" "}
                    — {new Date(license.statusChangedAt).toLocaleString()}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* What was filed with it */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Documents
            </p>
            {documentsLoading ? (
              <div className="flex justify-center py-4">
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : !documents || documents.length === 0 ? (
              <p className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                Nothing was filed with this licence.
              </p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <FileText className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {docLabel(doc.documentType)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {doc.filename} · {formatBytes(doc.sizeBytes)} ·{" "}
                        {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                    onClick={() => handleDownload(doc.id, doc.filename)}
                    disabled={downloadingId === doc.id}
                    aria-label={`Download ${doc.filename}`}
                  >
                    {downloadingId === doc.id ? (
                      <LoaderCircle className="size-3 animate-spin" />
                    ) : (
                      <Download className="size-3" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* How it got here */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <History className="size-3" />
              Audit trail
            </p>
            {historyLoading ? (
              <div className="flex justify-center py-4">
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              </div>
            ) : !history || history.length === 0 ? (
              <p className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                No events recorded.
              </p>
            ) : (
              <ol className="space-y-2 border-l border-border pl-4">
                {history.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
                    <p className="text-sm text-foreground">
                      {docLabel(event.type)}
                      {event.toStatus && (
                        <span className="text-muted-foreground">
                          {" "}
                          — {statusLabel(event.toStatus)}
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
      </DialogPopup>
    </Dialog>
  );
}

export default function LicensesPage() {
  const { data: licenses, isLoading } = useMyLicenses();
  const [showApplyDialog, setShowApplyDialog] = useState(false);

  const columns: ColumnDef<TableFeatures, License>[] = [
    {
      accessorKey: "licenseNumber",
      header: "Licence Number",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary shrink-0" />
          <span className="font-mono font-medium text-foreground text-sm">
            {row.getValue("licenseNumber")}
          </span>
        </div>
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const provisional = row.original.provisional;
        return (
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={statusColor(status)}>
              {statusLabel(status)}
            </Badge>
            {provisional && (
              <Badge variant="outline" className="bg-warning text-white border-warning text-[10px]">
                Provisional
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "issuedOn",
      header: "Issued",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("issuedOn") ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "expiresOn",
      header: "Expires",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("expiresOn") ?? "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const license = row.original;
        if (license.status === "DRAFT") {
          return <DraftActions license={license} />;
        }
        return <ViewLicenseAction license={license} />;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <FileText className="size-4" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold tracking-tight">Licences</h1>
          <p className="text-sm text-muted-foreground">
            Applications, active licences and draft submissions
          </p>
        </div>
        <Button onClick={() => setShowApplyDialog(true)}>
          <Plus className="mr-1.5 size-4" />
          Apply for Licence
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : licenses && licenses.length > 0 ? (
            <DataTable
              columns={columns}
              data={licenses}
              filterPlaceholder="Search licences..."
              filterColumn="licenseNumber"
              pageSize={10}
              noBorder
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted mb-4">
                <FileText className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No licences yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Apply for a licence to start operating on the platform
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => setShowApplyDialog(true)}
              >
                Apply for Your First Licence
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Apply Dialog */}
      <ApplyLicenseDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
      />
    </div>
  );
}
