"use client";

import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRemoveUser } from "@/hooks/users";
import type { UserResponse } from "@/lib/api";
import { apiErrorMessage } from "@/lib/user-roles";
import { toast } from "sonner";

interface DeactivateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
}

export function DeactivateUserDialog({
  open,
  onOpenChange,
  user,
}: DeactivateUserDialogProps) {
  const removeUser = useRemoveUser();

  const submit = () => {
    if (!user) return;
    removeUser.mutate(user.id, {
      onSuccess: () => {
        toast.success(`${user.fullName || user.email} deactivated`);
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(apiErrorMessage(error, "Could not deactivate user"));
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deactivate user</DialogTitle>
          <DialogDescription>
            {user
              ? `Remove ${user.fullName || user.email} (${user.email}) from the organization. They will no longer be able to sign in.`
              : "Remove this user from the organization."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="bg-danger text-white hover:bg-danger/90"
            disabled={!user || removeUser.isPending}
            onClick={submit}
          >
            {removeUser.isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
