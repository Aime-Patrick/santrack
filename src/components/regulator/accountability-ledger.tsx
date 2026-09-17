"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Clock,
  FileBadge,
  Megaphone,
  Package,
  ShieldAlert,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AccountabilityEntry } from "@/services/accountability.service";

const SOURCE_CONFIG: Record<
  AccountabilityEntry["source"],
  { color: string; icon: React.ComponentType<{ className?: string }>; label: string }
> = {
  CASE: { color: "bg-danger", icon: ShieldAlert, label: "Case" },
  LICENSE: { color: "bg-rwanda-blue", icon: FileBadge, label: "Licence" },
  INSPECTION: { color: "bg-rwanda-yellow", icon: ClipboardCheck, label: "Inspection" },
  TRACEABILITY: { color: "bg-rwanda-green", icon: Package, label: "Traceability" },
  FINDING: { color: "bg-danger", icon: AlertTriangle, label: "Finding" },
  COMPLAINT: { color: "bg-rwanda-blue", icon: Megaphone, label: "Consumer report" },
};

const TYPE_COLORS: Record<string, string> = {
  OPENED: "bg-rwanda-blue text-white",
  ASSIGNED: "bg-rwanda-blue text-white",
  STATUS_CHANGED: "bg-muted-foreground text-white",
  INSPECTION_RECORDED: "bg-rwanda-yellow text-white",
  EVIDENCE_SUBMITTED: "bg-rwanda-green text-white",
  RECALL_RECOVERY_RECORDED: "bg-danger text-white",
  REFERRED: "bg-rwanda-yellow text-white",
  SUBMITTED: "bg-rwanda-blue text-white",
  APPROVED: "bg-rwanda-green text-white",
  REJECTED: "bg-danger text-white",
  SUSPENDED: "bg-rwanda-yellow text-white",
  REVOKED: "bg-danger text-white",
  DISPATCHED: "bg-rwanda-blue text-white",
  RECEIVED: "bg-rwanda-green text-white",
  SOLD: "bg-rwanda-blue text-white",
  RECALLED: "bg-danger text-white",
  MANUFACTURED: "bg-rwanda-green text-white",
  QC_PASSED: "bg-rwanda-green text-white",
  QC_FAILED: "bg-danger text-white",
  COMPLAINT_RECEIVED: "bg-rwanda-blue text-white",
  PROMOTED: "bg-rwanda-yellow text-white",
  DISMISSED: "bg-muted-foreground text-white",
  PASS: "bg-rwanda-green text-white",
  CONDITIONAL: "bg-rwanda-yellow text-white",
  FAIL: "bg-danger text-white",
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const } },
};

/** Collapse legacy per-unit RECALLED/RELEASED rows into one lot-level entry. */
function collapseLotLifecycleEntries(entries: AccountabilityEntry[]): AccountabilityEntry[] {
  const out: AccountabilityEntry[] = [];
  const groups = new Map<string, AccountabilityEntry>();

  for (const entry of entries) {
    if (
      entry.source !== "TRACEABILITY" ||
      (entry.type !== "RECALLED" && entry.type !== "RELEASED")
    ) {
      out.push(entry);
      continue;
    }

    const notes =
      typeof entry.detail?.notes === "string" ? entry.detail.notes.trim() : "";
    const window = Math.floor(new Date(entry.recordedAt).getTime() / (10 * 60_000));
    const key = [entry.type, entry.actorEmail ?? entry.actor ?? "", notes, window].join("|");

    const existing = groups.get(key);
    if (!existing) {
      const copy: AccountabilityEntry = {
        ...entry,
        detail: entry.detail ? { ...entry.detail } : { quantity: 0, notes },
      };
      groups.set(key, copy);
      out.push(copy);
      continue;
    }

    const prevQty =
      typeof existing.detail?.quantity === "number" ? existing.detail.quantity : 0;
    const addQty =
      typeof entry.detail?.quantity === "number" ? entry.detail.quantity : 0;
    const quantity = prevQty + addQty;
    existing.detail = {
      ...(existing.detail ?? {}),
      quantity,
      notes: notes || existing.detail?.notes,
    };
    const action = entry.type === "RECALLED" ? "Lot recalled" : "Recall lifted";
    const parts = [action];
    if (quantity) parts.push(`${quantity} units`);
    if (notes) parts.push(notes);
    existing.summary = parts.join(" — ");
  }

  return out;
}

