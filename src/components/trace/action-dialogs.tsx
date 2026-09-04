"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { SymbologyPicker } from "@/components/barcode/symbology-picker";
import { useBarcodePreview } from "@/hooks/barcodes";
import { useLocations } from "@/hooks/locations";
import { useOrganizations } from "@/hooks/organizations";
import { barcodeService, type Symbology, type SymbologyUse } from "@/services/barcode.service";
import type { Item, LifecycleAction } from "@/services/item.service";
import type { ItemAction } from "@/services/trace.service";

/**
 * Clears a dialog's form the moment it opens.
 *
 * These dialogs stay mounted between uses, so without this the reason typed
 * for one quarantine is still sitting there when the next item is scanned —
 * and an operator who does not notice records the wrong explanation against
 * the wrong goods, permanently, in an append-only log.
 *
 * Done during render rather than in an effect. Resetting in an effect means
 * React paints the stale values first and then immediately re-renders, which
 * is both a wasted pass and a visible flash of the previous item's text. This
 * is React's documented "adjust state when a prop changes" pattern.
 */
function useResetWhenOpened(open: boolean, reset: () => void) {
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) reset();
  }
}

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

interface ShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  disabled?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  children: React.ReactNode;
}

function ActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  disabled,
  pending,
  onConfirm,
  children,
}: ShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 py-2">{children}</div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={disabled || pending}
            className={
              destructive ? "bg-danger text-white hover:bg-danger/90" : undefined
            }
          >
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Print
// ---------------------------------------------------------------------------

/**
 * Reprinting the label for an identity already in hand.
 *
 * The value never changes — it is this item's permanent token — but the code
 * type does: a Data Matrix for something too small to take a QR, a Code 128
 * for a shelf label, an ITF-14 for the outer carton.
 */
export function PrintLabelDialog({
  open,
  onOpenChange,
  item,
  only,
  exclude,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  only?: SymbologyUse[];
  exclude?: Symbology[];
}) {
  const [symbology, setSymbology] = useState<Symbology>("QR");
  const [format, setFormat] = useState<"png" | "svg">("png");

  const internalLinear =
    symbology === "CODE_128" ||
    symbology === "CODE_39" ||
    symbology === "CODE_93";
  const value = internalLinear ? item.code : item.qrCode;

  const { url, rendering, problem } = useBarcodePreview(
    open ? { symbology, value, scale: 4, format: "png" } : null,
  );

  const download = async () => {
    const href =
      format === "png" && url
        ? url
        : await barcodeService.render({
            symbology,
            value,
            scale: 6,
            format,
          });

    const link = document.createElement("a");
    link.href = href;
    link.download = `${item.code}-${symbology}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (href !== url) URL.revokeObjectURL(href);
  };

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Print label — ${item.code}`}
      description="Choose the code type your scanner reads. Matrix codes use the identity token; Code 128 / 39 / 93 print the serial."
      confirmLabel={`Download ${format.toUpperCase()}`}
      disabled={!url && !rendering}
      onConfirm={download}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Code type</Label>
          <SymbologyPicker
            value={symbology}
            onChange={setSymbology}
            only={only}
            exclude={exclude}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Format</Label>
          <Select
            value={format}
            onValueChange={(v) => v && setFormat(v as "png" | "svg")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG — printing</SelectItem>
              <SelectItem value="svg">SVG — scales cleanly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-border bg-white p-4">
        {rendering ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`Label for ${item.code}`}
            className="max-h-[180px] max-w-full object-contain"
          />
        ) : (
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            {problem ?? "Choose a code type to preview the label."}
          </p>
        )}
      </div>
    </ActionDialog>
  );
}

// ---------------------------------------------------------------------------
// Packaging
// ---------------------------------------------------------------------------

