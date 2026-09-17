"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useLicenseDocuments,
  useLicenseHistory,
  useDownloadDocument,
  useRenewLicense,
  statusLabel,
  statusColor,
} from "@/hooks/licensing";
import { getApiErrorMessage, type License, type LicenseDocument } from "@/lib/api";
import {
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  FileText,
  Download,
  History,
  CheckCircle2,
  Circle,
  AlertCircle,
  AlertTriangle,
  Award,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  UserCheck,
  MapPin,
  LoaderCircle,
  Send,
  X,
} from "lucide-react";
import { LicenseCertificateModal } from "./license-certificate-modal";
import { LicenseFollowUpPanel } from "./license-followup-panel";
import { cn } from "@/lib/utils";

interface LicenseTrackerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  license: License | null;
  onOpenDossierUpload?: (license: License) => void;
}

export function LicenseTrackerModal({
  open,
  onOpenChange,
  license,
  onOpenDossierUpload,
}: LicenseTrackerModalProps) {
  const [showCertificate, setShowCertificate] = useState(false);
  const renewMutation = useRenewLicense();
  const downloadMutation = useDownloadDocument();

  const { data: documents = [], isLoading: docsLoading } = useLicenseDocuments(
    license?.id ?? 0
  );
  const { data: history = [], isLoading: historyLoading } = useLicenseHistory(
    license?.id ?? 0
  );

  if (!license) return null;

  const meta = license.premiseMetadata || {};

  // Calculate days remaining until expiry if active
  const calculateDaysRemaining = () => {
    if (!license.expiresOn) return null;
    const expiry = new Date(license.expiresOn);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysRemaining = calculateDaysRemaining();

  const handleRenew = async () => {
    if (!confirm(`Do you wish to submit a renewal application for ${license.licenseNumber}?`)) {
      return;
    }
    try {
      const res = await renewMutation.mutateAsync(license.id);
      toast.success(`Renewal application #${res.licenseNumber} opened successfully.`);
      onOpenChange(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleDownloadDoc = (docId: number, filename: string) => {
    downloadMutation.mutate(
      { documentId: docId, filename },
      {
        onError: (err) => toast.error(getApiErrorMessage(err)),
      }
    );
  };

  // Lifecycle progress steps
  const getProgressStep = () => {
    switch (license.status) {
      case "DRAFT":
        return 1;
      case "SUBMITTED":
        return 2;
      case "UNDER_REVIEW":
        return 3;
      case "ACTIVE":
      case "REJECTED":
      case "SUSPENDED":
      case "REVOKED":
      case "EXPIRED":
      case "CANCELLED":
        return 4;
      default:
        return 1;
    }
  };

  const currentStep = getProgressStep();

  const steps = [
    {
      num: 1,
      label: "Dossier Intake",
      desc: "Application & requirements compiled",
      completed: currentStep > 1 || license.status === "ACTIVE",
      active: license.status === "DRAFT",
    },
    {
      num: 2,
      label: "Document Screening",
      desc: "Clerk verifies dossier completeness",
      completed: currentStep > 2 || license.status === "ACTIVE",
      active: license.status === "SUBMITTED",
    },
    {
      num: 3,
      label: "Technical Inspection",
      desc: "Inspector assesses site & compliance",
      completed: currentStep > 3 || license.status === "ACTIVE",
      active: license.status === "UNDER_REVIEW",
    },
    {
      num: 4,
      label: "Board Determination",
      desc: license.status === "ACTIVE" ? "License Approved & Certified" : "Decision rendered",
      completed: license.status === "ACTIVE",
      active: license.status === "ACTIVE",
      failed: license.status === "REJECTED" || license.status === "SUSPENDED" || license.status === "REVOKED",
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPopup className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold font-mono text-foreground">
                    {license.licenseNumber}
                  </DialogTitle>
                  <Badge variant="outline" className={statusColor(license.status)}>
                    {statusLabel(license.status)}
                  </Badge>
                  {license.provisional && (
                    <Badge variant="outline" className="bg-warning text-white border-warning text-[10px]">
                      Provisional
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground">
                  {license.categoryName} · {license.organizationName}
                </DialogDescription>
              </div>
            </div>

            {/* Quick Header Actions */}
            <div className="flex items-center gap-2">
              {license.status === "ACTIVE" && (
                <Button
                  onClick={() => setShowCertificate(true)}
                  size="sm"
                  className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  <Award className="w-3.5 h-3.5" />
                  View Certificate
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Alert Banner if Special Status */}
            {license.status === "REJECTED" && (
              <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider">
                    Application Screening Unsuccessful
                  </p>
                  <p className="text-xs text-foreground/90">
                    {license.statusReason || "The regulatory authority has rejected this application. Review the checklist notes and reapply with required corrections."}
                  </p>
                </div>
              </div>
            )}

            {license.status === "ACTIVE" && daysRemaining !== null && daysRemaining <= 60 && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">
                      License Renewal Required (Expires in {daysRemaining} days)
                    </p>
                    <p className="text-[13px] text-muted-foreground">
                      Operating licenses must be renewed prior to expiration to prevent compliance disruption.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRenew}
                  disabled={renewMutation.isPending}
                  className="text-xs gap-1.5 shrink-0 bg-background"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Apply Renewal
                </Button>
              </div>
            )}

            {/* Application Lifecycle Stepper */}
            <div className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Application Review Lifecycle
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                {steps.map((step) => (
                  <div
                    key={step.num}
                    className={cn(
                      "p-3 rounded-lg border text-xs space-y-1 transition-all",
                      step.completed
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                        : step.active
                        ? "bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/30"
                        : step.failed
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-muted/30 border-border text-muted-foreground opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[13px] uppercase tracking-wider">
                        Stage {step.num}
                      </span>
                      {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : step.active ? (
                        <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                      ) : (
                        <Circle className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <p className="font-semibold text-foreground">{step.label}</p>
                    <p className="text-[13px] text-muted-foreground leading-tight">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Premise & Dossier Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: License Details */}
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-foreground font-semibold border-b border-border pb-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <span>Premise & Facility Dossier</span>
                </div>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-muted-foreground">Facility Site</dt>
                    <dd className="font-medium text-foreground">
                      {license.facilityName || meta.facilityName || "Enterprise Main Site"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Cadastral Plot (UPI)</dt>
                    <dd className="font-mono font-medium text-foreground">
                      {meta.cadastralUpi || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Activity Scope</dt>
                    <dd className="font-medium text-foreground">{license.activity}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Grain / Scope</dt>
                    <dd className="font-medium text-foreground">{license.grain || "Site-specific"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Issued On</dt>
                    <dd className="font-medium text-foreground">
                      {license.issuedOn ? new Date(license.issuedOn).toLocaleDateString() : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Expires On</dt>
                    <dd className="font-medium text-foreground">
                      {license.expiresOn ? new Date(license.expiresOn).toLocaleDateString() : "—"}
                    </dd>
                  </div>
                  {license.issuedByName && (
                    <div className="col-span-2">
                      <dt className="text-muted-foreground">Issuing Authority</dt>
                      <dd className="font-medium text-foreground">{license.issuedByName}</dd>
                    </div>
                  )}
                  {meta.technician && (
                    <div className="col-span-2 pt-1 border-t border-border">
                      <dt className="text-muted-foreground">Technical In-Charge</dt>
                      <dd className="font-medium text-foreground">
                        {meta.technician.name} ({meta.technician.title}) · ID: {meta.technician.idNumber}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Card 2: Attached Dossier Documents */}
              <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3 text-xs flex flex-col">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <FileText className="w-4 h-4 text-primary" />
                    <span>Dossier Certificates ({documents.length})</span>
                  </div>
                  {license.status === "DRAFT" && onOpenDossierUpload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenDossierUpload(license)}
                      className="h-6 px-2 text-[13px] text-primary"
                    >
                      + Upload More
                    </Button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 max-h-[160px] pr-1">
                  {docsLoading ? (
                    <div className="py-4 flex justify-center">
                      <LoaderCircle className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : documents.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground italic">
                      No documents attached to this application yet.
                    </div>
                  ) : (
                    documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2.5 rounded-lg border border-border bg-card flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {doc.documentType.replace(/_/g, " ")}
                            </p>
                            <p className="text-[13px] text-muted-foreground truncate">
                              {doc.filename}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadDoc(doc.id, doc.filename)}
                          className="h-7 px-2 text-primary"
                          title="Download document"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Conditions & Follow-up Items */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <LicenseFollowUpPanel
                licenseId={license.id}
                licenseNumber={license.licenseNumber}
              />
            </div>

            {/* Audit Trail / History Timeline */}
            <div className="p-4 rounded-xl border border-border bg-card/60 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-semibold text-xs border-b border-border pb-2">
                <History className="w-4 h-4 text-primary" />
                <span>Follow-up Activity & Audit Trail</span>
              </div>

              {historyLoading ? (
                <div className="py-6 flex justify-center">
                  <LoaderCircle className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No activity events recorded yet.
                </p>
              ) : (
                <ol className="relative border-l border-border pl-4 space-y-3 text-xs">
                  {history.map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {event.type.replace(/_/g, " ")}
                          </span>
                          {event.toStatus && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                              {event.toStatus}
                            </Badge>
                          )}
                        </div>
                        {event.notes && (
                          <p className="text-muted-foreground text-[13px] bg-muted/30 p-1.5 rounded border border-border mt-0.5">
                            {event.notes}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(event.recordedAt).toLocaleString()}
                          {event.actor ? ` · By ${event.actor}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-card/60 backdrop-blur-sm text-xs">
            <span className="text-muted-foreground">
              Reference ID: <span className="font-mono text-foreground font-medium">{license.licenseNumber}</span>
            </span>
            <div className="flex items-center gap-2">
              {license.status === "ACTIVE" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCertificate(true)}
                  className="text-xs gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  Official Certificate
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogPopup>
      </Dialog>

      {/* Embedded Certificate Viewer */}
      <LicenseCertificateModal
        open={showCertificate}
        onOpenChange={setShowCertificate}
        license={license}
      />
    </>
  );
}
