"use client";

import { useState } from "react";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import { useSetUserCapabilities } from "@/hooks/users";
import { apiErrorMessage } from "@/lib/user-roles";
import type { Capability, UserResponse } from "@/lib/api";
import { toast } from "sonner";

/**
 * Capabilities the platform operator may assign to an individual user.
 *
 * Kept in the browser only for rendering the toggle; the backend is the real
 * gate (PATCH /api/users/:id/capabilities rejects anything outside
 * DYNAMICALLY_GRANTABLE_CAPABILITIES). Add Industry is the first grantable
 * capability — a registry write that a normal role never holds.
 */
const GRANTABLE: {
  capability: Capability;
  label: string;
  description: string;
}[] = [
  {
    capability: "MANAGE_INDUSTRIES",
    label: "Add Industry",
    description:
      "Register businesses in the industry registry. By default only the platform operator can do this.",
  },
];

interface GrantAccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserResponse | null;
}

export function GrantAccessDialog({
  open,
  onOpenChange,
  user,
}: GrantAccessDialogProps) {
  const setCapabilities = useSetUserCapabilities();
  // Seeded from the user the dialog was opened for. The dialog is remounted
  // per user (key={user?.id}) so the toggles always start from that user's
  // current grants.
  const [checked, setChecked] = useState<Set<Capability>>(
    () => new Set(user?.extraCapabilities ?? []),
  );

  const toggle = (capability: Capability) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(capability)) {
        next.delete(capability);
      } else {
        next.add(capability);
      }
      return next;
    });
  };

  const handleSave = () => {
    if (!user) return;
    setCapabilities.mutate(
      {
        userId: user.id,
        input: { capabilities: [...checked] },
      },
      {
        onSuccess: () => {
          toast.success("Access updated");
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(apiErrorMessage(error, "Failed to update access"));
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage individual access</DialogTitle>
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

          <div className="space-y-3">
            {GRANTABLE.map((grant) => {
              const isChecked = checked.has(grant.capability);
              return (
                <div
                  key={grant.capability}
                  className="flex items-start justify-between gap-4 rounded-lg border border-border p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-white">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <Label className="font-medium">{grant.label}</Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {grant.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isChecked}
                    onCheckedChange={() => toggle(grant.capability)}
                  />
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Grants apply on top of the user&apos;s role and organization. Only
            the platform operator can change them.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!user || setCapabilities.isPending}
          >
            {setCapabilities.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}