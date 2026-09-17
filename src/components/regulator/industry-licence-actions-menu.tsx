"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Ban,
  FolderPlus,
  Gavel,
  MoreHorizontal,
  RotateCcw,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReinstateLicense,
  useRevokeLicense,
  useSuspendLicense,
} from "@/hooks/licensing";
import { useOpenRegulatoryCase } from "@/hooks/regulatory-cases";
import { getApiErrorMessage } from "@/lib/api";
import type { RegistryLicense } from "@/services/organization.service";

type EnforceAction = "suspend" | "revoke" | "reinstate";
type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

type LicenceActionTarget = RegistryLicense & {
  organizationId: number;
  organizationName: string;
};

const ENFORCE_COPY: Record<
  EnforceAction,
  { title: string; body: string; confirm: string; needsReason: boolean }
> = {
  suspend: {
    title: "Suspend this licence",
    body: "The business cannot carry out the licensed activity until you reinstate it.",
    confirm: "Suspend licence",
    needsReason: true,
  },
  revoke: {
    title: "Revoke this licence",
    body: "Revocation is terminal. The business must apply again if it needs this activity covered.",
    confirm: "Revoke licence",
    needsReason: true,
  },
  reinstate: {
    title: "Reinstate this licence",
    body: "The licence returns to active standing. The original conditions still apply.",
    confirm: "Reinstate licence",
    needsReason: false,
  },
};

