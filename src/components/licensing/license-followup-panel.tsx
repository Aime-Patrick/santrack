"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  Send,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useLicenseFollowUps,
  useActionLicenseFollowUp,
} from "@/hooks/licensing";
import type { LicenseFollowUp } from "@/lib/api";

interface LicenseFollowUpPanelProps {
  licenseId: number;
  licenseNumber: string;
}

export function LicenseFollowUpPanel({
  licenseId,
  licenseNumber,
}: LicenseFollowUpPanelProps) {
  const { data: followUps, isLoading, refetch } = useLicenseFollowUps(licenseId);
  const actionMutation = useActionLicenseFollowUp();

  const [selectedFollowUp, setSelectedFollowUp] = useState<LicenseFollowUp | null>(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [evidenceFilename, setEvidenceFilename] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenActionModal = (fu: LicenseFollowUp) => {
    setSelectedFollowUp(fu);
    setResponseNotes(fu.businessResponse || "");
    setEvidenceFilename(fu.evidenceFilename || "");
    setErrorMsg("");
  };

  const handleCloseModal = () => {
    setSelectedFollowUp(null);
    setResponseNotes("");
    setEvidenceFilename("");
    setErrorMsg("");
  };

  const handleSubmitAction = async () => {
    if (!selectedFollowUp) return;
    if (!responseNotes.trim()) {
      setErrorMsg("Please describe the actions taken or compliance measures instituted.");
      return;
    }

    try {
      await actionMutation.mutateAsync({
        licenseId,
        followUpId: selectedFollowUp.id,
        input: {
          businessResponse: responseNotes.trim(),
          evidenceFilename: evidenceFilename.trim() || undefined,
        },
      });
      handleCloseModal();
      refetch();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err.message || "Failed to submit response.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading conditions & follow-up items...</span>
      </div>
    );
  }

  if (!followUps || followUps.length === 0) {
    return (
      <Card className="border-border/60 bg-muted/20">
        <CardContent className="p-6 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-80" />
          <h4 className="font-semibold text-foreground text-sm">No Pending Conditions</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            This license has no outstanding regulatory corrective actions or mandatory follow-up requirements.
          </p>
        </CardContent>
      </Card>
    );
  }

  const openCount = followUps.filter((f) => f.status === "OPEN").length;
  const actionedCount = followUps.filter((f) => f.status === "ACTIONED").length;
  const closedCount = followUps.filter((f) => f.status === "CLOSED").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-primary" />
            Regulatory Conditions & Follow-up Items
          </h4>
          <p className="text-xs text-muted-foreground">
            Corrective actions and stipulations attached to License {licenseNumber}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {openCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[11px]">
              {openCount} Action Required
            </Badge>
          )}
          {actionedCount > 0 && (
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[11px]">
              {actionedCount} Under Verification
            </Badge>
          )}
          {closedCount > 0 && (
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[11px]">
              {closedCount} Resolved
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {followUps.map((fu) => {
          const isClosed = fu.status === "CLOSED";
          const isActioned = fu.status === "ACTIONED";
          const isOpen = fu.status === "OPEN";

          return (
            <Card
              key={fu.id}
              className={`border transition-all ${
                isOpen
                  ? "border-amber-500/40 bg-amber-500/[0.02]"
                  : isActioned
                  ? "border-blue-500/30 bg-blue-500/[0.02]"
                  : "border-border/60 bg-card/50 opacity-90"
              }`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">{fu.title}</span>
                      <PriorityBadge priority={fu.priority} />
                      <StatusBadge status={fu.status} />
                    </div>
                    {fu.dueDate && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-amber-500" />
                        Due by: <span className="font-medium text-foreground">{fu.dueDate}</span>
                      </p>
                    )}
                  </div>

                  {isOpen && (
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1.5 h-8 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                      onClick={() => handleOpenActionModal(fu)}
                    >
                      <Send className="h-3.5 w-3.5" />
                      Submit Action
                    </Button>
                  )}

                  {isActioned && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs font-medium border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                      onClick={() => handleOpenActionModal(fu)}
                    >
                      Update Response
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-4 pt-2 space-y-3 text-xs">
                <p className="text-foreground/90 whitespace-pre-line leading-relaxed bg-muted/30 p-2.5 rounded-md border border-border/40">
                  {fu.description}
                </p>

                {fu.businessResponse && (
                  <div className="bg-blue-500/[0.04] border border-blue-500/20 rounded-md p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-blue-600 dark:text-blue-400">
                      <span>Business Response & Evidence:</span>
                      {fu.actionedAt && (
                        <span>Submitted on {new Date(fu.actionedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    <p className="text-foreground/90 whitespace-pre-line leading-relaxed">
                      {fu.businessResponse}
                    </p>
                    {fu.evidenceFilename && (
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                        <span>Attached Reference: <strong>{fu.evidenceFilename}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {isClosed && (
                  <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-md p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Regulator Sign-off & Verification
                      </span>
                      {fu.closedAt && (
                        <span>Verified on {new Date(fu.closedAt).toLocaleDateString()}</span>
                      )}
                    </div>
                    {fu.closureNotes && (
                      <p className="text-foreground/90 whitespace-pre-line leading-relaxed">
                        {fu.closureNotes}
                      </p>
                    )}
                    {fu.closedBy && (
                      <p className="text-[11px] text-muted-foreground">
                        Verified by: <strong>{fu.closedBy.fullName}</strong>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Dialog */}
      <Dialog open={!!selectedFollowUp} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Send className="h-4 w-4 text-primary" />
              Respond to License Condition
            </DialogTitle>
            <DialogDescription className="text-xs">
              {selectedFollowUp?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="bg-muted/40 p-3 rounded-md border border-border/60">
              <p className="font-medium text-foreground mb-1">Requirement:</p>
              <p className="text-muted-foreground whitespace-pre-line">{selectedFollowUp?.description}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="responseNotes" className="text-xs font-semibold">
                Corrective Action / Measure Taken <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="responseNotes"
                rows={4}
                placeholder="Explain the corrective steps completed, equipment calibrated, certificates obtained, etc."
                value={responseNotes}
                onChange={(e) => setResponseNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evidenceDoc" className="text-xs font-medium">
                Document / Evidence Reference (Optional)
              </Label>
              <Input
                id="evidenceDoc"
                placeholder="e.g. Audit_Report_2026.pdf or Calibration_Receipt_RSB"
                value={evidenceFilename}
                onChange={(e) => setEvidenceFilename(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded bg-danger/10 text-danger border border-danger/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={handleCloseModal} disabled={actionMutation.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleSubmitAction}
              disabled={actionMutation.isPending}
              className="gap-1.5"
            >
              {actionMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Submit for Verification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  switch (priority) {
    case "CRITICAL":
      return (
        <Badge variant="outline" className="bg-danger/10 text-danger border-danger/30 text-[10px] font-semibold">
          Critical
        </Badge>
      );
    case "HIGH":
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] font-semibold">
          High
        </Badge>
      );
    case "LOW":
      return (
        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/30 text-[10px]">
          Low
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px]">
          Medium
        </Badge>
      );
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "CLOSED":
      return (
        <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-emerald-500/40 text-[10px] font-medium">
          Closed & Verified
        </Badge>
      );
    case "ACTIONED":
      return (
        <Badge variant="outline" className="bg-blue-500/15 text-blue-600 border-blue-500/40 text-[10px] font-medium">
          Action Submitted
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/40 text-[10px] font-medium">
          Pending Action
        </Badge>
      );
  }
}
