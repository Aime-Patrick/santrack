"use client";

import { useState } from "react";
import {
  QrCode,
  BarChart3,
  BookOpen,
  Truck,
  Boxes,
  CheckCircle2,
} from "lucide-react";
import { BarcodePreview } from "./barcode-preview";
import { useSymbologies } from "@/hooks/barcodes";
import { cn } from "@/lib/utils";
import type { Symbology, SymbologySpec, SymbologyUse } from "@/services/barcode.service";

const GROUP_META: Record<
  SymbologyUse,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  IDENTITY: { label: "Product Identity", icon: QrCode },
  RETAIL: { label: "Retail & POS", icon: BarChart3 },
  LOGISTICS: { label: "Cartons & Logistics", icon: Truck },
  PUBLICATION: { label: "Books & Media", icon: BookOpen },
  INTERNAL: { label: "Internal Warehouse", icon: Boxes },
};

const USE_ORDER: SymbologyUse[] = [
  "IDENTITY",
  "RETAIL",
  "LOGISTICS",
  "PUBLICATION",
  "INTERNAL",
];

interface SymbologyPanelPickerProps {
  value: Symbology | undefined;
  onChange: (symbology: Symbology) => void;
  /** When set (e.g. product GTIN), preview encodes this instead of the catalogue example. */
  previewValue?: string;
  only?: SymbologyUse[];
  disabled?: boolean;
  className?: string;
}

/**
 * Three-panel barcode symbology selector with equal 3-column balance:
 *  1. Left: Categories (1/3 width)
 *  2. Middle: Subtypes list (1/3 width)
 *  3. Right: Prominent live preview + specs (1/3 width)
 */
export function SymbologyPanelPicker({
  value,
  onChange,
  previewValue,
  only,
  disabled,
  className,
}: SymbologyPanelPickerProps) {
  const { data, isLoading } = useSymbologies();

  const allSymbologies = data?.symbologies ?? [];
  const filtered = only
    ? allSymbologies.filter((s) => only.includes(s.use))
    : allSymbologies;

  const grouped = filtered.reduce<Record<string, SymbologySpec[]>>(
    (acc, spec) => {
      (acc[spec.use] ??= []).push(spec);
      return acc;
    },
    {},
  );

  const orderedUses = USE_ORDER.filter((u) => grouped[u]?.length);

  const selectedSpec = allSymbologies.find((s) => s.symbology === value);
  const defaultActiveUse: SymbologyUse =
    selectedSpec?.use ?? orderedUses[0] ?? "IDENTITY";

  const [activeUse, setActiveUse] = useState<SymbologyUse>(defaultActiveUse);

  const specsInActive = grouped[activeUse] ?? [];

  if (isLoading) {
    return (
      <div className="h-44 w-full animate-pulse rounded-xl border border-border bg-muted/30" />
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card shadow-xs",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/70">
        {/* ── 1. Category Sidebar (1/3) ── */}
        <div className="flex flex-col bg-muted/20 py-1">
          {orderedUses.map((use) => {
            const meta = GROUP_META[use];
            const Icon = meta.icon;
            const isActive = activeUse === use;
            const count = grouped[use]?.length ?? 0;
            return (
              <button
                key={use}
                type="button"
                onClick={() => {
                  setActiveUse(use);
                  const firstInGroup = grouped[use]?.[0];
                  if (firstInGroup && (!selectedSpec || selectedSpec.use !== use)) {
                    onChange(firstInGroup.symbology);
                  }
                }}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium transition-colors",
                  isActive
                    ? "bg-primary-light text-primary font-semibold border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent",
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("size-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span>{meta.label}</span>
                </div>
                <span className="text-[10px] text-muted-foreground/70 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 2. Symbology Subtypes List (1/3) ── */}
        <div className="flex flex-col overflow-y-auto max-h-[240px] py-1 bg-card">
          {specsInActive.map((spec) => {
            const isSelected = spec.symbology === value;
            return (
              <button
                key={spec.symbology}
                type="button"
                onClick={() => onChange(spec.symbology)}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 text-left transition-colors text-xs border-b last:border-0 border-border/40",
                  isSelected
                    ? "bg-primary-light text-primary font-semibold"
                    : "hover:bg-muted/60 text-foreground",
                )}
              >
                <div className="flex flex-col">
                  <span className="leading-snug">{spec.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{spec.dimension}</span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="size-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── 3. Live Barcode Preview & Details (1/3) ── */}
        <div className="flex flex-col justify-between p-4 bg-white dark:bg-card">
          {selectedSpec ? (
            <div className="space-y-3">
              {/* Centered Large Barcode Graphic */}
              <div className="flex items-center justify-center p-3 rounded-lg border border-border/50 bg-slate-100 dark:bg-muted/10 h-32">
                <BarcodePreview
                  symbology={selectedSpec.symbology}
                  value={previewValue?.trim() || selectedSpec.example}
                  scale={4}
                  showText={selectedSpec.printsText}
                  className="max-h-28 max-w-full object-contain"
                />
              </div>

              {/* Specification Details */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{selectedSpec.label}</span>
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground font-mono">
                    {selectedSpec.dimension}
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed line-clamp-2">
                  {selectedSpec.purpose}
                </p>
                <p className="text-[11px] text-muted-foreground/80 truncate">
                  <span className="font-medium text-foreground">Accepts:</span> {selectedSpec.accepts}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <QrCode className="size-8 opacity-20 mb-1" />
              <p className="text-xs">Select a code type to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
