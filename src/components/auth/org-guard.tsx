"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck,
  FileText,
  HelpCircle,
  LoaderCircle,
  LogOut,
  Mail,
  MailCheck,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Upload,
} from "lucide-react";
import { useLogout, useMe } from "@/hooks/auth";
import { useResubmitRegistration } from "@/hooks/organizations";
import { onboardingService } from "@/services/onboarding.service";
import { getApiErrorMessage, type OrganizationResponse } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

const DOCUMENT_TYPES = [
  { value: "RDB_CERTIFICATE", label: "RDB Business Registration Certificate" },
  { value: "FDA_PREMISE_LICENSE", label: "Rwanda FDA Premise License / GMP Certificate" },
  { value: "OCCUPANCY_OR_EIA_REPORT", label: "REMA Environmental Impact Assessment (EIA) / Occupancy Report" },
  { value: "TECHNICIAN_NOTARIZED_DEGREE", label: "Technical Manager Notarized Degree / Qualifications" },
  { value: "TAX_CLEARANCE", label: "RRA Tax Clearance Certificate" },
  { value: "ADDITIONAL", label: "Other Requested Document / Clarification" },
];

/**
 * Keeps accounts pointed at the right place before they can work:
 *  - no organization yet            -> onboarding ("business application")
 *  - registration under review      -> pending status screen
 *  - changes requested by regulator -> action required screen with note +
 *                                      document upload + resubmit button
 *  - registration rejected          -> rejection screen with reason
 *  - approved                       -> the dashboard content
 */
export function OrgGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me } = useMe({ enabled: !DESIGN_MODE });

  useEffect(() => {
    if (DESIGN_MODE || !me) return;
    if (me.mustChangePassword) {
      router.replace("/change-password");
      return;
    }
    if (me.role !== "SYSTEM_ADMIN" && !me.organization) {
      router.replace("/onboarding");
    }
  }, [me, router]);

  const organization = me?.organization ?? null;

  if (DESIGN_MODE || !me) {
    return <>{children}</>;
  }

  if (organization?.onboardingStatus === "PENDING") {
    return <RegistrationStatusScreen organization={organization} status="pending" />;
  }
  if (organization?.onboardingStatus === "UNDER_CONSULTATION") {
    return <RegistrationStatusScreen organization={organization} status="consultation" />;
  }
  if (organization?.onboardingStatus === "CHANGES_REQUESTED") {
    return <RegistrationStatusScreen organization={organization} status="changes" />;
  }
  if (organization?.onboardingStatus === "REJECTED") {
    return <RegistrationStatusScreen organization={organization} status="rejected" />;
  }

  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// Status screen (Full Standalone View)
// ---------------------------------------------------------------------------

export type ScreenStatus = "pending" | "consultation" | "changes" | "rejected";

