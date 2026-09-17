"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Mail,
  Paperclip,
  Send,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";
import { licenseService } from "@/services/license.service";
import type { PublicFollowUpView } from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** Strip HTML tags for plain-text preview */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  CRITICAL: "Critical",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-300",
  HIGH: "bg-amber-100 text-amber-700 border-amber-300",
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function LicenseFollowUpResponsePage() {
  const { token } = useParams<{ token: string }>();

  const [view, setView] = useState<PublicFollowUpView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [richResponse, setRichResponse] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // ------------------------------------------------------------------
  // Load condition from token
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!token) return;

    (async () => {
      try {
        const data = await licenseService.getPublicFollowUp(token);
        setView(data);
        // Pre-fill if previously submitted (read-only)
        if (data.readOnly && data.businessResponse) {
          setRichResponse(data.businessResponse);
        }
      } catch (err: any) {
        setLoadError(
          err?.response?.data?.message ||
            "This link is invalid, expired, or has already been used."
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // ------------------------------------------------------------------
  // File helpers
  // ------------------------------------------------------------------
  const handleFile = (f: File) => {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) {
      setSubmitError("Only PDF, JPEG, PNG, or WebP files are accepted.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setSubmitError("File exceeds the 5 MB limit.");
      return;
    }
    setSubmitError(null);
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  // ------------------------------------------------------------------
  // Submit
  // ------------------------------------------------------------------
  const handleSubmit = async () => {
    if (!view) return;
    const plain = stripHtml(richResponse).trim();
    if (!plain && !file) {
      setSubmitError("Please provide a response or upload a document.");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      await licenseService.respondToFollowUp(token, richResponse, file ?? undefined);
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(
        err?.response?.data?.message || err.message || "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ------------------------------------------------------------------
  // Render states
  // ------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span className="text-sm">Loading your request…</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16 gap-4 text-center">
        <XCircle className="h-14 w-14 text-danger/70" />
        <h2 className="text-xl font-semibold text-foreground">Link Unavailable</h2>
        <p className="text-sm text-muted-foreground max-w-sm">{loadError}</p>
        <p className="text-xs text-muted-foreground">
          If you believe this is an error, contact your regulatory officer for a new link.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-16 gap-4 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        <h2 className="text-xl font-semibold text-foreground">Response Submitted</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your response to the compliance condition has been recorded. The regulatory officer
          will review it and contact you with any further steps.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          You may now close this window.
        </p>
      </div>
    );
  }

  if (!view) return null;

  const isReadOnly = view.readOnly;
  const hasSubmitted = isReadOnly && !!view.businessResponse;
  const priorityLabel = PRIORITY_LABELS[view.priority] ?? view.priority;
  const priorityColor = PRIORITY_COLORS[view.priority] ?? "bg-muted text-muted-foreground border-border";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <ShieldCheck className="h-7 w-7 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground leading-tight truncate">
              SANTRACK — Compliance Condition Response
            </p>
            <p className="text-[13px] text-muted-foreground leading-tight truncate">
              Licence: <span className="font-medium text-foreground">{view.licenseNumber}</span>
              {" · "}
              {view.organizationName}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Read-only banner */}
        {isReadOnly && (
          <div
            className={cn(
              "rounded-lg border p-4 flex items-start gap-3",
              hasSubmitted
                ? "border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20"
                : "border-amber-300 bg-amber-50/60 dark:bg-amber-950/20"
            )}
          >
            {hasSubmitted ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              {hasSubmitted ? (
                <>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                    Response already submitted
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-500 mt-0.5">
                    {view.actionedAt
                      ? `Submitted on ${formatDate(view.actionedAt)}.`
                      : "Your response has been recorded."}{" "}
                    No further action is required.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-amber-700 dark:text-amber-400">
                    This link is no longer active
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-500 mt-0.5">
                    The condition is closed or this link has expired. Contact your regulatory
                    officer if you still need to submit.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Condition card */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30 flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold text-sm text-foreground">{view.title}</h2>
                <span
                  className={cn(
                    "text-[13px] font-medium px-2 py-0.5 rounded-full border",
                    priorityColor
                  )}
                >
                  {priorityLabel}
                </span>
              </div>
              {view.dueDate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  Compliance deadline: <strong className="text-foreground">{view.dueDate}</strong>
                </p>
              )}
              {view.responseTokenExpiresAt && !isReadOnly && (
                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Clock3 className="h-3 w-3" />
                  Response link expires on{" "}
                  <strong>{formatDate(view.responseTokenExpiresAt)}</strong>
                </p>
              )}
            </div>
            <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          </div>

          <div className="px-5 py-4 text-sm text-foreground/80 whitespace-pre-line leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: view.description }} />
          </div>
        </div>

        {/* Response section */}
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <h3 className="font-semibold text-sm text-foreground">
              {isReadOnly ? "Your Submitted Response" : "Submit Your Response"}
            </h3>
            {!isReadOnly && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Provide a written explanation and / or upload supporting documents.
              </p>
            )}
          </div>

          <div className="px-5 py-5 space-y-5">
            {/* Rich text response */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Written Response{" "}
                {!isReadOnly && (
                  <span className="text-muted-foreground font-normal">(required if no document)</span>
                )}
              </Label>

              {isReadOnly ? (
                hasSubmitted && view.businessResponse ? (
                  <div
                    className={cn(
                      "rounded-lg border p-3 text-sm leading-relaxed",
                      "border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/10"
                    )}
                  >
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: view.businessResponse }}
                    />
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 p-3 text-xs italic text-amber-700 dark:text-amber-400">
                    No written response was submitted.
                  </div>
                )
              ) : (
                <RichTextEditor
                  value={richResponse}
                  onChange={setRichResponse}
                  placeholder="Describe the corrective actions taken, reference any standards met, and explain how you have addressed the condition stated above…"
                />
              )}
            </div>

            {/* File upload */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">
                Supporting Document{" "}
                {!isReadOnly && (
                  <span className="text-muted-foreground font-normal">
                    (optional — PDF, JPEG, PNG, WebP, max 5 MB)
                  </span>
                )}
              </Label>

              {isReadOnly ? (
                hasSubmitted && view.evidenceFilename ? (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 dark:bg-emerald-950/10 px-3 py-2.5">
                    <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span className="text-sm text-foreground font-medium truncate">
                      {view.evidenceFilename}
                    </span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 ml-auto" />
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50/40 dark:bg-amber-950/10 p-3 text-xs italic text-amber-700 dark:text-amber-400">
                    No document was uploaded.
                  </div>
                )
              ) : (
                <div
                  className={cn(
                    "relative rounded-lg border-2 border-dashed transition-colors cursor-pointer",
                    dragOver
                      ? "border-primary bg-primary/5"
                      : file
                      ? "border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10"
                      : "border-border hover:border-primary/50"
                  )}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    {file ? (
                      <>
                        <Paperclip className="h-8 w-8 text-emerald-500" />
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(0)} KB —{" "}
                          <span
                            className="text-primary underline cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); setFile(null); }}
                          >
                            remove
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground/60" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, JPEG, PNG or WebP — up to 5 MB</p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {submitError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm text-danger">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Submit button */}
            {!isReadOnly && (
              <div className="pt-1">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="gap-2 bg-primary text-primary-foreground"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Response
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-muted-foreground pb-8">
          This is a one-time secure link tied to licence{" "}
          <strong>{view.licenseNumber}</strong>. Do not share this URL with others.
        </p>
      </main>
    </div>
  );
}
