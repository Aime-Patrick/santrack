"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock3,
  LoaderCircle,
  MailCheck,
  ShieldX,
  Upload,
} from "lucide-react";
import { useMe } from "@/hooks/auth";
import { useResubmitRegistration } from "@/hooks/organizations";
import { onboardingService } from "@/services/onboarding.service";
import { getApiErrorMessage, type OrganizationResponse } from "@/lib/api";

const DESIGN_MODE = process.env.NEXT_PUBLIC_DESIGN_MODE === "true";

/**
 * Keeps accounts pointed at the right place before they can work:
 *  - no organization yet            -> onboarding ("business application")
 *  - registration under review      -> pending status screen
 *  - changes requested by regulator -> action required screen with note +
 *                                      document upload + resubmit button
 *  - registration rejected          -> rejection screen with reason
 *  - anything else                  -> the dashboard content
 *
 * Design mode skips the check so the flow can be previewed freely.
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
// Status screens
// ---------------------------------------------------------------------------

type ScreenStatus = "pending" | "consultation" | "changes" | "rejected";

function RegistrationStatusScreen({
  organization,
  status,
}: {
  organization: OrganizationResponse;
  status: ScreenStatus;
}) {
  const router = useRouter();
  const resubmit = useResubmitRegistration();

  // File upload state for "changes" screen
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [resubmitError, setResubmitError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      await onboardingService.uploadDocument(organization.id, file, "ADDITIONAL");
      setUploadedCount((n) => n + 1);
    } catch (err) {
      setUploadError(getApiErrorMessage(err, "Upload failed — try again"));
    } finally {
      setUploading(false);
      // Reset so the same file can be re-selected if needed
      e.target.value = "";
    }
  };

  const handleResubmit = async () => {
    setResubmitError(null);
    try {
      await resubmit.mutateAsync(organization.id);
      // After resubmit the status returns to PENDING — router.refresh() causes
      // useMe to re-fetch and OrgGuard will switch to the pending screen.
      router.refresh();
    } catch (err) {
      setResubmitError(getApiErrorMessage(err, "Could not resubmit — try again"));
    }
  };

  const config = {
    pending: {
      icon: <Clock3 className="size-8 text-[#067eda]" strokeWidth={2.2} />,
      iconBg: "bg-sky-50 ring-sky-200",
      title: "Registration under review",
      body: (
        <>
          <span className="font-semibold text-foreground">{organization.name}</span>{" "}
          is submitted and waiting for a regulator to review it. You can work on
          the platform once your registration is approved.
        </>
      ),
      note: "You will receive an email as soon as a decision is made — keep an eye on your inbox.",
    },
    consultation: {
      icon: <AlertCircle className="size-8 text-sky-500" strokeWidth={2.2} />,
      iconBg: "bg-sky-50 ring-sky-200",
      title: "Multi-authority review in progress",
      body: (
        <>
          <span className="font-semibold text-foreground">{organization.name}</span>
          's registration is being actively reviewed. The primary regulator has
          requested input from other regulatory authorities before making a final
          decision.
        </>
      ),
      note: "This is normal for businesses that operate across multiple regulated sectors. You will be notified as soon as a decision is made.",
    },
    changes: {
      icon: <AlertCircle className="size-8 text-amber-500" strokeWidth={2.2} />,
      iconBg: "bg-amber-50 ring-amber-200",
      title: "Changes requested",
      body: (
        <>
          A regulator reviewed{" "}
          <span className="font-semibold text-foreground">{organization.name}</span>
          's registration and needs some corrections before approving it.
        </>
      ),
      note: null,
    },
    rejected: {
      icon: <ShieldX className="size-8 text-red-500" strokeWidth={2.2} />,
      iconBg: "bg-red-50 ring-red-200",
      title: "Registration needs attention",
      body: (
        <>
          <span className="font-semibold text-foreground">{organization.name}</span>{" "}
          was not approved.
          {organization.rejectionReason ? (
            <>
              {" "}Reason:{" "}
              <span className="font-medium text-foreground">
                {organization.rejectionReason}
              </span>
            </>
          ) : null}
        </>
      ),
      note: "Fix the issues above, then reach out to the reviewing regulator or re-register your business.",
    },
  } as const;

  const { icon, iconBg, title, body, note } = config[status];

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-full ring-1 animate-in zoom-in duration-300 ${iconBg}`}
        >
          {icon}
        </div>

        {/* Title + body */}
        <h1 className="mt-6 text-xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {body}
        </p>

        {/* CHANGES_REQUESTED: review note + upload + resubmit */}
        {status === "changes" && (
          <div className="mt-5 space-y-4 text-left">
            {/* Regulator note */}
            {organization.reviewNote && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                  What the regulator needs
                </p>
                <p className="text-sm leading-relaxed text-amber-800">
                  {organization.reviewNote}
                </p>
              </div>
            )}

            {/* Document upload */}
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">
                Upload missing or corrected documents
              </p>
              <p className="text-[11px] text-muted-foreground">
                Add any documents the regulator asked for, then resubmit below.
              </p>
              <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-white px-3.5 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:bg-sky-50/40">
                {uploading ? (
                  <LoaderCircle className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <span>
                  {uploading
                    ? "Uploading…"
                    : uploadedCount > 0
                    ? `${uploadedCount} file${uploadedCount !== 1 ? "s" : ""} uploaded — add more`
                    : "Click to upload a document (pdf, jpg, png — max 5 MB)"}
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
                <p className="text-xs text-danger">{uploadError}</p>
              )}
            </div>

            {/* Resubmit */}
            <button
              type="button"
              disabled={resubmit.isPending}
              onClick={() => void handleResubmit()}
              className="flex w-full items-center justify-center gap-2 h-11 rounded-lg bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308] px-5 text-sm font-semibold text-white transition-all hover:opacity-95 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resubmit.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <MailCheck className="size-4" />
              )}
              {resubmit.isPending ? "Resubmitting…" : "Resubmit for review"}
            </button>
            {resubmitError && (
              <p className="text-xs text-danger text-center">{resubmitError}</p>
            )}
          </div>
        )}

        {/* Generic note (pending / consultation / rejected) */}
        {note && (
          <div
            className={`mx-auto mt-6 w-full space-y-2 rounded-xl border p-4 text-left ${
              status === "rejected"
                ? "border-red-200 bg-red-50"
                : "border-slate-200 bg-muted/40"
            }`}
          >
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 size-4 shrink-0 text-[#067eda]" />
              <p className="text-xs leading-relaxed text-muted-foreground">{note}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.replace("/login")}
          className="mt-6 inline-flex h-11 items-center rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
