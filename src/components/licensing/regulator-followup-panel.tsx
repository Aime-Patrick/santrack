"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRegulatorLicenseFollowUps,
  useCreateLicenseFollowUp,
  useCloseLicenseFollowUp,
  useSendFollowUpLink,
} from "@/hooks/licensing";
import type { LicenseFollowUp, LicenseFollowUpPriority } from "@/lib/api";

interface RegulatorFollowUpPanelProps {
  licenseId: number;
  licenseNumber: string;
}

export function RegulatorFollowUpPanel({
  licenseId,
  licenseNumber,
}: RegulatorFollowUpPanelProps) {
  const { data: followUps, isLoading, refetch } = useRegulatorLicenseFollowUps(licenseId);
  const createMutation = useCreateLicenseFollowUp();
  const closeMutation = useCloseLicenseFollowUp();
  const sendLinkMutation = useSendFollowUpLink();

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<LicenseFollowUpPriority>("MEDIUM");
  const [newDueDate, setNewDueDate] = useState("");
  const [createError, setCreateError] = useState("");

  // Close Modal State
  const [closingFollowUp, setClosingFollowUp] = useState<LicenseFollowUp | null>(null);
  const [closureNotes, setClosureNotes] = useState("");
  const [closeError, setCloseError] = useState("");

  // Send Link Modal State
  const [sendLinkFollowUp, setSendLinkFollowUp] = useState<LicenseFollowUp | null>(null);
  const [sendLinkExpiryDays, setSendLinkExpiryDays] = useState(7);
  const [sendLinkError, setSendLinkError] = useState("");
  const [sendLinkSuccess, setSendLinkSuccess] = useState(false);

  const handleCreateSubmit = async () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      setCreateError("Please provide both a title and description for this requirement.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        licenseId,
        input: {
          title: newTitle.trim(),
          description: newDesc.trim(),
          priority: newPriority,
          dueDate: newDueDate ? newDueDate : undefined,
        },
      });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewPriority("MEDIUM");
      setNewDueDate("");
      setCreateError("");
      refetch();
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || err.message || "Failed to add condition.");
    }
  };

  const handleCloseSubmit = async () => {
    if (!closingFollowUp) return;

    try {
      await closeMutation.mutateAsync({
        licenseId,
        followUpId: closingFollowUp.id,
        input: {
          closureNotes: closureNotes.trim() || undefined,
        },
      });
      setClosingFollowUp(null);
      setClosureNotes("");
      setCloseError("");
      refetch();
    } catch (err: any) {
      setCloseError(err?.response?.data?.message || err.message || "Failed to close condition.");
    }
  };

  const handleSendLinkSubmit = async () => {
    if (!sendLinkFollowUp) return;
    setSendLinkError("");
    try {
      await sendLinkMutation.mutateAsync({
        licenseId,
        followUpId: sendLinkFollowUp.id,
        input: { expiryDays: sendLinkExpiryDays },
      });
      setSendLinkSuccess(true);
      refetch();
    } catch (err: any) {
      setSendLinkError(err?.response?.data?.message || err.message || "Failed to send link.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading regulatory conditions & follow-ups...</span>
      </div>
    );
  }

  const items = followUps || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-primary" />
            Compliance Stipulations & Conditions ({items.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Impose mandatory post-licensing milestones or resolve corrective actions for License {licenseNumber}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 h-8 text-xs bg-primary text-primary-foreground font-medium"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Condition / Follow-up
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="border-border/60 bg-muted/20">
          <CardContent className="p-6 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/60 mx-auto mb-2" />
            <h4 className="font-semibold text-foreground text-sm">No Conditions Imposed</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              No mandatory corrective actions or follow-up milestones have been attached to this license yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {items.map((fu) => {
            const isClosed = fu.status === "CLOSED";
            const isActioned = fu.status === "ACTIONED";
            const isOpen = fu.status === "OPEN";

            return (
              <Card
                key={fu.id}
                className={`border transition-all ${
                  isClosed
                    ? "border-border/60 bg-card/40 opacity-85"
                    : isActioned
                    ? "border-blue-500/40 bg-blue-500/[0.02]"
                    : "border-amber-500/40 bg-amber-500/[0.02]"
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
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {fu.dueDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-amber-500" />
                            Target Date: <strong className="text-foreground">{fu.dueDate}</strong>
                          </span>
                        )}
                        {fu.createdBy && (
                          <span>Imposed by: {fu.createdBy.fullName}</span>
                        )}
                      </div>
                    </div>

                    {!isClosed && (
                      <div className="flex items-center gap-2">
                        {isOpen && !fu.responseTokenUsed && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 h-8 text-xs font-medium border-blue-500/40 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                            onClick={() => {
                              setSendLinkFollowUp(fu);
                              setSendLinkExpiryDays(7);
                              setSendLinkError("");
                              setSendLinkSuccess(false);
                            }}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Send Response Link
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="default"
                          className="gap-1.5 h-8 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                          onClick={() => {
                            setClosingFollowUp(fu);
                            setClosureNotes("");
                            setCloseError("");
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verify & Close
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3 text-xs">
                  <p className="text-foreground/90 whitespace-pre-line leading-relaxed bg-muted/30 p-2.5 rounded-md border border-border/40">
                    {fu.description}
                  </p>

                  {/* Token sent indicator */}
                  {isOpen && fu.responseToken && !fu.responseTokenUsed && (
                    <div className="flex items-center gap-1.5 text-[13px] text-blue-600 dark:text-blue-400 bg-blue-500/[0.04] border border-blue-500/20 rounded px-2.5 py-1.5">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span>
                        Response link sent to holder —{" "}
                        {fu.responseTokenExpiresAt
                          ? `expires ${new Date(fu.responseTokenExpiresAt).toLocaleDateString()}`
                          : "awaiting submission"}
                      </span>
                    </div>
                  )}

                  {fu.businessResponse ? (
                    <div className="bg-blue-500/[0.04] border border-blue-500/20 rounded-md p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[13px] font-medium text-blue-600 dark:text-blue-400">
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3.5 w-3.5" />
                          Business Rectification Submission:
                        </span>
                        {fu.actionedAt && (
                          <span>Submitted on {new Date(fu.actionedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                      <p className="text-foreground/90 whitespace-pre-line leading-relaxed">
                        {fu.businessResponse}
                      </p>
                      {fu.evidenceFilename && (
                        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground pt-1">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span>Submitted Document: <strong>{fu.evidenceFilename}</strong></span>
                        </div>
                      )}
                    </div>
                  ) : (
                    isOpen && (
                      <p className="text-[13px] italic text-amber-600 dark:text-amber-400">
                        * Awaiting business corrective action response.
                      </p>
                    )
                  )}

                  {isClosed && (
                    <div className="bg-emerald-500/[0.04] border border-emerald-500/20 rounded-md p-3 space-y-1">
                      <div className="flex items-center justify-between text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Closed & Verified
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
                        <p className="text-[13px] text-muted-foreground">
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
      )}

      {/* Create Condition Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Plus className="h-4 w-4 text-primary" />
              Impose Condition / Follow-up Milestone
            </DialogTitle>
            <DialogDescription className="text-xs">
              Attach a mandatory post-approval requirement for License {licenseNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="fuTitle" className="text-xs font-semibold">
                Condition Title <span className="text-danger">*</span>
              </Label>
              <Input
                id="fuTitle"
                placeholder="e.g. Provide Calibration Certificate for Boiler #2"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fuPriority" className="text-xs font-semibold">
                  Priority Level
                </Label>
                <Select
                  value={newPriority}
                  onValueChange={(val) => {
                    if (val) setNewPriority(val as LicenseFollowUpPriority);
                  }}
                >
                  <SelectTrigger id="fuPriority" className="h-9 text-xs">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High (Important)</SelectItem>
                    <SelectItem value="CRITICAL">Critical (Immediate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fuDueDate" className="text-xs font-semibold">
                  Compliance Deadline
                </Label>
                <Input
                  id="fuDueDate"
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fuDesc" className="text-xs font-semibold">
                Detailed Requirement & Directives <span className="text-danger">*</span>
              </Label>
              <Textarea
                id="fuDesc"
                rows={4}
                placeholder="Specify the exact technical standard, corrective measure, or inspection finding that must be addressed."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="text-xs"
              />
            </div>

            {createError && (
              <div className="p-2.5 rounded bg-danger/10 text-danger border border-danger/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
              className="gap-1.5"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Attaching...
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Attach Condition
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify & Close Modal */}
      <Dialog open={!!closingFollowUp} onOpenChange={(open) => !open && setClosingFollowUp(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Verify & Sign-off Condition
            </DialogTitle>
            <DialogDescription className="text-xs">
              {closingFollowUp?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {closingFollowUp?.businessResponse && (
              <div className="bg-muted/40 p-3 rounded-md border border-border/60 space-y-1">
                <p className="font-semibold text-foreground">Submitted Business Action:</p>
                <p className="text-muted-foreground whitespace-pre-line">{closingFollowUp.businessResponse}</p>
                {closingFollowUp.evidenceFilename && (
                  <p className="text-[13px] text-primary pt-1">
                    Document Reference: {closingFollowUp.evidenceFilename}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="closureNotes" className="text-xs font-semibold">
                Officer Sign-off / Closure Inspection Notes
              </Label>
              <Textarea
                id="closureNotes"
                rows={3}
                placeholder="e.g. Verified on-site / certificates reviewed and verified according to RSB specifications."
                value={closureNotes}
                onChange={(e) => setClosureNotes(e.target.value)}
                className="text-xs"
              />
            </div>

            {closeError && (
              <div className="p-2.5 rounded bg-danger/10 text-danger border border-danger/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{closeError}</span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button size="sm" variant="outline" onClick={() => setClosingFollowUp(null)} disabled={closeMutation.isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={handleCloseSubmit}
              disabled={closeMutation.isPending}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {closeMutation.isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Closing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark as Resolved & Closed
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Response Link Modal */}
      <Dialog
        open={!!sendLinkFollowUp}
        onOpenChange={(open) => {
          if (!open) {
            setSendLinkFollowUp(null);
            setSendLinkSuccess(false);
            setSendLinkError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <Mail className="h-4 w-4 text-blue-600" />
              Send Response Link
            </DialogTitle>
            <DialogDescription className="text-xs">
              {sendLinkFollowUp?.title} — the holder will receive an email with a secure
              one-time link to submit their evidence without logging in.
            </DialogDescription>
          </DialogHeader>

          {sendLinkSuccess ? (
            <div className="py-4 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-foreground">Link sent successfully!</p>
              <p className="text-xs text-muted-foreground">
                The licence holder has been emailed with a response link. It expires in{" "}
                <strong>{sendLinkExpiryDays} day{sendLinkExpiryDays !== 1 ? "s" : ""}</strong>.
              </p>
              <Button size="sm" variant="outline" onClick={() => setSendLinkFollowUp(null)} className="mt-2">
                Close
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-2 text-xs">
                <div className="space-y-1.5">
                  <Label htmlFor="sendLinkExpiry" className="text-xs font-semibold">
                    Link Expiry (days)
                  </Label>
                  <Input
                    id="sendLinkExpiry"
                    type="number"
                    min={1}
                    max={30}
                    value={sendLinkExpiryDays}
                    onChange={(e) => setSendLinkExpiryDays(Math.max(1, Math.min(30, Number(e.target.value))))}
                    className="text-xs h-9 w-28"
                  />
                  <p className="text-[13px] text-muted-foreground">
                    The link will expire after this many days and cannot be reused.
                  </p>
                </div>

                {sendLinkError && (
                  <div className="p-2.5 rounded bg-danger/10 text-danger border border-danger/20 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{sendLinkError}</span>
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2">
                <Button size="sm" variant="outline" onClick={() => setSendLinkFollowUp(null)} disabled={sendLinkMutation.isPending}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendLinkSubmit}
                  disabled={sendLinkMutation.isPending}
                  className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {sendLinkMutation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      Send Link
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
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