interface AccountabilityLedgerProps {
  entries: AccountabilityEntry[];
  title?: string;
  description?: string;
}

export function AccountabilityLedger({
  entries,
  title = "Accountability ledger",
  description = "Everything that touched this entity — who acted, what was decided, and what evidence exists.",
}: AccountabilityLedgerProps) {
  const displayEntries = useMemo(
    () => collapseLotLifecycleEntries(entries),
    [entries],
  );

  if (displayEntries.length === 0) {
    return (
      <div className="py-10 text-center">
        <Clock className="mx-auto mb-3 size-7 text-border" />
        <p className="text-sm text-muted-foreground">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div>
      {title || description ? (
        <div className="mb-4">
          {title ? <h3 className="text-base font-semibold">{title}</h3> : null}
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
      ) : null}

      <div className="relative pl-5 sm:pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border sm:left-[11px]" />

        <motion.div
          className="space-y-0"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {displayEntries.map((entry, idx) => {
            const isLast = idx === displayEntries.length - 1;
            const sourceConfig = SOURCE_CONFIG[entry.source];
            const SourceIcon = sourceConfig.icon;
            const typeColor = TYPE_COLORS[entry.type] ?? sourceConfig.color;

            return (
              <motion.div key={`${entry.source}-${entry.id}`} variants={fadeUp} className="relative">
                <div className="flex gap-3 sm:gap-4">
                  {/* Dot */}
                  <div className="relative z-10 flex shrink-0 items-start pt-0.5">
                    <div
                      className={cn(
                        "flex size-6 items-center justify-center rounded-full ring-4 ring-background transition-transform sm:size-7",
                        typeColor,
                      )}
                    >
                      <SourceIcon className="size-3 text-white sm:size-3.5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className={cn("min-w-0 flex-1", isLast ? "" : "pb-5")}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-medium tracking-wide",
                          typeColor.includes("text-") ? typeColor : `${typeColor} text-white`,
                        )}
                      >
                        {entry.type.replace(/_/g, " ")}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-border/50"
                      >
                        {sourceConfig.label}
                      </Badge>
                      <span className="text-[13px] text-muted-foreground">
                        {new Date(entry.recordedAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-foreground">
                      {entry.summary}
                    </p>

                    {(entry.actor || entry.organization) && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground">
                          {(entry.actor ?? "?").charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-foreground/80">
                          {entry.actor}
                        </span>
                        {entry.organization && (
                          <>
                            <span className="text-muted-foreground/50">at</span>
                            <span>{entry.organization}</span>
                          </>
                        )}
                      </p>
                    )}

                    {/* Show detail notes if present */}
                    {(() => {
                      const notes = entry.detail?.notes;
                      const note = entry.detail?.note;
                      const text =
                        typeof notes === "string" &&
                        notes !== entry.summary &&
                        !entry.summary.includes(notes)
                          ? notes
                          : typeof note === "string" &&
                              note !== entry.summary &&
                              !entry.summary.includes(note)
                            ? note
                            : null;
                      if (text === null) return null;
                      return (
                        <p className="mt-1 text-xs text-muted-foreground italic">
                          &ldquo;{text}&rdquo;
                        </p>
                      );
                    })()}
                    {typeof entry.detail?.locationHint === "string" &&
                    entry.detail.locationHint.length > 0 ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" />
                        {entry.detail.locationHint}
                      </p>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