export function RegistrationStatusScreen({
  organization,
  status,
}: {
  organization: OrganizationResponse;
  status: ScreenStatus;
}) {
  const router = useRouter();
  const logout = useLogout();
  const resubmit = useResubmitRegistration();

  // File upload state for "changes" screen
  const [uploading, setUploading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("RDB_CERTIFICATE");
  const [certNumber, setCertNumber] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Array<{ name: string; type: string }>>([]);
  const [resubmitError, setResubmitError] = useState<string | null>(null);
  const [resubmittedSuccess, setResubmittedSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await onboardingService.uploadDocument(
        organization.id,
        file,
        selectedDocType,
        certNumber.trim() || undefined,
      );
      setUploadedDocs((prev) => [
        ...prev,
        {
          name: file.name,
          type: DOCUMENT_TYPES.find((d) => d.value === selectedDocType)?.label || selectedDocType,
        },
      ]);
      setCertNumber("");
    } catch (err) {
      setUploadError(getApiErrorMessage(err, "Upload failed — try again"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleResubmit = async () => {
    setResubmitError(null);
    try {
      await resubmit.mutateAsync(organization.id);
      setResubmittedSuccess(true);
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err) {
      setResubmitError(getApiErrorMessage(err, "Could not resubmit — try again"));
    }
  };

  const config = {
    pending: {
      icon: <Clock3 className="size-8 text-[#067eda]" strokeWidth={2.2} />,
      iconBg: "bg-sky-50 ring-sky-200",
      badge: "Under Regulatory Review",
      badgeClass: "bg-sky-500/10 text-sky-600 border-sky-500/30",
      title: "Business Application Under Review",
      body: (
        <>
          <span className="font-semibold text-foreground">{organization.name}</span> has been
          submitted and is waiting for screening by the regulatory oversight authority (RSB / Rwanda FDA).
          Dashboard operations will be unlocked once approved.
        </>
      ),
      note: "You will receive an official email confirmation as soon as your application is approved. No further action is required from you at this time.",
    },
    consultation: {
      icon: <AlertCircle className="size-8 text-sky-500" strokeWidth={2.2} />,
      iconBg: "bg-sky-50 ring-sky-200",
      badge: "Multi-Authority Consultation",
      badgeClass: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
      title: "Inter-Agency Screening in Progress",
      body: (
        <>
          <span className="font-semibold text-foreground">{organization.name}</span>&apos;s registration is
          actively undergoing coordinated review across multiple regulatory bodies.
        </>
      ),
      note: "This is standard procedure for cross-cutting industrial operations. You will be notified automatically upon completion.",
    },
    changes: {
      icon: <AlertCircle className="size-8 text-amber-500" strokeWidth={2.2} />,
      iconBg: "bg-amber-50 ring-amber-200",
      badge: "Clarification / Action Required",
      badgeClass: "bg-amber-500/15 text-amber-700 border-amber-500/40",
      title: "Action Required on Your Registration",
      body: (
        <>
          The reviewing authority has inspected <span className="font-semibold text-foreground">{organization.name}</span>&apos;s
          application and requested specific additional documentation or clarifications before granting approval.
        </>
      ),
      note: null,
    },
    rejected: {
      icon: <ShieldX className="size-8 text-red-500" strokeWidth={2.2} />,
      iconBg: "bg-red-50 ring-red-200",
      badge: "Registration Rejected",
      badgeClass: "bg-danger/10 text-danger border-danger/30",
      title: "Application Requires Attention",
      body: (
        <>
          <span className="font-semibold text-foreground">{organization.name}</span> was not approved by the
          supervising authority.
          {organization.rejectionReason ? (
            <span className="block mt-2 font-medium text-foreground bg-destructive/10 p-2.5 rounded border border-destructive/20 text-xs">
              Reason: {organization.rejectionReason}
            </span>
          ) : null}
        </>
      ),
      note: "Review the rejection notes above. You may address the issues and contact regulatory support or submit a new registration.",
    },
  } as const;

  const current = config[status];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-foreground selection:bg-primary/20">
      {/* Top Navbar */}
      <header className="h-16 border-b border-border/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/images/logo-symbol.png" alt="SANTRACK" width={32} height={32} className="size-8" />
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold tracking-tight text-rwanda-blue">SAN</span>
              <span className="text-base font-extrabold tracking-tight text-rwanda-yellow">TRACK</span>
            </div>
            <span className="text-[7px] font-bold tracking-[0.16em] text-slate-400 uppercase">
              Republic of Rwanda
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-0.5", current.badgeClass)}>
            {current.badge}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground gap-1.5"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Main Status Hero Card */}
        <Card className="border-border/80 bg-white shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308]" />
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className={cn("size-16 rounded-2xl flex items-center justify-center shrink-0 ring-1", current.iconBg)}>
                {current.icon}
              </div>
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {current.title}
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {current.body}
                </p>
              </div>
            </div>

            {/* Stepper */}
            <div className="mt-8 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]">Step 1</p>
                  <p className="font-semibold text-foreground">Application Submitted</p>
                </div>
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>

              <div
                className={cn(
                  "p-3 rounded-lg border text-xs flex items-center justify-between",
                  status === "changes"
                    ? "bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/30"
                    : status === "rejected"
                    ? "bg-destructive/10 border-destructive/30 text-destructive"
                    : "bg-primary/10 border-primary/40 text-primary ring-1 ring-primary/30"
                )}
              >
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]">Step 2</p>
                  <p className="font-semibold text-foreground">
                    {status === "changes" ? "Action Required" : "Regulator Screening"}
                  </p>
                </div>
                {status === "changes" ? (
                  <AlertCircle className="size-4 text-amber-600 animate-pulse" />
                ) : (
                  <RefreshCw className="size-4 text-primary animate-spin" />
                )}
              </div>

              <div className="p-3 rounded-lg border border-border bg-muted/30 text-muted-foreground text-xs opacity-60 flex items-center justify-between">
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px]">Step 3</p>
                  <p className="font-semibold text-foreground">Active & Operating</p>
                </div>
                <ShieldCheck className="size-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Changes Requested Interactive Form */}
        {status === "changes" && (
          <Card className="border-amber-500/40 bg-amber-500/[0.02] shadow-sm">
            <CardHeader className="pb-3 border-b border-amber-500/20 bg-amber-500/[0.04]">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm">
                <AlertCircle className="size-4 text-amber-600" />
                <span>Directive from Reviewing Authority (RSB / Rwanda FDA)</span>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {organization.reviewNote ? (
                <div className="rounded-xl border border-amber-300/80 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs">
                  <p className="font-semibold text-amber-900 dark:text-amber-200 uppercase tracking-wide text-[11px] mb-1">
                    What the regulator requires:
                  </p>
                  <p className="text-foreground leading-relaxed text-sm whitespace-pre-line font-medium">
                    {organization.reviewNote}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  The regulator requested additional certificates or adjustments to your submission.
                </p>
              )}

              {/* Upload section */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="size-3.5 text-primary" />
                  Attach Required Verification Documents
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Document Classification</Label>
                    <Select value={selectedDocType} onValueChange={(val) => val && setSelectedDocType(val)}>
                      <SelectTrigger className="h-10 text-xs bg-white">
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_TYPES.map((dt) => (
                          <SelectItem key={dt.value} value={dt.value} className="text-xs">
                            {dt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Certificate Number / ID (Optional)</Label>
                    <Input
                      placeholder="e.g. FDA-PRM-2026-098"
                      value={certNumber}
                      onChange={(e) => setCertNumber(e.target.value)}
                      className="h-10 text-xs bg-white"
                    />
                  </div>
                </div>

                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-primary/40 bg-sky-50/30 hover:bg-sky-50/70 dark:bg-sky-950/10 p-5 text-center transition-all">
                  {uploading ? (
                    <LoaderCircle className="size-6 text-primary animate-spin mb-2" />
                  ) : (
                    <Upload className="size-6 text-primary mb-2" />
                  )}
                  <span className="text-xs font-semibold text-foreground">
                    {uploading ? "Uploading document to secure storage..." : "Click or drag file to attach"}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">
                    PDF, JPEG, PNG or WebP (Max 5 MB)
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    disabled={uploading}
                    onChange={(e) => void handleFileChange(e)}
                  />
                </label>

                {uploadError && (
                  <p className="text-xs text-danger flex items-center gap-1.5 mt-1">
                    <AlertCircle className="size-3.5" />
                    {uploadError}
                  </p>
                )}

                {uploadedDocs.length > 0 && (
                  <div className="space-y-2 mt-3 pt-2">
                    <p className="text-xs font-semibold text-foreground">Documents uploaded in this response:</p>
                    <div className="space-y-1.5">
                      {uploadedDocs.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-white text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <FileCheck className="size-4 text-emerald-600" />
                            <span className="font-medium text-foreground">{doc.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] bg-muted/40">
                            {doc.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resubmit button */}
              <div className="pt-4 border-t border-border/60">
                {resubmittedSuccess ? (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 flex items-center justify-center gap-2 text-xs font-semibold">
                    <CheckCircle2 className="size-4" />
                    Application resubmitted successfully! Reloading review queue...
                  </div>
                ) : (
                  <Button
                    type="button"
                    disabled={resubmit.isPending || uploading}
                    onClick={() => void handleResubmit()}
                    className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] hover:opacity-95 text-white shadow-md gap-2"
                  >
                    {resubmit.isPending ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Transmitting to Regulator...
                      </>
                    ) : (
                      <>
                        <Send className="size-4" />
                        Resubmit Application for Regulatory Approval
                      </>
                    )}
                  </Button>
                )}

                {resubmitError && (
                  <p className="text-xs text-danger text-center mt-2">{resubmitError}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Application details overview card */}
        <Card className="border-border bg-white shadow-xs">
          <CardHeader className="pb-3 border-b border-border/60">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Building2 className="size-4 text-primary" />
              Registered Organization Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-muted-foreground font-medium">Business Name</p>
              <p className="font-semibold text-foreground text-sm mt-0.5">{organization.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Taxpayer ID (TIN)</p>
              <p className="font-mono font-semibold text-foreground text-sm mt-0.5">{organization.tin || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Declared Type</p>
              <p className="font-semibold text-foreground text-sm mt-0.5">{organization.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground font-medium">Location</p>
              <p className="font-semibold text-foreground text-sm mt-0.5">
                {[organization.district, organization.province].filter(Boolean).join(", ") || "Rwanda"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Notice Info Card */}
        {current.note && (
          <div className="p-4 rounded-xl border border-slate-200 bg-white text-xs text-muted-foreground flex items-start gap-3 shadow-xs">
            <MailCheck className="size-4 text-[#067eda] shrink-0 mt-0.5" />
            <p className="leading-relaxed">{current.note}</p>
          </div>
        )}
      </main>
    </div>
  );
}
