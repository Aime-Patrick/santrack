"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCreateCategory, useUpdateCategory } from "@/hooks/products";
import { deriveCode } from "@/lib/derive-code";
import type { ProductCategory } from "@/services/product.service";

type CategoryRef = Pick<ProductCategory, "id" | "code" | "name">;

/** Create when given no category, edit when given one. */
export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onCreated,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category?: CategoryRef;
  onCreated?: (category: ProductCategory) => void;
  onSaved?: () => void;
}) {
  const editing = category !== undefined;
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const [name, setName] = useState("");
  const [seeded, setSeeded] = useState<number | null>(null);
  const key = category?.id ?? 0;
  if (open && seeded !== key) {
    setSeeded(key);
    setName(category?.name ?? "");
  }

  const pending = createMutation.isPending || updateMutation.isPending;
  const derivedCode = deriveCode(name);
  const valid = name.trim().length >= 2 && (editing || derivedCode.length >= 2);

  const submit = async () => {
    if (editing) {
      await updateMutation.mutateAsync({
        id: category.id,
        name: name.trim(),
      });
      onOpenChange(false);
      onSaved?.();
    } else {
      const created = await createMutation.mutateAsync({
        name: name.trim(),
      });
      onOpenChange(false);
      onCreated?.(created);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-md">
        <DialogTitle>{editing ? "Edit Category" : "New Category"}</DialogTitle>
        <DialogDescription>
          {editing
            ? `Filed as ${category.code}, which is fixed — products and rules refer to it.`
            : "A kind of goods products can be filed under."}
        </DialogDescription>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase text-muted-foreground">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dairy products"
              autoFocus
            />
            {!editing && (
              <p className="text-xs text-faint">
                Filed as{" "}
                <span className="font-mono text-muted-foreground">
                  {derivedCode || "—"}
                </span>
                , the name rules and integrations refer to. Fixed once created.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={submit} disabled={!valid || pending}>
              {pending && <LoaderCircle className="mr-1 size-3 animate-spin" />}
              {editing ? "Save changes" : "Create category"}
            </Button>
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
