"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, CircleDotDashed, Download, Factory, FileBadge, FileDown, LoaderCircle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAssignRegulatoryCase, useAssignRegulatoryCaseTeam, useCaseInspections, useChangeRegulatoryCaseStatus, useRecordRegulatoryInspection, useRegulatoryCase, useRegulatoryCases, useRegulatoryOfficers } from "@/hooks/regulatory-cases";
import { regulatoryCaseService, type RegulatoryCase, type RegulatoryCaseStatus, type RegulatoryInspectionResult } from "@/services/regulatory-case.service";
import { cn } from "@/lib/utils";
import { useActiveAuthorityTeams, useMyRegulatoryAuthority, useRegulatoryAuthorities } from "@/hooks/regulatory-authorities";
import { useReferRegulatoryCase } from "@/hooks/regulatory-referrals";
import { AccountabilityLedger } from "@/components/regulator/accountability-ledger";
import { InspectionPlanner } from "@/components/regulator/inspection-planner";
import { useBatchTimeline, useCaseTimeline, useFacilityTimeline, useLicenceTimeline, useOrganizationTimeline } from "@/hooks/accountability";

/** Subject of the linked-records timeline shown inside a case sheet. */
type LedgerSubject = "case" | "organisation" | "facility" | "licence" | "batch";

const SUBJECT_ICON: Record<LedgerSubject, React.ComponentType<{ className?: string }>> = {
  case: CircleDotDashed,
  organisation: Building2,
  facility: Factory,
  licence: FileBadge,
  batch: Package,
};