export function IndustryLicenceActionsMenu({ licence }: { licence: LicenceActionTarget }) {
  const router = useRouter();
  const suspend = useSuspendLicense();
  const revoke = useRevokeLicense();
  const reinstate = useReinstateLicense();
  const openCase = useOpenRegulatoryCase();

  const [enforce, setEnforce] = useState<EnforceAction | null>(null);
  const [reason, setReason] = useState("");
  const [caseOpen, setCaseOpen] = useState(false);
  const [caseTitle, setCaseTitle] = useState("");
  const [caseNote, setCaseNote] = useState("");
  const [priority, setPriority] = useState<Priority>("HIGH");

  const enforcePending = suspend.isPending || revoke.isPending || reinstate.isPending;
  const copy = enforce ? ENFORCE_COPY[enforce] : null;
  const subject = ` (${licence.licenseNumber})`;

  const needsQueue =
    licence.status === "SUBMITTED" ||
    licence.status === "UNDER_REVIEW" ||
    licence.status === "CHANGES_REQUESTED";
  const canSuspend = Boolean(licence.id) && licence.status === "ACTIVE";
  const canReinstate = Boolean(licence.id) && licence.status === "SUSPENDED";
  const canRevoke =
    Boolean(licence.id) && (licence.status === "ACTIVE" || licence.status === "SUSPENDED");
  const canOpenCase =
    Boolean(licence.id) &&
    licence.status !== "DRAFT" &&
    licence.status !== "CANCELLED";
  const hasActions = needsQueue || canSuspend || canReinstate || canRevoke || canOpenCase;

  function closeEnforce() {
    setEnforce(null);
    setReason("");
  }

  function submitEnforce() {
    if (!enforce || !licence.id) return;
    if (ENFORCE_COPY[enforce].needsReason && reason.trim().length < 3) return;

    const fail = (error: unknown) =>
      toast.error(getApiErrorMessage(error, "Could not update the licence"));
    const done = () => {
      toast.success(
        enforce === "suspend"
          ? "Licence suspended"
          : enforce === "revoke"
            ? "Licence revoked"
            : "Licence reinstated",
      );
      closeEnforce();
    };

    if (enforce === "suspend") {
      suspend.mutate({ licenseId: licence.id, reason: reason.trim() }, { onError: fail, onSuccess: done });
      return;
    }
    if (enforce === "revoke") {
      revoke.mutate({ licenseId: licence.id, reason: reason.trim() }, { onError: fail, onSuccess: done });
      return;
    }
    reinstate.mutate(licence.id, { onError: fail, onSuccess: done });
  }

  function beginCase() {
    setCaseTitle(`Licence review — ${licence.licenseNumber}`);
    setCaseNote("");
    setPriority("HIGH");
    setCaseOpen(true);
  }

  function submitCase() {
    if (!licence.id || caseTitle.trim().length < 3) return;
    openCase.mutate(
      {
        organizationId: licence.organizationId,
        title: caseTitle.trim(),
        description: caseNote.trim() || undefined,
        priority,
        licenseId: licence.id,
      },
      {
        onSuccess: (caseRecord) => {
          toast.success(`${caseRecord.caseNumber ?? "Case"} opened`);
          setCaseOpen(false);
          router.push(`/dashboard/regulator?tab=enforcement&case=${caseRecord.id}`);
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not open the case")),
      },
    );
  }

  if (!hasActions) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="size-9 p-0 bg-white"
              title="Actions"
            />
          }
        >
          <MoreHorizontal className="size-4.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-100 w-52">
          {needsQueue ? (
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/regulator?tab=licences")}
            >
              <Gavel className="size-4 text-muted-foreground" />
              Review application
            </DropdownMenuItem>
          ) : null}
          {canOpenCase ? (
            <DropdownMenuItem onClick={beginCase}>
              <FolderPlus className="size-4 text-muted-foreground" />
              Open case
            </DropdownMenuItem>
          ) : null}
          {(canSuspend || canReinstate || canRevoke) &&
          (needsQueue || canOpenCase) ? (
            <DropdownMenuSeparator />
          ) : null}
          {canSuspend ? (
            <DropdownMenuItem onClick={() => setEnforce("suspend")}>
              <Ban className="size-4 text-muted-foreground" />
              Suspend
            </DropdownMenuItem>
          ) : null}
          {canReinstate ? (
            <DropdownMenuItem onClick={() => setEnforce("reinstate")}>
              <RotateCcw className="size-4 text-muted-foreground" />
              Reinstate
            </DropdownMenuItem>
          ) : null}
          {canRevoke ? (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setEnforce("revoke")}
            >
              <ShieldOff className="size-4" />
              Revoke
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={enforce !== null}
        onOpenChange={(open) => {
          if (!open && !enforcePending) closeEnforce();
        }}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>
              {copy?.title}
              {subject}
            </DialogTitle>
            <DialogDescription>{copy?.body}</DialogDescription>
          </DialogHeader>
          {copy?.needsReason ? (
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Reason for the record (shown on the industry desk)"
              className="mt-4 min-h-24"
            />
          ) : null}
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={closeEnforce} disabled={enforcePending}>
              Cancel
            </Button>
            <Button
              variant={enforce === "revoke" ? "destructive" : "default"}
              disabled={
                enforcePending ||
                (copy?.needsReason === true && reason.trim().length < 3)
              }
              onClick={submitEnforce}
            >
              {enforcePending ? "Saving…" : copy?.confirm}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <Dialog
        open={caseOpen}
        onOpenChange={(open) => {
          if (!open && !openCase.isPending) setCaseOpen(false);
        }}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Open investigation</DialogTitle>
            <DialogDescription>
              Starts a case against {licence.organizationName} for {licence.licenseNumber}.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`case-title-${licence.id}`}>Title</Label>
              <Input
                id={`case-title-${licence.id}`}
                value={caseTitle}
                onChange={(event) => setCaseTitle(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => value && setPriority(value as Priority)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`case-note-${licence.id}`}>Note (optional)</Label>
              <Textarea
                id={`case-note-${licence.id}`}
                value={caseNote}
                onChange={(event) => setCaseNote(event.target.value)}
                className="min-h-20"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="ghost"
              disabled={openCase.isPending}
              onClick={() => setCaseOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={openCase.isPending || caseTitle.trim().length < 3}
              onClick={submitCase}
            >
              {openCase.isPending ? "Opening…" : "Open case"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
