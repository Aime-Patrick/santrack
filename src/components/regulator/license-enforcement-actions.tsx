"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReinstateLicense, useRevokeLicense, useSuspendLicense } from "@/hooks/licensing";
import { getApiErrorMessage } from "@/lib/api";

type Action = "suspend" | "revoke" | "reinstate";

const COPY: Record<Action, { title: string; body: string; confirm: string; needsReason: boolean }> = {
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

export function LicenseEnforcementActions({
  licenseId,
  status,
  licenseLabel,
}: {
  licenseId: number;
  status: string;
  licenseLabel?: string;
}) {
  const suspend = useSuspendLicense();
  const revoke = useRevokeLicense();
  const reinstate = useReinstateLicense();
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");

  const pending = suspend.isPending || revoke.isPending || reinstate.isPending;
  const copy = action ? COPY[action] : null;
  const subject = licenseLabel ? ` (${licenseLabel})` : "";

  const submit = () => {
    if (!action) return;
    if (COPY[action].needsReason && reason.trim().length < 3) return;

    const fail = (error: unknown) => toast.error(getApiErrorMessage(error, "Could not update the licence"));
    const done = () => {
      toast.success(
        action === "suspend"
          ? "Licence suspended"
          : action === "revoke"
            ? "Licence revoked"
            : "Licence reinstated",
      );
      close();
    };

    if (action === "suspend") {
      suspend.mutate({ licenseId, reason: reason.trim() }, { onError: fail, onSuccess: done });
      return;
    }
    if (action === "revoke") {
      revoke.mutate({ licenseId, reason: reason.trim() }, { onError: fail, onSuccess: done });
      return;
    }
    reinstate.mutate(licenseId, { onError: fail, onSuccess: done });
  };

  const close = () => {
    setAction(null);
    setReason("");
  };

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {status === "ACTIVE" ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setAction("suspend")}>
              Suspend
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setAction("revoke")}>
              Revoke
            </Button>
          </>
        ) : null}
        {status === "SUSPENDED" ? (
          <>
            <Button size="sm" onClick={() => setAction("reinstate")}>
              Reinstate
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setAction("revoke")}>
              Revoke
            </Button>
          </>
        ) : null}
      </div>

      <Dialog open={action !== null} onOpenChange={(open) => { if (!open && !pending) close(); }}>
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
            <Button variant="ghost" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button
              variant={action === "revoke" ? "destructive" : "default"}
              disabled={pending || (copy?.needsReason === true && reason.trim().length < 3)}
              onClick={submit}
            >
              {pending ? "Saving…" : copy?.confirm}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