const STATUS_LABEL: Record<RegulatoryCaseStatus, string> = {
  OPEN: "New", IN_PROGRESS: "In progress", AWAITING_BUSINESS: "Waiting on business",
  ESCALATED: "Escalated", RESOLVED: "Ready to close", CLOSED: "Closed",
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

const PRIORITY_TONE: Record<RegulatoryCase["priority"], string> = {
  LOW: "text-muted-foreground", NORMAL: "text-foreground", HIGH: "text-warning-foreground", CRITICAL: "text-danger",
};

function dueLabel(dueOn: string | null) {
  if (!dueOn) return "No due date";
  const days = Math.ceil((new Date(`${dueOn}T00:00:00`).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Due today";
  return `Due in ${days}d`;
}

export function CaseWorkQueue() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [scope, setScope] = useState<"all" | "mine" | "team">("all");
  const { data: cases = [], isLoading } = useRegulatoryCases(undefined, scope);
  const caseFromUrl = Number(searchParams.get("case")) || null;
  const [selectedId, setSelectedId] = useState<number | null>(caseFromUrl);
  const activeCases = cases.filter((caseRecord) => caseRecord.status !== "CLOSED");

  function openCase(id: number) {
    setSelectedId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "enforcement");
    params.set("case", String(id));
    router.replace(`/dashboard/regulator?${params.toString()}`, { scroll: false });
  }

  useEffect(() => {
    if (caseFromUrl) setSelectedId(caseFromUrl);
  }, [caseFromUrl]);

  useEffect(() => {
    const open = (event: Event) => openCase((event as CustomEvent<number>).detail);
    window.addEventListener("santrack:open-case", open);
    return () => window.removeEventListener("santrack:open-case", open);
  }, [searchParams, router]);

  function closeSheet() {
    setSelectedId(null);
    if (!searchParams.get("case")) return;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("case");
    const qs = params.toString();
    router.replace(qs ? `/dashboard/regulator?${qs}` : "/dashboard/regulator", { scroll: false });
  }

  return (
    <div className="space-y-5">
      <InspectionPlanner onOpenCase={openCase} />
      <Card className="overflow-hidden">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border/70 py-4">
          <div>
            <CardTitle className="text-base">Casework</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Only work that needs an accountable decision.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border/80 bg-muted/40 p-0.5">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "mine", label: "My queue" },
                  { id: "team", label: "My team" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScope(tab.id)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    scope === tab.id
                      ? "bg-white text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Badge variant="outline" className="border-transparent bg-blue-600 text-white">
              {activeCases.length} active
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>
          ) : activeCases.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <CheckCircle2 className="mx-auto size-7 text-success" />
              <p className="mt-3 text-sm font-medium">No active cases</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {scope === "mine"
                  ? "Nothing assigned to you right now."
                  : scope === "team"
                    ? "No cases on your teams yet. Join a team in Authority setup."
                    : "New findings, inspections, and recalls will appear here when they need ownership."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead>Case</TableHead>
                  <TableHead>Organisation</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeCases.slice(0, 20).map((caseRecord) => (
                  <TableRow
                    key={caseRecord.id}
                    className="cursor-pointer"
                    onClick={() => openCase(caseRecord.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CircleDotDashed className={cn("size-3.5 shrink-0", PRIORITY_TONE[caseRecord.priority])} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{caseRecord.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{caseRecord.caseNumber}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{caseRecord.organization.name}</TableCell>
                    <TableCell>
                      <span className={cn("text-xs font-medium", dueLabel(caseRecord.dueOn).includes("overdue") && "text-danger")}>
                        {dueLabel(caseRecord.dueOn)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{caseRecord.assignedTo?.name ?? "Unassigned"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{caseRecord.assignedTeam ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", STATUS_TONE[caseRecord.status])}>
                        {STATUS_LABEL[caseRecord.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <CaseDetailSheet key={selectedId ?? "empty"} caseId={selectedId} onOpenChange={(open) => !open && closeSheet()} />
    </div>
  );
}

function CaseDetailSheet({ caseId, onOpenChange }: { caseId: number | null; onOpenChange: (open: boolean) => void }) {
  const { data: caseRecord, isLoading } = useRegulatoryCase(caseId);
  const changeStatus = useChangeRegulatoryCaseStatus();
  const assignCase = useAssignRegulatoryCase();
  const assignTeam = useAssignRegulatoryCaseTeam();
  const recordInspection = useRecordRegulatoryInspection();
  const { data: inspections = [], isLoading: inspectionsLoading } = useCaseInspections(caseId);
  const { data: officers = [] } = useRegulatoryOfficers();
  const { data: authorities = [] } = useRegulatoryAuthorities();
  const { data: authority } = useMyRegulatoryAuthority(true);
  const { data: teams = [] } = useActiveAuthorityTeams(true);
  const referCase = useReferRegulatoryCase();
  const [recordingInspection, setRecordingInspection] = useState(false);
  const [referring, setReferring] = useState(false);
  const [toAuthorityId, setToAuthorityId] = useState("");
  const [referralReason, setReferralReason] = useState("");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const nextStatus = caseRecord?.status === "RESOLVED" ? "CLOSED" : "RESOLVED";
  const canAskBusiness =
    !!caseRecord &&
    caseRecord.status !== "CLOSED" &&
    caseRecord.status !== "AWAITING_BUSINESS" &&
    caseRecord.status !== "RESOLVED";

  // Linked-records timeline: one merged ledger per subject the case touches.
  const [ledgerSubject, setLedgerSubject] = useState<LedgerSubject>("case");
  const caseEntriesQuery = useCaseTimeline(caseRecord?.id ?? 0, 40);
  const organisationEntriesQuery = useOrganizationTimeline(caseRecord?.organization.id ?? 0, 40);
  const facilityEntriesQuery = useFacilityTimeline(caseRecord?.facility?.id ?? 0, 40);
  const licenceEntriesQuery = useLicenceTimeline(caseRecord?.license?.id ?? 0, 40);
  const batchEntriesQuery = useBatchTimeline(caseRecord?.batch?.id ?? 0, 40);

  const linkedSubjects: { key: LedgerSubject; label: string }[] = [
    { key: "case", label: "Case" },
    { key: "organisation", label: "Organisation" },
    ...(caseRecord?.facility ? [{ key: "facility" as const, label: "Facility" }] : []),
    ...(caseRecord?.license ? [{ key: "licence" as const, label: "Licence" }] : []),
    ...(caseRecord?.batch ? [{ key: "batch" as const, label: "Batch" }] : []),
  ];
  const activeSubject = linkedSubjects.some((s) => s.key === ledgerSubject)
    ? ledgerSubject
    : "case";
  const activeEntriesQuery =
    activeSubject === "organisation"
      ? organisationEntriesQuery
      : activeSubject === "facility"
        ? facilityEntriesQuery
        : activeSubject === "licence"
          ? licenceEntriesQuery
          : activeSubject === "batch"
            ? batchEntriesQuery
            : caseEntriesQuery;

  const submitInspection = (result: RegulatoryInspectionResult) => {
    if (!caseRecord) return;
    recordInspection.mutate(
      { caseId: caseRecord.id, result, notes: inspectionNotes || undefined },
      { onSuccess: () => { setInspectionNotes(""); setRecordingInspection(false); } },
    );
  };

  const assignTo = (officerId: string) => {
    if (!caseRecord || !officerId) return;
    assignCase.mutate({ id: caseRecord.id, officerId: Number(officerId) });
  };

  const assignToTeam = (value: string) => {
    if (!caseRecord || !value) return;
    if (teams.length > 0) {
      assignTeam.mutate({ id: caseRecord.id, teamId: Number(value) });
      return;
    }
    assignTeam.mutate({ id: caseRecord.id, team: value });
  };

  const preferredOfficers = (() => {
    const teamId = caseRecord?.assignedTeamId;
    const teamName = caseRecord?.assignedTeam;
    const desk =
      (teamId != null ? teams.find((team) => team.id === teamId) : undefined) ??
      (teamName ? teams.find((team) => team.name === teamName) : undefined);
    if (!desk || desk.members.length === 0) return officers;
    const memberIds = new Set(desk.members.map((member) => member.userId));
    const onTeam = officers.filter((officer) => memberIds.has(officer.id));
    return onTeam.length > 0 ? onTeam : officers;
  })();

  const submitReferral = () => {
    if (!caseRecord || !toAuthorityId || referralReason.trim().length < 3) return;
    referCase.mutate({ caseId: caseRecord.id, toAuthorityId: Number(toAuthorityId), reason: referralReason.trim() }, { onSuccess: () => { setReferring(false); setToAuthorityId(""); setReferralReason(""); } });
  };

  return (
    <Sheet open={caseId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-3xl">
        {isLoading || !caseRecord ? (
          <div className="flex flex-1 items-center justify-center"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <SheetHeader className="border-b border-border pr-12">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={STATUS_TONE[caseRecord.status]}>{STATUS_LABEL[caseRecord.status]}</Badge>
                <span className={cn("text-xs font-semibold", PRIORITY_TONE[caseRecord.priority])}>{caseRecord.priority}</span>
              </div>
              <SheetTitle>{caseRecord.title}</SheetTitle>
              <SheetDescription>{caseRecord.caseNumber} · {caseRecord.organization.name}</SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/45 p-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Owner</p>
                  <select aria-label="Assign case owner" className="mt-1 w-full bg-transparent text-sm font-medium outline-none" value={caseRecord.assignedTo?.id ?? ""} disabled={assignCase.isPending} onChange={(event) => assignTo(event.target.value)}>
                    <option value="">Needs assignment</option>
                    {preferredOfficers.map((officer) => <option key={officer.id} value={officer.id}>{officer.name}</option>)}
                  </select>
                  {caseRecord.assignedTeam && preferredOfficers.length < officers.length ? (
                    <p className="mt-1 text-[13px] text-muted-foreground">Showing {caseRecord.assignedTeam} members first</p>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Team</p>
                  <select aria-label="Assign case team" className="mt-1 w-full bg-transparent text-sm font-medium outline-none" value={caseRecord.assignedTeamId != null ? String(caseRecord.assignedTeamId) : caseRecord.assignedTeam ?? ""} disabled={assignTeam.isPending} onChange={(event) => assignToTeam(event.target.value)}>
                    <option value="">Needs team</option>
                    {teams.length > 0
                      ? teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.name}
                          </option>
                        ))
                      : (authority?.teams ?? []).map((team) => (
                          <option key={team} value={team}>
                            {team}
                          </option>
                        ))}
                  </select>
                </div>
                <div><p className="text-xs text-muted-foreground">Deadline</p><p className={cn("mt-1 font-medium", dueLabel(caseRecord.dueOn).includes("overdue") && "text-danger")}>{dueLabel(caseRecord.dueOn)}</p></div>
                {caseRecord.facility && <div><p className="text-xs text-muted-foreground">Facility</p><p className="mt-1 font-medium">{caseRecord.facility.name}</p></div>}
                {caseRecord.license && <div><p className="text-xs text-muted-foreground">Licence</p><p className="mt-1 font-mono text-xs">{caseRecord.license.licenseNumber}</p></div>}
                {caseRecord.batch && <div><p className="text-xs text-muted-foreground">Affected batch</p><p className="mt-1 font-mono text-xs">{caseRecord.batch.batchCode}</p></div>}
              </div>
              {caseRecord.description && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{caseRecord.description}</p>}
              {caseRecord.caseCategory && <p className="mt-3 text-sm text-muted-foreground">Category: <span className="font-medium text-foreground">{caseRecord.caseCategory}</span></p>}
              <Button variant="outline" className="mt-4 w-full" onClick={() => regulatoryCaseService.downloadInvestigationPack(caseRecord.id)}>
                <FileDown className="mr-2 size-4" /> Export investigation pack
              </Button>
              {caseRecord.referrals.length > 0 && <div className="mt-6"><p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Authority handoffs</p><div className="divide-y rounded-lg border border-border">{caseRecord.referrals.map((referral) => <div key={referral.id} className="px-3 py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">{referral.fromAuthority.name} → {referral.toAuthority.name}</p><Badge variant={referral.status === "PENDING" ? "warning" : referral.status === "ACCEPTED" ? "success" : "outline"}>{referral.status.toLowerCase()}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{referral.reason}</p><p className="mt-1 text-xs text-muted-foreground">Sent {new Date(referral.referredAt).toLocaleString()}{referral.decidedAt ? ` · Decided ${new Date(referral.decidedAt).toLocaleString()}` : ""}{referral.decisionNote ? ` · ${referral.decisionNote}` : ""}</p></div>)}</div></div>}
              {caseRecord.evidence.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Corrective-action evidence</p>
                  <div className="divide-y rounded-lg border border-border">
                    {caseRecord.evidence.map((evidence) => (
                      <div key={evidence.id} className="flex items-center gap-3 px-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{evidence.filename}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{evidence.submittedBy.name} · {new Date(evidence.submittedAt).toLocaleString()}{evidence.note ? ` · ${evidence.note}` : ""}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" aria-label={`Download ${evidence.filename}`} onClick={() => regulatoryCaseService.downloadEvidence(caseRecord.id, evidence.id)}>
                          <Download className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accountability ledger</p>
                <p className="mb-3 text-xs text-muted-foreground">
                  One timeline per linked record — case events, licence decisions, inspections, findings, complaints, and product events.
                </p>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {linkedSubjects.map((subject) => {
                    const SubjectIcon = SUBJECT_ICON[subject.key];
                    const active = subject.key === activeSubject;
                    return (
                      <button
                        key={subject.key}
                        type="button"
                        onClick={() => setLedgerSubject(subject.key)}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-transparent bg-primary text-white"
                            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <SubjectIcon className="size-3.5" />
                        {subject.label}
                      </button>
                    );
                  })}
                </div>
                {activeEntriesQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <AccountabilityLedger entries={activeEntriesQuery.data ?? []} />
                )}
              </div>
              {caseRecord.status !== "CLOSED" && (
                <div className="mt-6 rounded-lg border border-border p-3">
                  {referring ? <div className="space-y-3"><div><p className="text-sm font-medium">Refer this case</p><p className="mt-1 text-xs text-muted-foreground">The receiving authority must accept before ownership changes.</p></div><select aria-label="Receiving authority" className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={toAuthorityId} onChange={(event) => setToAuthorityId(event.target.value)}><option value="">Choose receiving authority</option>{authorities.filter((authority) => authority.isActive && authority.id !== caseRecord.leadAuthority?.id).map((authority) => <option key={authority.id} value={authority.id}>{authority.name}</option>)}</select><Textarea value={referralReason} onChange={(event) => setReferralReason(event.target.value)} placeholder="Why should this authority review the case?" className="min-h-20 text-base" /><div className="flex gap-2"><Button className="flex-1" disabled={referCase.isPending || !toAuthorityId || referralReason.trim().length < 3} onClick={submitReferral}>{referCase.isPending ? "Sending…" : "Send referral"}</Button><Button variant="ghost" onClick={() => setReferring(false)}>Cancel</Button></div></div> : <Button variant="outline" className="w-full" onClick={() => setReferring(true)}>Refer to another authority</Button>}
                </div>
              )}
              <div className="mt-6 rounded-lg border border-border p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Inspection history</p>
                  {inspectionsLoading ? (
                    <div className="flex justify-center py-4">
                      <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  ) : inspections.length === 0 ? (
                    <p className="mb-3 text-xs text-muted-foreground">No field visits recorded on this case yet.</p>
                  ) : (
                    <div className="mb-3 divide-y rounded-lg border border-border">
                      {inspections.map((row) => (
                        <div key={row.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{row.inspector.name}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {new Date(row.inspectedAt).toLocaleString()}
                              {row.notes ? ` · ${row.notes}` : ""}
                            </p>
                          </div>
                          <Badge
                            className={
                              row.result === "PASS"
                                ? "bg-emerald-600 text-white"
                                : row.result === "FAIL"
                                  ? "bg-danger text-white"
                                  : "bg-amber-500 text-white"
                            }
                          >
                            {row.result}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {caseRecord.status !== "CLOSED" ? (
                    recordingInspection ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Record field inspection</p>
                        <p className="mt-1 text-xs text-muted-foreground">The outcome updates this case and becomes part of its permanent ledger.</p>
                      </div>
                      <Textarea value={inspectionNotes} onChange={(event) => setInspectionNotes(event.target.value)} placeholder="What was observed? Include the corrective action required if applicable." className="min-h-24 text-base" />
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <Button variant="outline" disabled={recordInspection.isPending} onClick={() => submitInspection("PASS")}>Pass</Button>
                        <Button variant="outline" disabled={recordInspection.isPending} onClick={() => submitInspection("CONDITIONAL")}>Conditional</Button>
                        <Button variant="destructive" disabled={recordInspection.isPending} onClick={() => submitInspection("FAIL")}>Issue corrective action</Button>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setRecordingInspection(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full" onClick={() => setRecordingInspection(true)}>Record field inspection</Button>
                  )
                  ) : null}
                </div>
            </div>
            {caseRecord.status !== "CLOSED" && (
              <div className="space-y-2 border-t border-border p-4">
                {canAskBusiness && (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={changeStatus.isPending}
                    onClick={() =>
                      changeStatus.mutate({
                        id: caseRecord.id,
                        status: "AWAITING_BUSINESS",
                        note: "Please submit corrective-action evidence.",
                      })
                    }
                  >
                    {changeStatus.isPending ? (
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                    ) : null}
                    Awaiting business
                  </Button>
                )}
                <Button className="w-full" disabled={changeStatus.isPending} onClick={() => changeStatus.mutate({ id: caseRecord.id, status: nextStatus })}>
                  {changeStatus.isPending ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}
                  {nextStatus === "CLOSED" ? "Close case" : "Mark ready to close"}
                </Button>
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
