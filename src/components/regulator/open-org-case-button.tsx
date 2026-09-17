"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FolderPlus } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useOpenRegulatoryCase } from "@/hooks/regulatory-cases";
import { getApiErrorMessage } from "@/lib/api";

type Priority = "LOW" | "NORMAL" | "HIGH" | "CRITICAL";

export function OpenOrgCaseButton({
  organizationId,
  organizationName,
  licenseId,
  licenseLabel,
  defaultTitle,
  variant = "outline",
  size = "sm",
  label = "Open case",
}: {
  organizationId: number;
  organizationName: string;
  licenseId?: number;
  licenseLabel?: string;
  defaultTitle?: string;
  variant?: "outline" | "default" | "ghost";
  size?: "sm" | "default";
  label?: string;
}) {
  const router = useRouter();
  const openCase = useOpenRegulatoryCase();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("NORMAL");

  function begin() {
    setTitle(
      defaultTitle ??
        (licenseLabel
          ? `Licence review — ${licenseLabel}`
          : `Investigation — ${organizationName}`),
    );
    setDescription("");
    setPriority(licenseId ? "HIGH" : "NORMAL");
    setOpen(true);
  }

  function submit() {
    if (title.trim().length < 3) return;
    openCase.mutate(
      {
        organizationId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        licenseId,
      },
      {
        onSuccess: (caseRecord) => {
          toast.success(`${caseRecord.caseNumber ?? "Case"} opened`);
          setOpen(false);
          router.push(`/dashboard/regulator?tab=enforcement&case=${caseRecord.id}`);
        },
        onError: (error) =>
          toast.error(getApiErrorMessage(error, "Could not open the case")),
      },
    );
  }

  return (
    <>
      <Button type="button" size={size} variant={variant} onClick={begin}>
        <FolderPlus className="size-3.5" />
        {label}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next && !openCase.isPending) setOpen(false);
        }}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Open investigation</DialogTitle>
            <DialogDescription>
              Starts a case against {organizationName}
              {licenseLabel ? ` for ${licenseLabel}` : ""}. You will land on the case sheet to assign and inspect.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="case-title">Title</Label>
              <Input
                id="case-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs investigation"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value) => value && setPriority(value as Priority)}>
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
              <Label htmlFor="case-note">Note (optional)</Label>
              <Textarea
                id="case-note"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Context for the assigned officer"
                className="min-h-20"
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={openCase.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={openCase.isPending || title.trim().length < 3}
              onClick={submit}
            >
              {openCase.isPending ? "Opening…" : "Open case"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
