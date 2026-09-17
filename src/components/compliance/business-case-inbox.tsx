"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  CircleDotDashed,
  Clock,
  Download,
  FileText,
  Landmark,
  LoaderCircle,
  Paperclip,
  Send,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useMyRegulatoryCase,
  useMyRegulatoryCases,
  useSubmitCaseEvidence,
} from "@/hooks/regulatory-cases";
import { regulatoryCaseService, type BusinessRegulatoryCase, type RegulatoryCaseStatus } from "@/services/regulatory-case.service";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_LABEL: Record<RegulatoryCaseStatus, string> = {
  OPEN: "New",
  IN_PROGRESS: "In progress",
  AWAITING_BUSINESS: "Corrective action requested",
  ESCALATED: "Escalated",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

/** Solid chips — white text on every status. No translucent backgrounds. */
const STATUS_TONE: Record<RegulatoryCaseStatus, string> = {
  OPEN: "border-transparent bg-amber-500 text-white",
  IN_PROGRESS: "border-transparent bg-blue-600 text-white",
  AWAITING_BUSINESS: "border-transparent bg-amber-600 text-white",
  ESCALATED: "border-transparent bg-danger text-white",
  RESOLVED: "border-transparent bg-emerald-600 text-white",
  CLOSED: "border-transparent bg-slate-500 text-white",
};

const PRIORITY_TONE: Record<BusinessRegulatoryCase["priority"], string> = {
  LOW: "text-muted-foreground",
  NORMAL: "text-foreground",
  HIGH: "text-warning-foreground",
  CRITICAL: "text-danger",
};

function dueLabel(dueOn: string | null) {
  if (!dueOn) return "No due date";
  const days = Math.ceil((new Date(`${dueOn}T00:00:00`).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days}d`;
}

/**
 * The corrective-action inbox for the business a case is opened against.
 *
 * Regulators open cases from their workspace; this is the other half of the
 * loop. A case in AWAITING_BUSINESS is a regulator telling this organisation,
 * in so many words, to fix something and prove it — and that request has not
 * been received until it appears here.
 */
export function BusinessCaseInbox() {
  const { data: cases = [], isLoading } = useMyRegulatoryCases();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4">
          <div>
            <CardTitle className="text-base">Regulatory cases against this business</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Every case the regulator opened on this organisation, and what it is waiting on from you.
            </p>
          </div>
          <Badge variant="outline" className="border-transparent bg-blue-600 text-white">
            {cases.length} total
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 className="mx-auto size-7 text-success" />
              <p className="mt-3 text-sm font-medium">No regulatory cases</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nothing has been opened against this organisation. If a regulator inspects or recalls and raises a case, it will appear here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {cases.map((caseRecord) => (
                <button
                  key={caseRecord.id}
                  type="button"
                  onClick={() => setSelectedId(caseRecord.id)}
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/40"
                >
                  <CircleDotDashed className={cn("size-4 shrink-0", PRIORITY_TONE[caseRecord.priority])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{caseRecord.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {caseRecord.caseNumber ?? `Case #${caseRecord.id}`} · {caseRecord.leadAuthority?.name ?? "Regulator"}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <p className={cn("text-xs font-medium", dueLabel(caseRecord.dueOn).includes("overdue") && "text-danger")}>
                      {dueLabel(caseRecord.dueOn)}
                    </p>
                    <Badge className={cn("mt-0.5 border-transparent", STATUS_TONE[caseRecord.status])}>
                      {STATUS_LABEL[caseRecord.status]}
                    </Badge>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CaseSheet
        key={selectedId ?? "empty"}
        caseId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </>
  );
}

function CaseSheet({
  caseId,
  onOpenChange,
}: {
  caseId: number | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: caseRecord, isLoading } = useMyRegulatoryCase(caseId);
  const submitEvidence = useSubmitCaseEvidence();
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");

  const awaitingResponse =
    caseRecord?.status === "AWAITING_BUSINESS" ||
    caseRecord?.status === "OPEN" ||
    caseRecord?.status === "IN_PROGRESS" ||
    caseRecord?.status === "ESCALATED";

  const onOpenChangeSafe = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      setFile(null);
      setNote("");
    }
  };

  const submit = () => {
    if (!caseRecord) return;
    if (!file) {
      toast.error("Attach a file (PDF or image) as corrective-action evidence.");
      return;
    }
    submitEvidence.mutate(
      { caseId: caseRecord.id, file, note: note || undefined },
      {
        onSuccess: () => {
          setFile(null);
          setNote("");
          toast.success("Corrective-action evidence submitted. The regulator has been notified.");
        },
        onError: (error) => {
          toast.error(error instanceof Error ? error.message : "Could not submit evidence.");
        },
      },
    );
  };

  return (
    <Sheet open={caseId !== null} onOpenChange={onOpenChangeSafe}>
      <SheetContent className="w-full gap-0 overflow-y-auto p-0 data-[side=right]:sm:max-w-3xl">
        {isLoading || !caseRecord ? (
          <div className="flex justify-center py-16">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border/70 p-6 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <SheetTitle className="text-lg">{caseRecord.title}</SheetTitle>
                  <SheetDescription className="mt-1">
                    {caseRecord.caseNumber ?? `Case #${caseRecord.id}`}
                  </SheetDescription>
                </div>
                <Badge className={cn("border-transparent shrink-0", STATUS_TONE[caseRecord.status])}>
                  {STATUS_LABEL[caseRecord.status]}
                </Badge>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {caseRecord.description && (
                <div className="rounded-xl border border-border/80 bg-muted/30 p-4">
                  <p className="text-sm leading-relaxed text-foreground">{caseRecord.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <InfoChip icon={<Landmark className="size-3.5" />} label="Authority" value={caseRecord.leadAuthority?.name ?? "—"} />
                <InfoChip icon={<Clock className="size-3.5" />} label="Deadline" value={dueLabel(caseRecord.dueOn)} />
                <InfoChip icon={<AlertTriangle className="size-3.5" />} label="Priority" value={caseRecord.priority.toLowerCase()} />
                <InfoChip icon={<Building2 className="size-3.5" />} label="Officer" value={caseRecord.assignedTo?.name ?? "Unassigned"} />
              </div>

              {caseRecord.facility && (
                <div className="text-xs text-muted-foreground">
                  Facility: <span className="font-medium text-foreground">{caseRecord.facility.name}</span>
                </div>
              )}
              {caseRecord.license && (
                <div className="text-xs text-muted-foreground">
                  Licence: <span className="font-medium text-foreground">{caseRecord.license.licenseNumber}</span>
                </div>
              )}
              {caseRecord.batch && (
                <div className="text-xs text-muted-foreground">
                  Batch: <span className="font-medium text-foreground">{caseRecord.batch.batchCode}</span>
                </div>
              )}

              {/* Respond */}
              {awaitingResponse ? (
                <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2">
                    <Send className="size-4 text-warning-foreground" />
                    <p className="text-sm font-semibold">Submit corrective action</p>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Attach proof that the issue is fixed — a corrective-action report, a certificate, or photos.
                    PDFs and images up to 10MB. The assigned officer is notified the moment it lands.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="evidence-file" className="text-xs font-medium text-muted-foreground">
                      Evidence file
                    </Label>
                    <label
                      htmlFor="evidence-file"
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm transition-colors hover:border-primary/50"
                    >
                      <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">
                        {file ? file.name : "Choose a PDF or image…"}
                      </span>
                      <Upload className="size-4 shrink-0 text-muted-foreground" />
                    </label>
                    <input
                      id="evidence-file"
                      type="file"
                      className="hidden"
                      accept="application/pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evidence-note" className="text-xs font-medium text-muted-foreground">
                      What you did (optional)
                    </Label>
                    <Textarea
                      id="evidence-note"
                      rows={3}
                      placeholder="e.g. Corrective action completed on 12 Sep — recalibrated the line and retrained staff."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full"
                    disabled={submitEvidence.isPending}
                    onClick={submit}
                  >
                    {submitEvidence.isPending ? (
                      <LoaderCircle className="mr-1.5 size-4 animate-spin" />
                    ) : (
                      <Send className="mr-1.5 size-4" />
                    )}
                    Submit evidence
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-success/40 bg-success/5 p-4">
                  <CheckCircle2 className="size-4 text-success" />
                  <p className="text-sm">
                    {caseRecord.status === "RESOLVED" || caseRecord.status === "CLOSED"
                      ? "This case has been decided. No response is needed."
                      : "This case is not currently waiting on the business."}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  What happened
                </p>
                <div className="space-y-0">
                  {caseRecord.events.length === 0 ? (
                    <p className="py-4 text-center text-sm text-muted-foreground">No events recorded yet.</p>
                  ) : (
                    caseRecord.events.map((event, index) => (
                      <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                        {index < caseRecord.events.length - 1 && (
                          <span className="absolute left-[5px] top-3 h-full w-px bg-border" aria-hidden />
                        )}
                        <span className="relative mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-background bg-primary ring-1 ring-border" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{event.summary}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {event.actor} · {new Date(event.recordedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Evidence */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Evidence on file
                </p>
                {caseRecord.evidence.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border py-4 text-center text-sm text-muted-foreground">
                    Nothing submitted yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {caseRecord.evidence.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="flex items-center gap-3 rounded-lg border border-border/80 px-3 py-2.5"
                      >
                        <FileText className="size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{evidence.filename}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {evidence.submittedBy.name} · {new Date(evidence.submittedAt).toLocaleString()}
                            {evidence.note ? ` · ${evidence.note}` : ""}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          aria-label={`Download ${evidence.filename}`}
                          onClick={() => regulatoryCaseService.downloadMyEvidence(caseRecord.id, evidence.id, evidence.filename)}
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoChip({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 px-3 py-2">
      <p className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
