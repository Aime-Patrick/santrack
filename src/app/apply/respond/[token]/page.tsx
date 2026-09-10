"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  Paperclip,
  Send,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { api, type InfoRequestField, type PublicInfoRequestView } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { cn } from "@/lib/utils";

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

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A card for one specific requested field.
 * In edit mode: shows the input (rich editor or file upload).
 * In read-only mode: shows what was previously submitted, highlighted as
 * "submitted" (green) or "missing" (amber).
 */
function FieldCard({
  field,
  readOnly,
  previousValue,
  previousFilename,
  richValue,
  onRichChange,
  fileValue,
  onFileChange,
  isFirstFile,
}: {
  field: InfoRequestField;
  readOnly: boolean;
  previousValue?: string;
  previousFilename?: string | null;
  richValue: string;
  onRichChange: (val: string) => void;
  fileValue: File | null;
  onFileChange: (f: File | null) => void;
  isFirstFile: boolean;
}) {
  const hasPrevious =
    field.type === "text"
      ? !!previousValue && stripHtml(previousValue).length > 0
      : !!previousFilename;

  const statusColor = readOnly
    ? hasPrevious
      ? "border-emerald-300 bg-emerald-50/60"
      : "border-amber-300 bg-amber-50/60"
    : "border-border bg-white";

  const statusBadge = readOnly ? (
    hasPrevious ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
        <CheckCircle2 className="size-2.5" />
        Submitted
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
        <AlertCircle className="size-2.5" />
        Not provided
      </span>
    )
  ) : null;

  return (
    <div className={cn("rounded-xl border p-4 space-y-3 transition-colors", statusColor)}>
      {/* Field header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {field.type === "file" ? (
            <Paperclip className="size-3.5 shrink-0 text-primary" />
          ) : (
            <FileText className="size-3.5 shrink-0 text-primary" />
          )}
          <Label className="text-sm font-semibold leading-tight">
            {field.label}
            {field.required && !readOnly && (
              <span className="ml-1 text-danger">*</span>
            )}
          </Label>
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground rounded-full border border-border px-1.5 py-0.5">
            {field.type === "file" ? "Document" : "Text"}
          </span>
        </div>
        {statusBadge}
      </div>

      {/* Content */}
      {field.type === "text" ? (
        readOnly ? (
          hasPrevious && previousValue ? (
            <div
              className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic"
              dangerouslySetInnerHTML={{ __html: previousValue }}
            />
          ) : (
            <p className="text-sm text-muted-foreground italic">No response provided for this field.</p>
          )
        ) : (
          <RichTextEditor
            value={richValue}
            onChange={onRichChange}
            placeholder={`Enter ${field.label.toLowerCase()}…`}
            minHeight={100}
          />
        )
      ) : (
        /* file field */
        readOnly ? (
          hasPrevious && previousFilename ? (
            <div className="flex items-center gap-2.5 rounded-lg bg-white border border-emerald-200 px-3 py-2.5">
              <FileText className="size-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{previousFilename}</span>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">Uploaded</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No file provided for this field.</p>
          )
        ) : (
          <>
            {!isFirstFile && (
              <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                Note: only one file can be included per submission. Please combine multiple documents into a single PDF.
              </p>
            )}
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all select-none",
                fileValue
                  ? "border-emerald-400 bg-emerald-50"
                  : "border-primary/30 bg-sky-50/30 hover:border-primary/60 hover:bg-sky-50/60",
              )}
            >
              {fileValue ? (
                <div className="flex flex-col items-center gap-1">
                  <FileText className="size-7 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-700">{fileValue.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {(fileValue.size / (1024 * 1024)).toFixed(2)} MB · Click to change
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <Upload className="size-7 text-primary/60" />
                  <span className="text-xs font-semibold text-foreground">Upload {field.label}</span>
                  <span className="text-[11px] text-muted-foreground">PDF · JPG · PNG · max 5 MB</span>
                </div>
              )}
              <input
                type="file"
                className="sr-only"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                required={field.required && isFirstFile}
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
            </label>
          </>
        )
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RegistrationRespondPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [view, setView] = useState<PublicInfoRequestView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Per-field rich-text values (keyed by field.key, HTML strings)
  const [richValues, setRichValues] = useState<Record<string, string>>({});
  // Per-file-field values
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({});
  // Free-text (when no specific fields are defined)
  const [freeRich, setFreeRich] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Auto-scroll to first empty required field on submit attempt
  const firstEmptyRef = useRef<HTMLDivElement | null>(null);

  // Load the request metadata
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    api
      .get<PublicInfoRequestView>(`/api/public/registration-response/${token}`, {
        signal: controller.signal,
      })
      .then((r) => {
        setView(r.data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if ((err as { name?: string }).name === "CanceledError") return;
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "This link is invalid or has expired.";
        setLoadError(message);
        setLoading(false);
      });
    return () => controller.abort();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!view) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData();
      const responseData: Record<string, string> = {};

      if (view.requestedFields.length === 0) {
        responseData["response"] = freeRich;
      } else {
        for (const field of view.requestedFields) {
          if (field.type === "text") {
            responseData[field.key] = richValues[field.key] ?? "";
          }
        }
      }

      formData.append("responseData", JSON.stringify(responseData));

      // Only the first file field is attached
      const firstFileField = view.requestedFields.find((f) => f.type === "file");
      if (firstFileField) {
        const file = fileValues[firstFileField.key];
        if (file) formData.append("file", file);
      }

      await api.post(`/api/public/registration-response/${token}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDone(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Submission failed. Please try again.";
      setSubmitError(message);
      firstEmptyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Shared shell ──────────────────────────────────────────────────────────

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-foreground">
      <header className="h-16 border-b border-border/80 bg-white/90 backdrop-blur-md px-4 sm:px-8 flex items-center shadow-xs sticky top-0 z-10">
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
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 pb-16">
        {children}
      </main>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return shell(
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <LoaderCircle className="size-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading your information request…</p>
      </div>,
    );
  }

  // ── Invalid / expired ──────────────────────────────────────────────────────

  if (loadError) {
    return shell(
      <div className="mt-10 rounded-2xl border border-red-200 bg-white shadow-sm p-8 sm:p-10 text-center">
        <div className="flex justify-center mb-5">
          <div className="size-16 rounded-full bg-red-50 ring-1 ring-red-200 flex items-center justify-center">
            <XCircle className="size-8 text-red-500" strokeWidth={2} />
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground">Link Invalid or Expired</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {loadError}
        </p>
        <p className="mt-5 text-xs text-muted-foreground">
          Please contact the regulatory authority that sent you this link for assistance.
        </p>
      </div>,
    );
  }

  // ── Just-submitted success ─────────────────────────────────────────────────

  if (done) {
    return shell(
      <div className="mt-10 rounded-2xl border border-emerald-200 bg-white shadow-sm p-8 sm:p-10 text-center">
        <div className="flex justify-center mb-5">
          <div className="size-16 rounded-full bg-emerald-50 ring-1 ring-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-emerald-500" strokeWidth={2} />
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground">Response Submitted</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Thank you. Your response has been recorded and the regulatory authority has been notified.
          They will review your submission and follow up by email.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left max-w-sm mx-auto">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs text-slate-600">
              No further action is required from you at this time. You will receive an email once a
              decision is made on your registration.
            </p>
          </div>
        </div>
      </div>,
    );
  }

  if (!view) return null;

  const isReadOnly = view.readOnly;
  const hasSpecificFields = view.requestedFields.length > 0;
  const textFields = view.requestedFields.filter((f) => f.type === "text");
  const fileFields = view.requestedFields.filter((f) => f.type === "file");
  let fileFieldIndex = 0;

  // Completion summary for read-only view
  const totalFields = view.requestedFields.length;
  const respondedFields = view.requestedFields.filter((f) => {
    if (f.type === "text") {
      const v = view.responseData?.[f.key] ?? "";
      return stripHtml(v).length > 0;
    }
    return !!view.responseAttachmentFilename;
  }).length;

  return shell(
    <div className="mt-6 space-y-5">
      {/* ── Status banner (read-only mode) ───────────────────────────────── */}
      {isReadOnly && (
        <div className={cn(
          "rounded-xl border p-4 flex items-start gap-3",
          respondedFields === totalFields || totalFields === 0
            ? "border-emerald-300 bg-emerald-50"
            : "border-amber-300 bg-amber-50",
        )}>
          {respondedFields === totalFields || totalFields === 0 ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
          )}
          <div>
            <p className={cn(
              "text-sm font-semibold",
              respondedFields === totalFields || totalFields === 0 ? "text-emerald-800" : "text-amber-800",
            )}>
              {isReadOnly && totalFields > 0
                ? `${respondedFields} of ${totalFields} field${totalFields !== 1 ? "s" : ""} provided`
                : "Response submitted"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Responded on {view.respondedAt ? formatDate(view.respondedAt) : "—"} ·
              {respondedFields < totalFields && totalFields > 0
                ? " Some fields were not filled in. The regulator may send a new request."
                : " Your submission has been received."}
            </p>
          </div>
        </div>
      )}

      {/* ── Header card ──────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/80 bg-white shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0066d6] via-[#10b981] via-60% to-[#eab308]" />
        <div className="p-6 sm:p-7">

          {/* Title row */}
          <div className="flex items-start gap-4">
            <div className={cn(
              "size-12 rounded-xl flex items-center justify-center shrink-0 ring-1",
              isReadOnly
                ? "bg-emerald-50 ring-emerald-200"
                : "bg-amber-50 ring-amber-200",
            )}>
              {isReadOnly
                ? <CheckCircle2 className="size-6 text-emerald-600" strokeWidth={2} />
                : <AlertCircle className="size-6 text-amber-600" strokeWidth={2} />
              }
            </div>
            <div>
              <div className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold mb-1.5",
                isReadOnly ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
              )}>
                {isReadOnly ? "Response recorded" : "Additional information required"}
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight">
                {view.organizationName}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Clock3 className="size-3.5 shrink-0" />
                {isReadOnly
                  ? `Responded on ${view.respondedAt ? formatDate(view.respondedAt) : "—"}`
                  : <>Link expires on <span className="font-medium text-foreground ml-1">{formatDate(view.expiresAt)}</span></>
                }
              </p>
            </div>
          </div>

          {/* The regulator's request message */}
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800 mb-2">
              What the regulatory authority requested
            </p>
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
              {view.requestMessage}
            </p>
          </div>

          {/* Field summary chips */}
          {view.requestedFields.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {view.requestedFields.map((f) => {
                const provided = f.type === "text"
                  ? !!view.responseData?.[f.key] && stripHtml(view.responseData[f.key]).length > 0
                  : !!view.responseAttachmentFilename;
                const showStatus = isReadOnly;
                return (
                  <span
                    key={f.key}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      showStatus
                        ? provided
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {showStatus && (provided
                      ? <CheckCircle2 className="size-2.5" />
                      : <AlertCircle className="size-2.5" />
                    )}
                    {f.label}
                    {f.required && !showStatus && <span className="text-danger">*</span>}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Response form / read-only view ───────────────────────────────── */}
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl border border-border/80 bg-white shadow-sm overflow-hidden"
      >
        <div className="px-6 sm:px-7 py-5 border-b border-border/70 flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            {isReadOnly ? "Your submitted response" : "Provide your response"}
          </h2>
          {isReadOnly && (
            <span className="text-xs text-muted-foreground italic">Read-only</span>
          )}
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          {/* Free-text fallback */}
          {!hasSpecificFields && (
            <div className={cn(
              "rounded-xl border p-4",
              isReadOnly
                ? view.responseData?.["response"]
                  ? "border-emerald-300 bg-emerald-50/50"
                  : "border-amber-300 bg-amber-50/50"
                : "border-border",
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Label className="text-sm font-semibold">
                  Your response
                  {!isReadOnly && <span className="text-danger ml-1">*</span>}
                </Label>
                {isReadOnly && (
                  view.responseData?.["response"]
                    ? <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"><CheckCircle2 className="size-2.5" />Submitted</span>
                    : <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700"><AlertCircle className="size-2.5" />Not provided</span>
                )}
              </div>
              {isReadOnly ? (
                view.responseData?.["response"] ? (
                  <div
                    className="prose prose-sm max-w-none text-sm text-foreground leading-relaxed [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-sm [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic"
                    dangerouslySetInnerHTML={{ __html: view.responseData["response"] }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground italic">No response provided.</p>
                )
              ) : (
                <RichTextEditor
                  value={freeRich}
                  onChange={setFreeRich}
                  placeholder="Describe the information, provide clarifications, or reference where documents have been uploaded."
                  minHeight={160}
                />
              )}
            </div>
          )}

          {/* Specific text fields */}
          {textFields.map((field) => (
            <FieldCard
              key={field.key}
              field={field}
              readOnly={isReadOnly}
              previousValue={view.responseData?.[field.key]}
              richValue={richValues[field.key] ?? ""}
              onRichChange={(val) => setRichValues((prev) => ({ ...prev, [field.key]: val }))}
              fileValue={null}
              onFileChange={() => undefined}
              isFirstFile={false}
            />
          ))}

          {/* Specific file fields */}
          {fileFields.map((field) => {
            const idx = fileFieldIndex++;
            return (
              <FieldCard
                key={field.key}
                field={field}
                readOnly={isReadOnly}
                previousFilename={idx === 0 ? view.responseAttachmentFilename : null}
                richValue=""
                onRichChange={() => undefined}
                fileValue={fileValues[field.key] ?? null}
                onFileChange={(f) => setFileValues((prev) => ({ ...prev, [field.key]: f }))}
                isFirstFile={idx === 0}
              />
            );
          })}

          {/* Submit error */}
          {submitError && (
            <div ref={firstEmptyRef} className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-danger flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-danger" />
              {submitError}
            </div>
          )}

          {/* Actions */}
          {!isReadOnly && (
            <div className="pt-2 space-y-3">
              <Button
                type="submit"
                disabled={submitting || (!hasSpecificFields && !stripHtml(freeRich))}
                className="w-full h-11 font-semibold text-sm"
              >
                {submitting ? (
                  <LoaderCircle className="mr-2 size-4 animate-spin" />
                ) : (
                  <Send className="mr-2 size-4" />
                )}
                {submitting ? "Submitting…" : "Submit response to regulator"}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                By submitting, you confirm the information is accurate.
                This link can only be used once — you will not be able to edit your response afterwards.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>,
  );
}
