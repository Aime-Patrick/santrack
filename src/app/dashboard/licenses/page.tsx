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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMyLicenses,
  useLicenseDocuments,
  useLicenseHistory,
  useDownloadDocument,
  useLicenseCategories,
  useAttachDocument,
  useSubmitLicense,
  useCancelLicense,
  useRenewLicense,
  statusLabel,
  statusColor,
} from "@/hooks/licensing";
import {
  useMyProductRegistrations,
  useSubmitProductRegistration,
  useCancelProductRegistration,
  productStatusColor,
  productStatusLabel,
} from "@/hooks/product-registration";
import { ApplyLicenseDialog } from "@/components/licensing/apply-license-dialog";
import { ApplyPremiseLicenseDialog } from "@/components/licensing/apply-premise-license-dialog";
import { RegisterProductDialog } from "@/components/licensing/register-product-dialog";
import { ManageCategoriesDialog } from "@/components/licensing/manage-categories-dialog";
import { LicenseTrackerModal } from "@/components/licensing/license-tracker-modal";
import { LicenseCertificateModal } from "@/components/licensing/license-certificate-modal";
import { useMe } from "@/hooks/auth";
import {
  getApiErrorMessage,
  type License,
  type LicenseDocument,
  type ProductRegistration,
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
  Building2,
  Package,
  ShieldCheck,
  ChevronDown,
  MapPin,
  UserCheck,
  Layers,
  Award,
  RefreshCw,
} from "lucide-react";

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

function docLabel(documentType: string): string {
  const words = documentType.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : "—";
}



