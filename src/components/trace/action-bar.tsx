"use client";

import {
  AlertTriangle,
  Ban,
  Flame,
  MapPin,
  PackageCheck,
  PackageMinus,
  PackageOpen,
  Printer,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Undo2,
  CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { AvailableAction, ItemAction } from "@/services/trace.service";

/** How each action presents itself, and how loudly. */
const PRESENTATION: Record<
  ItemAction,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    /** `destructive` actions are terminal or hard to walk back. */
    tone?: "default" | "destructive";
    group: "label" | "packaging" | "movement" | "lifecycle" | "compliance";
  }
> = {
  PRINT_LABEL: { label: "Print label", icon: Printer, group: "label" },

  PACK: { label: "Pack items in", icon: PackageCheck, group: "packaging" },
  OPEN: { label: "Open seal", icon: PackageOpen, group: "packaging" },
  REMOVE_CONTENT: { label: "Take item out", icon: PackageMinus, group: "packaging" },

  DISPATCH: { label: "Dispatch", icon: Truck, group: "movement" },
  RELOCATE: { label: "Relocate", icon: MapPin, group: "movement" },
  SELL: { label: "Sell", icon: ShoppingCart, group: "movement" },

  QUARANTINE: { label: "Quarantine", icon: ShieldAlert, group: "lifecycle" },
  RELEASE: { label: "Release", icon: ShieldCheck, group: "lifecycle" },
  RETURN: { label: "Return", icon: Undo2, group: "lifecycle" },
  DAMAGE: { label: "Record damage", icon: AlertTriangle, group: "lifecycle" },
  EXPIRE: { label: "Mark expired", icon: CalendarX, group: "lifecycle" },
  DESTROY: {
    label: "Destroy",
    icon: Flame,
    tone: "destructive",
    group: "lifecycle",
  },

  RECALL_BATCH: {
    label: "Recall batch",
    icon: Ban,
    tone: "destructive",
    group: "compliance",
  },
};

const GROUP_TITLES: Record<string, string> = {
  label: "Label",
  packaging: "Packaging",
  movement: "Movement",
  lifecycle: "Lifecycle",
  compliance: "Compliance",
};

const GROUP_ORDER = ["packaging", "label", "movement", "lifecycle", "compliance"];

interface ActionBarProps {
  actions: AvailableAction[];
  onAction: (action: ItemAction) => void;
  /** The action currently in flight, so its button can show progress. */
  pending?: ItemAction | null;
}

/**
 * Everything this operator can do to the identity in front of them.
 *
 * The point of this bar is that they have already scanned the thing. Sending
 * them to a Dispatch page to re-key the code they are holding is how the wrong
 * pallet gets shipped, so the operations come to the item instead.
 *
 * The list comes from the server, which resolved it against the caller's
 * capabilities and the item's current state — the same expression the API
 * guard uses. So a button that is here is a call that will be allowed, and a
 * button that is greyed out says why in a sentence rather than failing on
 * click.
 */
export function ActionBar({ actions, onAction, pending }: ActionBarProps) {
  const groups = GROUP_ORDER.map((group) => ({
    group,
    entries: actions.filter((a) => PRESENTATION[a.action]?.group === group),
  })).filter((g) => g.entries.length > 0);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Your role does not cover any operation on this item.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(({ group, entries }) => (
        <div key={group}>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-faint">
            {GROUP_TITLES[group]}
          </p>
          <div className="flex flex-wrap gap-2">
            {entries.map((entry) => (
              <ActionButton
                key={entry.action}
                entry={entry}
                onAction={onAction}
                pending={pending === entry.action}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActionButton({
  entry,
  onAction,
  pending,
}: {
  entry: AvailableAction;
  onAction: (action: ItemAction) => void;
  pending: boolean;
}) {
  const presentation = PRESENTATION[entry.action];
  if (!presentation) return null;

  const Icon = presentation.icon;

  const button = (
    <Button
      variant={presentation.tone === "destructive" ? "outline" : "outline"}
      size="sm"
      disabled={!entry.available || pending}
      onClick={() => onAction(entry.action)}
      className={cn(
        "gap-2",
        presentation.tone === "destructive" &&
          entry.available &&
          "border-danger/30 text-danger hover:bg-danger/5 hover:text-danger",
      )}
    >
      <Icon className="size-3.5" />
      {presentation.label}
    </Button>
  );

  // No reason means it is simply available; a tooltip saying nothing is worse
  // than no tooltip.
  if (entry.available || !entry.reason) {
    return button;
  }

  return (
    <Tooltip>
      {/* A disabled button fires no pointer events, so the tooltip needs
          something enabled to hang off — otherwise the explanation for why the
          button is off is itself unreachable. */}
      <TooltipTrigger
        render={<span className="inline-flex cursor-not-allowed" />}
      >
        {button}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-xs leading-relaxed">
        {entry.reason}
      </TooltipContent>
    </Tooltip>
  );
}
