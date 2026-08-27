"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUser } from "@/hooks/users";
import { useMe } from "@/hooks/auth";
import type { UserRole, UserResponse } from "@/lib/api";
import { ROLE_LABELS, apiErrorMessage, assignableRoles } from "@/lib/user-roles";
import { toast } from "sonner";

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
}

export function EditRoleDialog({ open, onOpenChange, user }: EditRoleDialogProps) {
  const { data: me } = useMe();
  const roles = assignableRoles(me?.role);
  const [selectedRole, setSelectedRole] = useState<UserRole>("ORG_ADMIN");
  const updateUser = useUpdateUser();

  useEffect(() => {
    if (!open || !user) return;
    const allowed = assignableRoles(me?.role);
    setSelectedRole(
      allowed.includes(user.role) ? user.role : (allowed[0] ?? "ORG_ADMIN"),
    );
  }, [open, user, me?.role]);

  const handleSave = () => {
    if (!user) return;

    updateUser.mutate(
      { userId: user.id, input: { role: selectedRole } },
      {
        onSuccess: () => {
          toast.success(`Role updated to ${ROLE_LABELS[selectedRole]}`);
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Failed to update role"));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user role</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {user && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <span className="text-sm font-medium">
                  {user.fullName?.charAt(0)?.toUpperCase() ??
                    user.email?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{user.fullName || user.email}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => v && setSelectedRole(v as UserRole)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role">
                  {ROLE_LABELS[selectedRole]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                align="start"
                className="min-w-[var(--anchor-width)] w-auto max-w-[min(100vw-2rem,28rem)]"
              >
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!user || updateUser.isPending}>
            {updateUser.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
