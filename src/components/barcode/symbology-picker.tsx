"use client";

import { QrCode, BarChart3, BookOpen, Truck, Store, Boxes } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSymbologies } from "@/hooks/barcodes";
import { cn } from "@/lib/utils";
import type {
  Symbology,
  SymbologySpec,
  SymbologyUse,
} from "@/services/barcode.service";

/**
 * The groups, in the order an operator thinks about them: the platform's own
 * identity first, then the code the destination reads.
 */
const GROUPS: {
  use: SymbologyUse;
  title: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    use: "IDENTITY",
    title: "Product identity",
    hint: "The platform's own code — scanned by a phone, verified by a consumer",
    icon: QrCode,
  },
  {
    use: "RETAIL",
    title: "Retail till",
    hint: "Read at a point of sale",
    icon: Store,
  },
  {
    use: "PUBLICATION",
    title: "Books & publications",
    hint: "Read by booksellers and libraries",
    icon: BookOpen,
  },
  {
    use: "LOGISTICS",
    title: "Cartons & pallets",
    hint: "Read across a warehouse, through shrink-wrap",
    icon: Truck,
  },
  {
    use: "INTERNAL",
    title: "Internal labels",
    hint: "Never leaves the business — bins, work orders, shelf labels",
    icon: Boxes,
  },
];

interface SymbologyPickerProps {
  value: Symbology | undefined;
  onChange: (symbology: Symbology) => void;
  /** Narrows the list — a book label has no business offering an SSCC. */
  only?: SymbologyUse[];
  /** Hide types that cannot encode this kind of value (e.g. Codabar on ST- serials). */
  exclude?: Symbology[];
  disabled?: boolean;
  className?: string;
}

/**
 * Choosing which kind of code to print.
 *
 * Grouped by where the label is going rather than by how the code works,
 * because that is the question the operator actually has. Nobody printing a
 * carton label is deciding between "linear" and "matrix"; they are deciding
 * whether the forklift driver's scanner will read it.
 */
export function SymbologyPicker({
  value,
  onChange,
  only,
  exclude,
  disabled,
  className,
}: SymbologyPickerProps) {
  const { data, isLoading } = useSymbologies();

  const groups = GROUPS.filter((g) => !only || only.includes(g.use)).map(
    (group) => ({
      ...group,
      entries: (data?.symbologies ?? []).filter(
        (s) =>
          s.use === group.use &&
          !(exclude && exclude.includes(s.symbology)),
      ),
    }),
  ).filter((group) => group.entries.length > 0);

  const selectedLabel = (data?.symbologies ?? []).find(
    (s) => s.symbology === value,
  )?.label;

  return (
    <Select
      value={value}
      onValueChange={(v) => v && onChange(v as Symbology)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue
          placeholder={isLoading ? "Loading code types…" : "Choose a code type…"}
        >
          {selectedLabel}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[420px]">
        {groups.map((group) => {
          const Icon = group.icon;
          return (
            <SelectGroup key={group.use}>
              <SelectLabel className="flex items-center gap-1.5 pt-2 text-[13px] font-bold uppercase tracking-wider text-faint">
                <Icon className="size-3" />
                {group.title}
              </SelectLabel>
              {group.entries.map((spec) => (
                <SelectItem key={spec.symbology} value={spec.symbology}>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{spec.label}</span>
                    <span className="rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {spec.dimension}
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}

/**
 * What the chosen code is for and what it will accept.
 *
 * Shown beside the picker rather than buried in a tooltip: an operator who
 * picks ITF-14 for a retail pack finds out at the till, and the point of
 * writing this down is that they find out here instead.
 */
export function SymbologyNote({ spec }: { spec: SymbologySpec | undefined }) {
  if (!spec) return null;

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <BarChart3 className="size-3.5 shrink-0 text-primary" />
        <span className="text-xs font-semibold text-foreground">
          {spec.label}
        </span>
        <span className="rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {spec.dimension}
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        {spec.purpose}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-faint">
        <span className="font-medium">Accepts:</span> {spec.accepts}
      </p>
    </div>
  );
}
