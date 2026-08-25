"use client";

import { useState } from "react";
import { Dialog, DialogPopup, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateUser } from "@/hooks/users";
import type { UserRole, UserResponse } from "@/lib/api";
import { toast } from "sonner";

const ALL_ROLES: UserRole[] = [
  "SYSTEM_ADMIN",
  "ORG_ADMIN",
  "PRODUCTION_MANAGER",
  "PRODUCTION_OFFICER",
  "WAREHOUSE_MANAGER",
  "WAREHOUSE_OFFICER",
  "QUALITY_OFFICER",
  "LOGISTICS_OFFICER",
  "SALES_OFFICER",
  "MANAGEMENT",
  "AUDITOR",
];

const roleLabels: Record<UserRole, string> = {
  SYSTEM_ADMIN: "System Admin",
  ORG_ADMIN: "Org Admin",
  PRODUCTION_MANAGER: "Production Manager",
  PRODUCTION_OFFICER: "Production Officer",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  WAREHOUSE_OFFICER: "Warehouse Officer",
  QUALITY_OFFICER: "Quality Officer",
  LOGISTICS_OFFICER: "Logistics Officer",
  SALES_OFFICER: "Sales Officer",
  MANAGEMENT: "Management",
  AUDITOR: "Auditor",
};

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
}

export function EditRoleDialog({ open, onOpenChange, user }: EditRoleDialogProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role ?? "ORG_ADMIN");
  const updateUser = useUpdateUser();

  const handleSave = () => {
    if (!user) return;

    updateUser.mutate(
      { userId: user.id, input: { role: selectedRole } },
      {
        onSuccess: () => {
          toast.success(`Role updated to ${roleLabels[selectedRole]}`);
          onOpenChange(false);
        },
        onError: (error: any) => {
          toast.error(error?.response?.data?.message ?? "Failed to update role");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User Role</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {user && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <span className="text-sm font-medium">
                  {user.fullName?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{user.fullName}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={(v) => v && setSelectedRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleLabels[role]}
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
          <Button onClick={handleSave} disabled={updateUser.isPending}>
            {updateUser.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
