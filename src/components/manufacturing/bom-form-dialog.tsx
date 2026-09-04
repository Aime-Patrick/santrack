"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Layers } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/products";
import { useRawMaterials } from "@/hooks/manufacturing";
import { cn } from "@/lib/utils";

interface Line {
  /** Local row id — materials can be re-chosen, so index is not stable. */
  key: number;
  materialId: string;
  quantityPerUnit: string;
  wastagePercent: string;
}

export interface BomDraft {
  name: string;
  productId: number;
  lines: {
    materialId: number;
    quantityPerUnit: number;
    wastagePercent?: number;
  }[];
}

/**
 * Writing a bill of materials.
 *
 * Not built on the shared resource form: a BOM is a header plus a variable
 * number of material lines, "each with its own quantity and wastage", and
 * bending a flat field list into that shape would make both harder to read.
 *
 * Wastage is per line rather than per BOM because it is a property of the
 * material and the process that consumes it — resin loses more to purging than
 * a printed label loses to misfeeds — and one figure for the whole recipe
 * quietly over-orders one input and under-orders the other.
 */
export function BomFormDialog({
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (draft: BomDraft) => void;
}) {
  const { data: productsData } = useProducts(0, 200);
  const { data: materials } = useRawMaterials();

  const [name, setName] = useState("");
  const [productId, setProductId] = useState("");
  const [lines, setLines] = useState<Line[]>([blankLine()]);
  const [touched, setTouched] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // Reset during render, so the previous recipe is never briefly on screen.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setProductId("");
      setLines([blankLine()]);
      setTouched(false);
    }
  }

  const products = productsData?.content ?? [];
  const catalogue = materials ?? [];

  const usable = lines.filter(
    (line) => line.materialId && Number(line.quantityPerUnit) > 0,
  );
  const complete = name.trim() && productId && usable.length > 0;

  const setLine = (key: number, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  const submit = () => {
    setTouched(true);
    if (!complete) return;
    onSubmit({
      name: name.trim(),
      productId: Number(productId),
      lines: usable.map((line) => ({
        materialId: Number(line.materialId),
        quantityPerUnit: Number(line.quantityPerUnit),
        wastagePercent: line.wastagePercent
          ? Number(line.wastagePercent)
          : undefined,
      })),
    });
  };

  /** Materials already on the recipe, so the same one is not listed twice. */
  const takenBy = (key: number) =>
    new Set(
      lines.filter((line) => line.key !== key).map((line) => line.materialId),
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a bill of materials</DialogTitle>
          <DialogDescription>
            What one unit of a product consumes. Production orders use this to
            work out how much to allocate, "so the quantities here are per single
            unit", not per run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 500 mL bottle — standard"
                className={cn(touched && !name.trim() && "border-danger")}
              />
              <p className="text-xs text-muted-foreground">
                Recipes get revised; name it so the next version is
                distinguishable.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Product</Label>
              <Select value={productId} onValueChange={(v) => setProductId(v ?? "")}>
                <SelectTrigger
                  className={cn("w-full", touched && !productId && "border-danger")}
                >
                  <SelectValue placeholder="What this makes…" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={String(product.id)}>
                      <span className="flex items-center gap-2">
                        <span>{product.name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {product.sku}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Material lines ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Materials per unit</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setLines((prev) => [...prev, blankLine()])}
              >
                <Plus className="size-3" />
                Add material
              </Button>
            </div>

            {catalogue.length === 0 ? (
              <div className="rounded-lg border border-warning/30 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-warning-foreground">
                There are no raw materials in the catalogue yet. Add them under
                Raw Materials first — a recipe can only draw on what is
                registered.
              </div>
            ) : (
              <div className="space-y-2">
                {lines.map((line) => {
                  const taken = takenBy(line.key);
                  const material = catalogue.find(
                    (m) => String(m.id) === line.materialId,
                  );

                  return (
                    <div
                      key={line.key}
                      className="grid grid-cols-[1fr_100px_100px_auto] items-end gap-2 rounded-lg border border-border p-2"
                    >
                      <div className="min-w-0 space-y-1">
                        <Label className="text-[10px] text-faint">Material</Label>
                        <Select
                          value={line.materialId}
                          onValueChange={(v) =>
                            setLine(line.key, { materialId: v ?? "" })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose…" />
                          </SelectTrigger>
                          <SelectContent>
                            {catalogue
                              .filter((m) => !taken.has(String(m.id)))
                              .map((m) => (
                                <SelectItem key={m.id} value={String(m.id)}>
                                  <span className="flex items-center gap-2">
                                    <span>{m.name}</span>
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {m.code}
                                    </span>
                                  </span>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-faint">
                          Qty{material ? ` (${material.unitOfMeasure})` : ""}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          step="any"
                          value={line.quantityPerUnit}
                          onChange={(e) =>
                            setLine(line.key, { quantityPerUnit: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-faint">Wastage %</Label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          value={line.wastagePercent}
                          onChange={(e) =>
                            setLine(line.key, { wastagePercent: e.target.value })
                          }
                          placeholder="0"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-9 p-0 text-faint hover:text-danger"
                        disabled={lines.length === 1}
                        onClick={() =>
                          setLines((prev) => prev.filter((l) => l.key !== line.key))
                        }
                        aria-label="Remove this material"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {touched && usable.length === 0 && catalogue.length > 0 && (
              <p className="text-xs text-danger">
                A bill of materials needs at least one material with a quantity
                above zero.
              </p>
            )}
          </div>

          {usable.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-primary-light px-3 py-2 text-xs text-muted-foreground">
              <Layers className="size-3.5 shrink-0 text-primary" />
              <span>
                {usable.length} material{usable.length === 1 ? "" : "s"} per unit.
                Lines left blank are ignored.
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || catalogue.length === 0}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create BOM
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

let nextKey = 0;
function blankLine(): Line {
  return {
    key: nextKey++,
    materialId: "",
    quantityPerUnit: "",
    wastagePercent: "",
  };
}