/** Scanning items into an open container. */
export function PackDialog({
  open,
  onOpenChange,
  container,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: Item;
  pending: boolean;
  onConfirm: (childQrCodes: string[]) => void;
}) {
  const [scanned, setScanned] = useState<string[]>([]);

  useResetWhenOpened(open, () => setScanned([]));

  const add = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    // Scanning the same code twice is a slip, not an instruction to pack it
    // twice — and the second one would be refused by the API anyway.
    setScanned((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  };

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Pack into ${container.code}`}
      description="Scan each item going in. They keep their own identities — packing records containment, it does not merge them."
      confirmLabel={`Pack ${scanned.length} item${scanned.length === 1 ? "" : "s"}`}
      disabled={scanned.length === 0}
      pending={pending}
      onConfirm={() => onConfirm(scanned)}
    >
      <QrScanInput onScan={add} placeholder="Scan or type an item code…" />

      {scanned.length > 0 && (
        <div className="max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
          {scanned.map((code) => (
            <div
              key={code}
              className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5"
            >
              <span className="font-mono text-xs">{code}</span>
              <button
                type="button"
                onClick={() => setScanned((p) => p.filter((c) => c !== code))}
                className="text-faint transition-colors hover:text-danger"
                aria-label={`Remove ${code}`}
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </ActionDialog>
  );
}

/** Taking one item back out of an open container. */
export function RemoveContentDialog({
  open,
  onOpenChange,
  container,
  contents,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  container: Item;
  contents: Item[];
  pending: boolean;
  onConfirm: (childQrCode: string, notes?: string) => void;
}) {
  const [childQrCode, setChildQrCode] = useState("");
  const [notes, setNotes] = useState("");

  useResetWhenOpened(open, () => {
    setChildQrCode("");
    setNotes("");
  });

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Take an item out of ${container.code}`}
      description="The item keeps its identity and its history. Removal is recorded as an event, not as a deletion."
      confirmLabel="Remove"
      disabled={!childQrCode}
      pending={pending}
      onConfirm={() => onConfirm(childQrCode, notes.trim() || undefined)}
    >
      <div className="space-y-1.5">
        <Label>Item</Label>
        <Select value={childQrCode} onValueChange={(v) => setChildQrCode(v ?? "")}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose what to take out…" />
          </SelectTrigger>
          <SelectContent>
            {contents.map((child) => (
              <SelectItem key={child.id} value={child.qrCode}>
                <span className="flex items-center gap-2">
                  <span className="font-mono">{child.code}</span>
                  <span className="text-xs text-muted-foreground">
                    {child.productName ?? "—"}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why is this coming out?"
          className="min-h-[70px]"
        />
      </div>
    </ActionDialog>
  );
}

// ---------------------------------------------------------------------------
// Movement
// ---------------------------------------------------------------------------

/** Sending this identity to another business. */
export function DispatchDialog({
  open,
  onOpenChange,
  item,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  pending: boolean;
  onConfirm: (input: {
    destinationOrganizationId: number;
    itemQrCodes: string[];
    notes?: string;
  }) => void;
}) {
  const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState("");
  const { data: partners } = useOrganizations();

  useResetWhenOpened(open, () => {
    setDestination("");
    setNotes("");
  });

  // Dispatching to yourself is a relocation, and offering it here only invites
  // a refusal from the API.
  const destinations = (partners ?? []).filter((o) => o.id !== item.holderId);

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Dispatch ${item.code}`}
      description="Custody passes when the receiving party confirms it, not when it leaves. Until then this shows as in transit."
      confirmLabel="Dispatch"
      disabled={!destination}
      pending={pending}
      onConfirm={() =>
        onConfirm({
          destinationOrganizationId: Number(destination),
          itemQrCodes: [item.qrCode],
          notes: notes.trim() || undefined,
        })
      }
    >
      <div className="space-y-1.5">
        <Label>Send to</Label>
        <SearchableSelect
          value={destination}
          onValueChange={setDestination}
          placeholder="Choose the receiving business…"
          searchPlaceholder="Search businesses by name, type or ID…"
          items={destinations.map((org) => ({
            value: String(org.id),
            label: org.name,
            badge: org.type,
          }))}
        />
      </div>

      {item.kind === "PACKAGE" && (
        <p className="rounded-lg bg-primary-light px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          Everything inside this container travels with it. Each item keeps its
          own identity and picks up its own dispatch event.
        </p>
      )}

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Delivery note reference, transporter, anything worth recording"
          className="min-h-[70px]"
        />
      </div>
    </ActionDialog>
  );
}

/** Moving this identity between the caller's own locations. */
export function RelocateDialog({
  open,
  onOpenChange,
  item,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  pending: boolean;
  onConfirm: (input: {
    itemQrCodes: string[];
    destinationLocationId: number;
  }) => void;
}) {
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const { data: locations } = useLocations();

  useResetWhenOpened(open, () => {
    setLocation("");
    setNotes("");
  });

  const targets = (locations ?? []).filter((l) => l.id !== item.locationId);

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Relocate ${item.code}`}
      description="Moves the item within your own organization. Custody does not change; the location does."
      confirmLabel="Relocate"
      disabled={!location}
      pending={pending}
      onConfirm={() =>
        onConfirm({
          itemQrCodes: [item.qrCode],
          destinationLocationId: Number(location),
        })
      }
    >
      <div className="space-y-1.5">
        <Label>Move to</Label>
        <SearchableSelect
          value={location}
          onValueChange={setLocation}
          placeholder={
            item.locationName
              ? `Currently at ${item.locationName}`
              : "Choose a location…"
          }
          searchPlaceholder="Search locations by name or code…"
          items={targets.map((l) => ({
            value: String(l.id),
            label: l.name,
            sublabel: l.type ? `Type: ${l.type}` : undefined,
          }))}
        />
      </div>

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Why is it moving?"
          className="min-h-[70px]"
        />
      </div>
    </ActionDialog>
  );
}

