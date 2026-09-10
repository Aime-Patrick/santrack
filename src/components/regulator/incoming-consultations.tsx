"use client";

import { useState } from "react";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageSquare,
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
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { getApiErrorMessage, type RegistrationConsultation, type ConsultationVerdict } from "@/lib/api";
import {
  useIncomingConsultations,
  useRespondConsultation,
} from "@/hooks/organizations";
import { cn } from "@/lib/utils";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

const VERDICT_OPTIONS: { value: ConsultationVerdict; label: string; description: string; className: string }[] = [
  {
    value: "APPROVED",
    label: "Approved",
    description: "No issues found — we are satisfied with this application.",
    className: "border-green-300 bg-green-50 text-green-800 ring-green-400",
  },
  {
    value: "CONCERNS",
    label: "Concerns noted",
    description: "Issues noted but not blocking — the primary regulator should be aware.",
    className: "border-amber-300 bg-amber-50 text-amber-800 ring-amber-400",
  },
  {
    value: "OBJECTION",
    label: "Objection",
    description: "Blocking issue — we object to this registration proceeding as-is.",
    className: "border-red-300 bg-red-50 text-red-800 ring-red-400",
  },
];

/**
 * Incoming consultation requests for the secondary authority (those addressed
 * to the caller's authority). Hidden when the inbox is empty.
 */
export function IncomingConsultations() {
  const { data = [], isLoading } = useIncomingConsultations();
  const [responding, setResponding] = useState<RegistrationConsultation | null>(null);

  if (!isLoading && data.length === 0) return null;

  const overdueCount = data.filter((c) => c.overdue || c.status === "OVERDUE").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4">
        <div>
          <CardTitle className="text-base">Registration consultations</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Other authorities have asked for your input on these applications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{data.length} pending</Badge>
          {overdueCount > 0 && (
            <Badge variant="outline" className="border-red-300 text-red-700">
              {overdueCount} overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Checking consultation inbox…
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead>Applicant</TableHead>
                <TableHead>From authority</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Received · Due</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          c.overdue || c.status === "OVERDUE"
                            ? "bg-red-100 text-red-600"
                            : "bg-sky-100 text-sky-700",
                        )}
                      >
                        {c.overdue || c.status === "OVERDUE" ? (
                          <AlertCircle className="size-3.5" />
                        ) : (
                          <MessageSquare className="size-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {c.organization?.name ?? "Unknown applicant"}
                        </p>
                        {(c.overdue || c.status === "OVERDUE") && (
                          <Badge variant="outline" className="border-red-300 text-red-700 text-[10px]">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {c.fromAuthority?.name ?? "Unknown"}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.subject}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</p>
                    {c.dueDate && (
                      <p className="text-xs text-muted-foreground">due {formatDate(c.dueDate)}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setResponding(c)}
                    >
                      Respond
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {responding && (
        <RespondDialog
          consultation={responding}
          onClose={() => setResponding(null)}
        />
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Respond dialog
// ---------------------------------------------------------------------------

function RespondDialog({
  consultation: c,
  onClose,
}: {
  consultation: RegistrationConsultation;
  onClose: () => void;
}) {
  const respond = useRespondConsultation();
  const [verdict, setVerdict] = useState<ConsultationVerdict | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!verdict) return;
    setError(null);
    try {
      await respond.mutateAsync({
        consultationId: c.id,
        input: { verdict, responseNote: note.trim() || undefined },
      });
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
              <Building2 className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {c.organization?.name ?? "Applicant"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Consultation from {c.fromAuthority?.name} · received{" "}
                {formatDate(c.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* Subject + context */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">{c.subject}</p>
            {c.contextNote && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {c.contextNote}
              </p>
            )}
            {c.forwardedDocumentIds && c.forwardedDocumentIds.length > 0 && (
              <p className="text-[11px] text-muted-foreground">
                {c.forwardedDocumentIds.length} document
                {c.forwardedDocumentIds.length !== 1 ? "s" : ""} forwarded for your review
              </p>
            )}
          </div>

          {/* Verdict selection */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Your verdict *</Label>
            <div className="space-y-2">
              {VERDICT_OPTIONS.map((opt) => {
                const selected = verdict === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVerdict(opt.value)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-all cursor-pointer",
                      selected
                        ? `${opt.className} ring-1`
                        : "border-slate-200 bg-white hover:border-slate-300",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {opt.value === "APPROVED" && (
                        <CheckCircle2 className={cn("size-4 shrink-0", selected ? "text-green-700" : "text-muted-foreground")} />
                      )}
                      {opt.value === "CONCERNS" && (
                        <AlertCircle className={cn("size-4 shrink-0", selected ? "text-amber-700" : "text-muted-foreground")} />
                      )}
                      {opt.value === "OBJECTION" && (
                        <XSquare className={cn("size-4 shrink-0", selected ? "text-red-700" : "text-muted-foreground")} />
                      )}
                      <span className="text-sm font-semibold">{opt.label}</span>
                    </div>
                    <p className="mt-0.5 ml-6 text-[11px] text-muted-foreground">
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Response note — rich text for substantive authority responses */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Response notes
              {verdict === "CONCERNS" || verdict === "OBJECTION" ? " *" : " (optional)"}
            </Label>
            <RichTextEditor
              value={note}
              onChange={setNote}
              placeholder={
                verdict === "OBJECTION"
                  ? "Describe the blocking issue and what must be resolved…"
                  : verdict === "CONCERNS"
                  ? "Describe the concerns and any conditions you recommend…"
                  : "Any additional notes for the primary regulator…"
              }
              minHeight={80}
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
            disabled={
              !verdict ||
              respond.isPending ||
              ((verdict === "CONCERNS" || verdict === "OBJECTION") && !note.trim())
            }
            onClick={() => void handleSubmit()}
            className={cn(
              verdict === "OBJECTION" && "bg-danger hover:bg-danger/90",
              verdict === "CONCERNS" && "bg-amber-500 hover:bg-amber-600",
            )}
          >
            {respond.isPending ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : null}
            {respond.isPending ? "Submitting…" : "Submit response"}
          </Button>
        </div>
      </div>
    </div>
  );
}
