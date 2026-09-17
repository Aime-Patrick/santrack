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
import { useCurrentUser } from "@/hooks/use-current-user";
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
  const { data: me } = useCurrentUser();
  const immediate = me?.role === "SYSTEM_ADMIN";
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
    const next = email.trim();
    requestChange.mutate(
      { userId: user.id, email: next },
      {
        onSuccess: () => {
          toast.success(
            immediate
              ? `Email updated to ${next}`
              : `Verification sent to ${next}. Current email stays until confirmed (30 minutes).`,
          );
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Could not change email"));
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
            {immediate
              ? user
                ? `As platform operator, set a new login email for ${user.fullName || user.email} immediately — no inbox confirmation.`
                : "Set a new login email immediately — no inbox confirmation."
              : user
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
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {requestChange.isPending
              ? "Saving…"
              : immediate
                ? "Update email"
                : "Send verification"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