/** Recording a sale, to a business or to a final consumer. */
export function SellDialog({
  open,
  onOpenChange,
  item,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  pending: boolean;
  onConfirm: (input: {
    type: "BUSINESS" | "CONSUMER";
    itemQrCodes: string[];
    buyerOrganizationId?: number;
    consumerRef?: string;
    notes?: string;
  }) => void;
}) {
  const [kind, setKind] = useState<"BUSINESS" | "CONSUMER">("CONSUMER");
  const [buyer, setBuyer] = useState("");
  const [consumerRef, setConsumerRef] = useState("");
  const [notes, setNotes] = useState("");
  const { data: partners } = useOrganizations();

  useResetWhenOpened(open, () => {
    setKind("CONSUMER");
    setBuyer("");
    setConsumerRef("");
    setNotes("");
  });

  const buyers = (partners ?? []).filter((o) => o.id !== item.holderId);

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Sell ${item.code}`}
      description="A sale is the end of the trade chain for this identity. Its history stays readable afterwards."
      confirmLabel="Record sale"
      disabled={kind === "BUSINESS" && !buyer}
      pending={pending}
      onConfirm={() =>
        onConfirm({
          type: kind,
          itemQrCodes: [item.qrCode],
          buyerOrganizationId: kind === "BUSINESS" ? Number(buyer) : undefined,
          consumerRef:
            kind === "CONSUMER" ? consumerRef.trim() || undefined : undefined,
          notes: notes.trim() || undefined,
        })
      }
    >
      <div className="space-y-1.5">
        <Label>Sold to</Label>
        <Select
          value={kind}
          onValueChange={(v) => v && setKind(v as "BUSINESS" | "CONSUMER")}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CONSUMER">A final consumer</SelectItem>
            <SelectItem value="BUSINESS">Another business on the platform</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {kind === "BUSINESS" ? (
        <div className="space-y-1.5">
          <Label>Buyer</Label>
          <SearchableSelect
            value={buyer}
            onValueChange={setBuyer}
            placeholder="Choose the buying business…"
            searchPlaceholder="Search businesses by name, type or ID…"
            items={buyers.map((org) => ({
              value: String(org.id),
              label: org.name,
              badge: org.type,
            }))}
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>Receipt or contact reference (optional)</Label>
          <Input
            value={consumerRef}
            onChange={(e) => setConsumerRef(e.target.value)}
            placeholder="Receipt number, or a phone number for warranty"
          />
          {/* Proposal section 8: a consumer never holds an account, and their
              details are visible only to the party that recorded the sale and
              to regulators. Saying so here is why the field stays optional. */}
          <p className="text-xs leading-relaxed text-muted-foreground">
            Kept minimal on purpose, and visible only to your organization and
            to regulators — never to anyone who scans the code.
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notes (optional)</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[70px]"
        />
      </div>
    </ActionDialog>
  );
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

const LIFECYCLE_COPY: Record<
  LifecycleAction,
  { title: string; description: string; confirm: string; destructive?: boolean; reasonRequired?: boolean }
> = {
  QUARANTINE: {
    title: "Quarantine",
    description:
      "Holds the item aside pending a decision. It cannot be sold or dispatched until it is released.",
    confirm: "Quarantine",
    reasonRequired: true,
  },
  RELEASE: {
    title: "Release",
    description:
      "Returns the item to normal stock after quarantine or a return. Record what was decided and why.",
    confirm: "Release",
    reasonRequired: true,
  },
  RETURN: {
    title: "Record a return",
    description:
      "Sends the item back up the chain. It will not be sellable again until somebody inspects and releases it.",
    confirm: "Record return",
    reasonRequired: true,
  },
  DAMAGE: {
    title: "Record damage",
    description:
      "Marks the item as damaged. It stays in the record — a damaged unit that vanishes from inventory is a unit nobody can account for.",
    confirm: "Record damage",
    reasonRequired: true,
  },
  EXPIRE: {
    title: "Mark as expired",
    description: "Records that the item is past its expiry date and must not be sold.",
    confirm: "Mark expired",
  },
  DESTROY: {
    title: "Destroy this identity",
    description:
      "Terminal. The item's history stays readable for ever, but nothing further can happen to it — no release, no correction, no sale.",
    confirm: "Destroy",
    destructive: true,
    reasonRequired: true,
  },
};

/** The six lifecycle verbs, which share one endpoint and one dialog. */
export function LifecycleDialog({
  open,
  onOpenChange,
  item,
  action,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item;
  action: LifecycleAction;
  pending: boolean;
  onConfirm: (action: LifecycleAction, reason?: string) => void;
}) {
  const [reason, setReason] = useState("");
  const copy = LIFECYCLE_COPY[action];

  useResetWhenOpened(open, () => setReason(""));

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`${copy.title} — ${item.code}`}
      description={copy.description}
      confirmLabel={copy.confirm}
      destructive={copy.destructive}
      disabled={copy.reasonRequired && !reason.trim()}
      pending={pending}
      onConfirm={() => onConfirm(action, reason.trim() || undefined)}
    >
      <div className="space-y-1.5">
        <Label>
          Reason{copy.reasonRequired ? "" : " (optional)"}
        </Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What happened, and who decided?"
          className="min-h-[80px]"
        />
        {/* The log is append-only, so this sentence is the only account anyone
            gets of why the state changed. */}
        <p className="text-xs text-muted-foreground">
          Recorded permanently against this identity. Corrections are made by
          recording a further event, never by editing this one.
        </p>
      </div>

      {copy.destructive && (
        <div className="rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-xs leading-relaxed text-danger">
          This cannot be undone. {item.kind === "PACKAGE" && "Anything still inside this container is destroyed with it."}
        </div>
      )}
    </ActionDialog>
  );
}

// ---------------------------------------------------------------------------
// Recall
// ---------------------------------------------------------------------------

/** Recalling every identity in this item's batch. */
export function RecallDialog({
  open,
  onOpenChange,
  batchCode,
  impactCount,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchCode: string;
  impactCount?: number;
  pending: boolean;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useResetWhenOpened(open, () => setReason(""));

  return (
    <ActionDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Recall batch ${batchCode}`}
      description="A recall follows the batch wherever it went — including stock already dispatched, sold on, or sitting in a shop."
      confirmLabel="Issue recall"
      destructive
      disabled={!reason.trim()}
      pending={pending}
      onConfirm={() => onConfirm(reason.trim())}
    >
      {impactCount !== undefined && (
        <div className="rounded-lg border border-warning/30 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-warning-foreground">
          This affects <strong>{impactCount}</strong> identit
          {impactCount === 1 ? "y" : "ies"} across every organization currently
          holding them. All of them become unsellable immediately.
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Reason</Label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="What is wrong with this batch?"
          className="min-h-[90px]"
        />
        <p className="text-xs text-muted-foreground">
          Everyone holding stock from this batch sees this reason. Write it for
          them.
        </p>
      </div>
    </ActionDialog>
  );
}

export type { ItemAction };
