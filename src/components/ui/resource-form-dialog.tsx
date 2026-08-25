"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface BaseField {
  name: string;
  label: string;
  required?: boolean;
  /** A sentence under the field. Say what it is for, not what it is. */
  hint?: string;
  placeholder?: string;
  /** Half-width, so short fields sit side by side. */
  half?: boolean;
}

export type FormField =
  | (BaseField & { kind: "text"; mono?: boolean; uppercase?: boolean })
  | (BaseField & { kind: "number"; min?: number; step?: number; suffix?: string })
  | (BaseField & { kind: "textarea" })
  | (BaseField & { kind: "date" })
  | (BaseField & { kind: "month" })
  | (BaseField & { kind: "select"; options: SelectOption[]; emptyMessage?: string });

export type FormValues = Record<string, string>;

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel: string;
  pending?: boolean;
  onSubmit: (values: FormValues) => void;
}

/**
 * The create form behind every "Add …" button on the dashboard.
 *
 * Those buttons existed for a long time with no handler at all — they rendered,
 * they were clickable, and nothing happened. Every one of them had a working
 * mutation behind it already; what was missing was somewhere to type. Rather
 * than write fourteen near-identical dialogs and have them drift apart in
 * spacing, validation and error handling, each screen declares its fields and
 * this renders them.
 *
 * Deliberately not react-hook-form: these are flat forms of five or six fields
 * with no cross-field rules, and a schema per dialog would be more machinery
 * than the problem has. Anything with repeating rows or real validation — a
 * bill of materials, a journal entry — gets its own component instead of being
 * bent to fit this one.
 */
export function ResourceFormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  submitLabel,
  pending,
  onSubmit,
}: ResourceFormDialogProps) {
  const [values, setValues] = useState<FormValues>({});
  const [wasOpen, setWasOpen] = useState(open);
  const [touched, setTouched] = useState(false);

  // Clear the form as it opens, during render rather than in an effect —
  // otherwise the previous entry is briefly on screen, and a form that shows
  // the last vehicle's plate number is one somebody will submit by mistake.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues({});
      setTouched(false);
    }
  }

  const set = (name: string, value: string) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const missing = fields.filter(
    (field) => field.required && !values[field.name]?.trim(),
  );

  const submit = () => {
    setTouched(true);
    if (missing.length > 0) return;
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          {fields.map((field) => {
            const value = values[field.name] ?? "";
            const invalid = touched && field.required && !value.trim();

            return (
              <div
                key={field.name}
                className={cn("space-y-1.5", field.half ? "col-span-1" : "col-span-2")}
              >
                <Label className="text-xs">
                  {field.label}
                  {!field.required && (
                    <span className="ml-1 font-normal text-faint">(optional)</span>
                  )}
                </Label>

                <FieldInput
                  field={field}
                  value={value}
                  invalid={!!invalid}
                  onChange={(next) => set(field.name, next)}
                />

                {invalid ? (
                  <p className="text-xs text-danger">{field.label} is required</p>
                ) : field.hint ? (
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {field.hint}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function FieldInput({
  field,
  value,
  invalid,
  onChange,
}: {
  field: FormField;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  const ring = invalid ? "border-danger focus-visible:ring-danger/30" : undefined;

  switch (field.kind) {
    case "textarea":
      return (
        <Textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn("min-h-[70px]", ring)}
        />
      );

    case "select":
      return (
        <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
          <SelectTrigger className={cn("w-full", ring)}>
            <SelectValue
              placeholder={
                field.options.length === 0
                  ? (field.emptyMessage ?? "Nothing to choose from yet")
                  : (field.placeholder ?? "Choose…")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <span className="flex items-center gap-2">
                  <span>{option.label}</span>
                  {option.hint && (
                    <span className="text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "number":
      return (
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            min={field.min}
            step={field.step ?? 1}
            value={value}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={cn(field.suffix && "pr-14", ring)}
          />
          {field.suffix && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {field.suffix}
            </span>
          )}
        </div>
      );

    case "date":
    case "month":
      return (
        <Input
          type={field.kind}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={ring}
        />
      );

    default:
      return (
        <Input
          value={value}
          placeholder={field.placeholder}
          onChange={(e) =>
            onChange(field.uppercase ? e.target.value.toUpperCase() : e.target.value)
          }
          className={cn(field.mono && "font-mono", ring)}
        />
      );
  }
}

/** Reads a numeric field, treating blank as absent rather than as zero. */
export function num(values: FormValues, name: string): number | undefined {
  const raw = values[name]?.trim();
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Reads a text field, treating blank as absent. */
export function str(values: FormValues, name: string): string | undefined {
  return values[name]?.trim() || undefined;
}
