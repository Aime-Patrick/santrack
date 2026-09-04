"use client";

import { motion } from "framer-motion";
import {
  Building2,
  ClipboardCheck,
  Clock,
  FileBadge,
  Megaphone,
  Package,
  ShieldAlert,
  ShieldCheck,
  Truck,
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
  LICENSE: { color: "bg-blue-600", icon: FileBadge, label: "Licence" },
  INSPECTION: { color: "bg-amber-500", icon: ClipboardCheck, label: "Inspection" },
  TRACEABILITY: { color: "bg-emerald-600", icon: Package, label: "Traceability" },
  FINDING: { color: "bg-orange-500", icon: AlertTriangle, label: "Finding" },
  COMPLAINT: { color: "bg-rose-600", icon: Megaphone, label: "Consumer report" },
};

const TYPE_COLORS: Record<string, string> = {
  OPENED: "bg-blue-600",
  ASSIGNED: "bg-sky-600",
  STATUS_CHANGED: "bg-slate-600",
  INSPECTION_RECORDED: "bg-amber-500",
  EVIDENCE_SUBMITTED: "bg-teal-600",
  RECALL_RECOVERY_RECORDED: "bg-danger",
  REFERRED: "bg-cyan-600",
  SUBMITTED: "bg-blue-500",
  APPROVED: "bg-emerald-600",
  REJECTED: "bg-danger",
  SUSPENDED: "bg-amber-600",
  REVOKED: "bg-danger",
  DISPATCHED: "bg-blue-600",
  RECEIVED: "bg-emerald-600",
  SOLD: "bg-primary",
  RECALLED: "bg-danger",
  MANUFACTURED: "bg-emerald-600",
  QC_PASSED: "bg-teal-600",
  QC_FAILED: "bg-danger",
  COMPLAINT_RECEIVED: "bg-rose-600",
  PROMOTED: "bg-orange-600",
  DISMISSED: "bg-slate-500",
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const } },
};

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
  if (entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <Clock className="mx-auto mb-3 size-8 text-border" />
        <p className="text-sm text-muted-foreground">No events recorded yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      <div className="relative pl-5 sm:pl-6">
        {/* Vertical line */}
        <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border sm:left-[11px]" />

        <motion.div
          className="space-y-0"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          {entries.map((entry, idx) => {
            const isLast = idx === entries.length - 1;
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
                          "inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white",
                          typeColor,
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
                      <span className="text-[11px] text-muted-foreground">
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
                        typeof notes === "string" && notes !== entry.summary
                          ? notes
                          : typeof note === "string" && note !== entry.summary
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
