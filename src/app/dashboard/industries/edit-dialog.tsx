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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAmendIndustry } from "@/hooks/organizations";
import { TRADE_TYPES } from "@/services/organization.service";
import type { OrganizationResponse, OrganizationType } from "@/lib/api";

/**
 * The five kinds of business a registry entry can be.
 *
 * REGULATOR and CONSUMER are deliberately absent. Regulatory standing is
 * conferred by the platform, not typed into a form — the API refuses it here,
 * so offering it only produced a guaranteed error — and a final consumer never
 * holds an account at all.
 */
const TYPE_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturing",
  WAREHOUSE: "Warehousing",
  DISTRIBUTOR: "Distribution",
  RETAILER: "Retail",
  SHOP: "Shop",
};

interface IndustryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: OrganizationResponse | null;
}

export function IndustryEditDialog({
  open,
  onOpenChange,
  organization,
}: IndustryEditDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<OrganizationType>("MANUFACTURER");
  const [loaded, setLoaded] = useState<number | null>(null);
  const amend = useAmendIndustry();

  // Load the form when a different organization is opened. Initialising state
  // from the prop alone kept the first company's name on screen for every
  // subsequent one, so an edit intended for a shop was saved against a factory.
  //
  // Done during render rather than in an effect: an effect would paint the
  // previous company's name first, and a dialog that briefly shows the wrong
  // business is a dialog somebody will save at the wrong moment.
  if (organization && organization.id !== loaded) {
    setLoaded(organization.id);
    setName(organization.name);
    setType(organization.type);
  }

  const unchanged =
    !organization ||
    (name.trim() === organization.name && type === organization.type);

  const handleSave = () => {
    if (!organization) return;
    amend.mutate(
      { id: organization.id, name: name.trim(), type },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Industry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Organization name"
            />
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(v) => v && setType(v as OrganizationType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRADE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {TYPE_LABELS[t] ?? t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Regulatory standing is granted separately, from the Regulators
              screen.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={unchanged || !name.trim() || amend.isPending}
          >
            {amend.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
