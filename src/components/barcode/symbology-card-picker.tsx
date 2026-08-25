"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarcodePreview } from "./barcode-preview";
import { useSymbologies } from "@/hooks/barcodes";
import { cn } from "@/lib/utils";
import type { Symbology, SymbologyUse } from "@/services/barcode.service";

const GROUP_LABELS: Record<SymbologyUse, string> = {
  IDENTITY: "Product Identity",
  RETAIL: "Retail & Point of Sale",
  PUBLICATION: "Books & Publications",
  LOGISTICS: "Cartons & Pallets",
  INTERNAL: "Internal Labels",
};

interface SymbologyDropdownProps {
  value: Symbology | undefined;
  onChange: (symbology: Symbology) => void;
  only?: SymbologyUse[];
  disabled?: boolean;
  className?: string;
}

export function SymbologyDropdown({
  value,
  onChange,
  only,
  disabled,
  className,
}: SymbologyDropdownProps) {
  const { data, isLoading } = useSymbologies();

  const allSymbologies = data?.symbologies ?? [];
  const filtered = only
    ? allSymbologies.filter((s) => only.includes(s.use))
    : allSymbologies;

  const grouped = filtered.reduce<Record<string, typeof filtered>>(
    (acc, spec) => {
      (acc[spec.use] ??= []).push(spec);
      return acc;
    },
    {},
  );

  const selected = allSymbologies.find((s) => s.symbology === value);

  if (isLoading) {
    return (
      <div className="h-10 w-full animate-pulse rounded-md border border-border bg-muted/30" />
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 md:grid-cols-[1fr_2fr]", className)}>
      {/* Left: dropdown + label */}
      <div className="flex flex-col gap-3">
        <Select
          value={value ?? ""}
          onValueChange={(v) => onChange(v as Symbology)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a code type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(grouped).map(([use, specs]) => (
              <SelectGroup key={use}>
                <SelectLabel>
                  {GROUP_LABELS[use as SymbologyUse] ?? use}
                </SelectLabel>
                {specs.map((spec) => (
                  <SelectItem key={spec.symbology} value={spec.symbology}>
                    {spec.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{selected.label}</span>
            <Badge variant="outline" className="text-[10px]">
              {selected.dimension}
            </Badge>
          </div>
        )}
      </div>

      {/* Right: big preview */}
      <div className="flex items-center justify-center">
        {selected ? (
          <div className="flex w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-white px-6 py-6">
            <BarcodePreview
              symbology={selected.symbology}
              value={selected.example}
              scale={4}
              showText={selected.printsText}
            />
          </div>
        ) : (
          <div className="flex h-full min-h-[140px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/10">
            <p className="text-xs text-muted-foreground">
              Select a code type to preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export { SymbologyNote } from "./symbology-picker";
