"use client";

import { useEffect, useState } from "react";
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
import { useResetPassword } from "@/hooks/users";
import type { UserResponse } from "@/lib/api";
import { apiErrorMessage } from "@/lib/user-roles";
import { toast } from "sonner";

interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: ResetPasswordDialogProps) {
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (!open) return;
    setPassword("");
    setConfirm("");
  }, [open, user?.id]);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    !!user &&
    password.length >= 8 &&
    password === confirm &&
    !resetPassword.isPending;

  const submit = () => {
    if (!user || !canSubmit) return;
    resetPassword.mutate(
      { userId: user.id, input: { password } },
      {
        onSuccess: () => {
          toast.success(`Password reset for ${user.fullName || user.email}`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Could not reset password"));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            {user
              ? `Set a temporary password for ${user.fullName || user.email} (${user.email}). They must change it on next login.`
              : "Set a temporary password."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="reset-password">New password</Label>
            <Input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-password-confirm">Confirm password</Label>
            <Input
              id="reset-password-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
            {mismatch ? (
              <p className="text-xs text-destructive">Passwords do not match</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            {resetPassword.isPending ? "Saving…" : "Reset password"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