type RowState = "missing" | "ready" | "uploading" | "uploaded" | "failed";

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
  const [justUploaded, setJustUploaded] = useState<Record<string, string>>({});
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [failedType, setFailedType] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

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

  const handleSubmit = async () => {
    const queue = requiredDocs.filter((docType) => staged[docType]);
    setProgress({ done: 0, total: queue.length });

    for (const [index, docType] of queue.entries()) {
      const file = staged[docType];
      setUploadingType(docType);
      try {
        await attachMutation.mutateAsync({ documentType: docType, file });
      } catch (error) {
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
                  <div key={docType} className="flex items-center gap-2.5">
                    <div className="shrink-0">
                      {state === "uploading" ? (
                        <LoaderCircle className="size-4 animate-spin text-primary" />
                      ) : state === "failed" ? (
                        <AlertCircle className="size-4 text-danger" />
                      ) : state === "ready" || state === "uploaded" ? (
                        <CheckCircle2 className="size-4 text-success" />
                      ) : (
                        <Circle className="size-4 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground">
                        {docLabel(docType)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {state === "uploaded"
                          ? `${uploadedName} · Uploaded`
                          : state === "ready"
                          ? `${file?.name} · Ready to upload`
                          : "Required"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        ref={(el) => {
                          inputsRef.current[docType] = el;
                        }}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => handleFileChange(docType, e)}
                      />
                      {(state === "ready" || state === "failed") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-danger"
                          onClick={() => unstage(docType)}
                          disabled={busy}
                        >
                          <X className="size-3" />
                        </Button>
                      )}
                      <Button
                        variant={state === "missing" ? "outline" : "ghost"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handlePick(docType)}
                        disabled={busy}
                      >
                        <Upload className="size-3 mr-1" />
                        {state === "missing" ? "Choose file" : "Change"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={cancelMutation.isPending || busy}
            >
              Cancel Application
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
              {busy ? <LoaderCircle className="mr-1 size-3 animate-spin" /> : <Send className="mr-1 size-3" />}
              Submit for Review
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}

function LicenseRowActions({ license }: { license: License }) {
  const [showTracker, setShowTracker] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showDraftDetail, setShowDraftDetail] = useState(false);
  const { data: documents } = useLicenseDocuments(license.id);
  const { data: categories, isLoading: categoriesLoading } = useLicenseCategories();
  const cancelMutation = useCancelLicense();
  const renewMutation = useRenewLicense();

  const category = categories?.find((c) => c.id === license.categoryId);
  const requiredDocs = category?.requiredDocuments ?? [];

  const handleRenew = async () => {
    if (!confirm(`Apply for a renewal of license #${license.licenseNumber}?`)) return;
    try {
      const res = await renewMutation.mutateAsync(license.id);
      toast.success(`Renewal application #${res.licenseNumber} created successfully.`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  if (license.status === "DRAFT") {
    return (
      <>
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={() => setShowDraftDetail(true)}
          >
            <Pencil className="size-3" />
            <span>Continue</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowTracker(true)}
            title="Track application"
          >
            <History className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-danger hover:text-danger hover:bg-danger/10"
            onClick={async () => {
              if (!confirm("Cancel this draft application?")) return;
              try {
                await cancelMutation.mutateAsync(license.id);
                toast.success("Application cancelled");
              } catch (error) {
                toast.error(getApiErrorMessage(error, "Could not cancel application"));
              }
            }}
            disabled={cancelMutation.isPending}
            title="Cancel application"
          >
            <X className="size-3" />
          </Button>
        </div>

        <DraftDetailDialog
          open={showDraftDetail}
          onOpenChange={setShowDraftDetail}
          license={license}
          requiredDocs={requiredDocs}
          documents={documents ?? []}
          categoriesLoading={categoriesLoading}
        />
        <LicenseTrackerModal
          open={showTracker}
          onOpenChange={setShowTracker}
          license={license}
          onOpenDossierUpload={() => setShowDraftDetail(true)}
        />
      </>
    );
  }

  const isUnderReview = license.status === "SUBMITTED" || license.status === "UNDER_REVIEW";
  const isActive = license.status === "ACTIVE";
  const isExpired = license.status === "EXPIRED";

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        {isActive && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/10"
            onClick={() => setShowCertificate(true)}
            title="Official Digital Certificate"
          >
            <Award className="size-3" />
            <span className="hidden sm:inline">Certificate</span>
          </Button>
        )}

        {(isActive || isExpired) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleRenew}
            disabled={renewMutation.isPending}
            title="Apply for Renewal"
          >
            <RefreshCw className="size-3" />
          </Button>
        )}

        <Button
          variant={isUnderReview ? "outline" : "ghost"}
          size="sm"
          className={cn(
            "h-7 px-2.5 text-xs gap-1.5",
            isUnderReview && "border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10"
          )}
          onClick={() => setShowTracker(true)}
        >
          {isUnderReview ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
              <span>Track</span>
            </>
          ) : (
            <>
              <ExternalLink className="size-3" />
              <span>Details</span>
            </>
          )}
        </Button>
      </div>

      <LicenseTrackerModal
        open={showTracker}
        onOpenChange={setShowTracker}
        license={license}
      />
      <LicenseCertificateModal
        open={showCertificate}
        onOpenChange={setShowCertificate}
        license={license}
      />
    </>
  );
}

function LicenseDetailDialog({
  open,
  onOpenChange,
  license,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  license: License;
}) {
  const { data: documents, isLoading: documentsLoading } = useLicenseDocuments(license.id);
  const { data: history, isLoading: historyLoading } = useLicenseHistory(license.id);
  const downloadMutation = useDownloadDocument();

  const handleDownload = (documentId: number, filename: string) => {
    downloadMutation.mutate(
      { documentId, filename },
      {
        onError: (error) =>
          toast.error(getApiErrorMessage(error, `Could not download ${filename}`)),
      },
    );
  };

  const meta = license.premiseMetadata;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogTitle>{license.licenseNumber}</DialogTitle>
        <DialogDescription>{license.categoryName}</DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline" className={statusColor(license.status)}>
                {statusLabel(license.status)}
              </Badge>
              {license.facilityName && (
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  Site: {license.facilityName}
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

            {/* Premise Metadata details if available */}
            {meta && (
              <div className="border-t pt-2 mt-2 space-y-1 text-xs">
                {meta.technician && (
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Technician:</strong> {meta.technician.name} ({meta.technician.title}) · ID: {meta.technician.idNumber}
                  </p>
                )}
                {meta.productsProduced && (
                  <p className="text-muted-foreground">
                    <strong className="text-foreground">Products:</strong> {meta.productsProduced}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Dossier Documents
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
                        {doc.filename} · {formatBytes(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 px-2 text-xs text-primary"
                    onClick={() => handleDownload(doc.id, doc.filename)}
                  >
                    <Download className="size-3" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Audit trail */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
              <History className="size-3" /> Audit trail
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
                        <span className="text-muted-foreground"> — {statusLabel(event.toStatus)}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.recordedAt).toLocaleString()}
                      {event.actor ? ` · ${event.actor}` : ""}
                    </p>
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

export default function UnifiedLicensingHubPage() {
  const { data: me } = useMe();
  const { data: licenses, isLoading: licensesLoading } = useMyLicenses();
  const { data: productRegistrations, isLoading: prodRegLoading } = useMyProductRegistrations();

  const canManageCategories =
    me?.role === "SYSTEM_ADMIN" ||
    me?.capabilities?.includes("ADMINISTER_PLATFORM") ||
    me?.capabilities?.includes("OVERSEE_INDUSTRIES");

  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showPremiseDialog, setShowPremiseDialog] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false);

  // Group licenses into Business Licenses vs Premise Registrations
  const businessLicenses = licenses?.filter((l) => !l.facilityId && !l.categoryCode.includes("PREMISE")) ?? [];
  const premiseLicenses = licenses?.filter((l) => Boolean(l.facilityId) || l.categoryCode.includes("PREMISE")) ?? [];

  // Business License Columns
  const businessColumns: ColumnDef<TableFeatures, License>[] = [
    {
      accessorKey: "licenseNumber",
      header: "Licence Number",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary shrink-0" />
          <span className="font-mono font-medium text-foreground text-sm">
            {row.getValue("licenseNumber")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Category",
      cell: ({ row }) => <span className="text-sm">{row.getValue("categoryName")}</span>,
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
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("issuedOn") ?? "—"}</span>,
    },
    {
      accessorKey: "expiresOn",
      header: "Expires",
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.getValue("expiresOn") ?? "—"}</span>,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <LicenseRowActions license={row.original} />,
    },
  ];

  // Premise Registration Columns
  const premiseColumns: ColumnDef<TableFeatures, License>[] = [
    {
      accessorKey: "facilityName",
      header: "Premise / Facility",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Building2 className="size-4 text-emerald-600 shrink-0" />
          <div>
            <p className="font-medium text-foreground text-sm">
              {row.original.facilityName || row.original.licenseNumber}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{row.original.licenseNumber}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "categoryName",
      header: "Premise Classification",
      cell: ({ row }) => <span className="text-sm">{row.getValue("categoryName")}</span>,
    },
    {
      id: "technician",
      header: "Responsible Technician",
      cell: ({ row }) => {
        const tech = row.original.premiseMetadata?.technician;
        return tech ? (
          <div className="text-xs">
            <p className="font-medium text-foreground">{tech.name}</p>
            <p className="text-muted-foreground">{tech.title}</p>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline" className={statusColor(row.getValue("status"))}>
          {statusLabel(row.getValue("status"))}
        </Badge>
      ),
    },
    {
      accessorKey: "expiresOn",
      header: "Validity",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.issuedOn ? `${row.original.issuedOn} → ${row.original.expiresOn}` : "—"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => <LicenseRowActions license={row.original} />,
    },
  ];

  // Product Registration Columns
  const productColumns: ColumnDef<TableFeatures, ProductRegistration>[] = [
    {
      accessorKey: "registrationNumber",
      header: "Market Auth Reg No.",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Package className="size-4 text-blue-600 shrink-0" />
          <span className="font-mono font-medium text-foreground text-sm">
            {row.getValue("registrationNumber")}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "productName",
      header: "Product & Brand",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground text-sm">{row.original.productName}</p>
          {row.original.brandName && (
            <p className="text-xs text-muted-foreground">Brand: {row.original.brandName}</p>
          )}
        </div>
      ),
    },
    {
      id: "premise",
      header: "Premise / Site",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.facility?.name ?? "Company Site"}
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
      accessorKey: "expiresOn",
      header: "Expires",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.expiresOn ?? "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Unified Hub Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Licensing & Regulatory Hub</h1>
            <p className="text-xs text-muted-foreground">
              Unified compliance center: Business operating permits, premise licenses & product market authorizations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageCategories && (
            <Button
              variant="outline"
              className="shadow-sm gap-1.5 text-xs h-9"
              onClick={() => setShowCategoriesDialog(true)}
            >
              <Layers className="size-4 text-primary" />
              Manage Categories
            </Button>
          )}

          {/* Unified "+ Apply / Register" Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button className="shadow-sm">
                  <Plus className="mr-1.5 size-4" /> Apply / Register
                  <ChevronDown className="ml-1.5 size-3.5 opacity-70" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-64 p-1.5">
              <DropdownMenuItem
                className="cursor-pointer py-2"
                onClick={() => setShowApplyDialog(true)}
              >
                <FileText className="mr-2 size-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Business Operating License</p>
                  <p className="text-[11px] text-muted-foreground">Manufacturing, Trade, Warehousing</p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer py-2"
                onClick={() => setShowPremiseDialog(true)}
              >
                <Building2 className="mr-2 size-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium">Premise Registration (Inyubako)</p>
                  <p className="text-[11px] text-muted-foreground">Factory plant, MCC, slaughterhouse</p>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer py-2"
                onClick={() => setShowProductDialog(true)}
              >
                <Package className="mr-2 size-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Regulated Product Registration</p>
                  <p className="text-[11px] text-muted-foreground">Market auth, CoA lab test & RSB</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Unified Tabbed Layout */}
      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="bg-muted/60 p-1">
          <TabsTrigger value="business" className="gap-2 text-xs">
            <ShieldCheck className="size-3.5" /> Business Licenses ({businessLicenses.length})
          </TabsTrigger>
          <TabsTrigger value="premises" className="gap-2 text-xs">
            <Building2 className="size-3.5" /> Premise Registrations ({premiseLicenses.length})
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 text-xs">
            <Package className="size-3.5" /> Product Registrations ({productRegistrations?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: BUSINESS OPERATING LICENSES */}
        <TabsContent value="business">
          <Card>
            <CardContent className="pt-6">
              {licensesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : businessLicenses.length > 0 ? (
                <DataTable
                  columns={businessColumns}
                  data={businessLicenses}
                  filterPlaceholder="Search operating licences..."
                  filterColumn="licenseNumber"
                  pageSize={10}
                  noBorder
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ShieldCheck className="size-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No business licenses yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Apply for an operating licence to conduct manufacturing, distribution or warehousing
                  </p>
                  <Button className="mt-4" size="sm" onClick={() => setShowApplyDialog(true)}>
                    Apply for Business Licence
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: PREMISE REGISTRATIONS */}
        <TabsContent value="premises">
          <Card>
            <CardContent className="pt-6">
              {licensesLoading ? (
                <div className="flex items-center justify-center py-16">
                  <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : premiseLicenses.length > 0 ? (
                <DataTable
                  columns={premiseColumns}
                  data={premiseLicenses}
                  filterPlaceholder="Search premise registrations..."
                  filterColumn="facilityName"
                  pageSize={10}
                  noBorder
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Building2 className="size-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No premise registrations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Register your manufacturing facility, MCC or processing site per RICA & RFDA requirements
                  </p>
                  <Button className="mt-4" size="sm" onClick={() => setShowPremiseDialog(true)}>
                    Register First Premise
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PRODUCT REGISTRATIONS */}
        <TabsContent value="products">
          <Card>
            <CardContent className="pt-6">
              {prodRegLoading ? (
                <div className="flex items-center justify-center py-16">
                  <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
                </div>
              ) : productRegistrations && productRegistrations.length > 0 ? (
                <DataTable
                  columns={productColumns}
                  data={productRegistrations}
                  filterPlaceholder="Search product registrations..."
                  filterColumn="productName"
                  pageSize={10}
                  noBorder
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="size-10 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">No registered products yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Apply for market authorization with laboratory CoA test results and label artwork
                  </p>
                  <Button className="mt-4" size="sm" onClick={() => setShowProductDialog(true)}>
                    Register First Product
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ApplyLicenseDialog
        open={showApplyDialog}
        onOpenChange={setShowApplyDialog}
        onSwitchToPremise={() => {
          setShowApplyDialog(false);
          setShowPremiseDialog(true);
        }}
      />
      <ApplyPremiseLicenseDialog
        open={showPremiseDialog}
        onOpenChange={setShowPremiseDialog}
      />
      <RegisterProductDialog
        open={showProductDialog}
        onOpenChange={setShowProductDialog}
      />
      {canManageCategories && (
        <ManageCategoriesDialog
          open={showCategoriesDialog}
          onOpenChange={setShowCategoriesDialog}
        />
      )}
    </div>
  );
}
