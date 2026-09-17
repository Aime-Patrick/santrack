"use client";

import { useState } from "react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequestUserEmailChange } from "@/hooks/users";
import type { UserResponse } from "@/lib/api";
import { apiErrorMessage } from "@/lib/user-roles";
import { toast } from "sonner";

interface ChangeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
}

export function ChangeEmailDialog({
  open,
  onOpenChange,
  user,
}: ChangeEmailDialogProps) {
  const requestChange = useRequestUserEmailChange();
  const [email, setEmail] = useState("");

  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setEmail("");
  }

  const canSubmit =
    !!user &&
    email.trim().includes("@") &&
    email.trim().toLowerCase() !== user.email.toLowerCase() &&
    !requestChange.isPending;

  const submit = () => {
    if (!user || !canSubmit) return;
    requestChange.mutate(
      { userId: user.id, email: email.trim() },
      {
        onSuccess: () => {
          toast.success(
            `Verification sent to ${email.trim()}. Current email stays until confirmed (30 minutes).`,
          );
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Could not start email change"));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change email</DialogTitle>
          <DialogDescription>
            {user
              ? `Send a verification link to a new address for ${user.fullName || user.email}. Their current email (${user.email}) stays active until they confirm.`
              : "Send a verification link to a new address."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="change-email">New email</Label>
          <Input
            id="change-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            autoComplete="off"
          />
          <p className="text-xs text-muted-foreground">
            Link expires in 30 minutes. A notice is also sent to the current
            address.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            {requestChange.isPending ? "Sending…" : "Send verification"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
