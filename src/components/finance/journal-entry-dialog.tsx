"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Scale, AlertCircle } from "lucide-react";
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
import { useAccounts, useCostCentres } from "@/hooks/finance";
import { cn } from "@/lib/utils";

interface Line {
  key: number;
  accountId: string;
  costCentreId: string;
  debit: string;
  credit: string;
}

export interface JournalDraft {
  description: string;
  postedOn: string;
  lines: {
    accountId: number;
    costCentreId?: number;
    debit: number;
    credit: number;
  }[];
}

/**
 * Posting a journal entry.
 *
 * The one form on the dashboard that cannot be a flat field list: an entry is a
 * description, a date, and two or more lines that must balance. The balance is
 * shown live rather than checked on submit, because "debits must equal credits"
 * discovered after clicking Post means re-reading six rows to find the typo —
 * whereas a running total shows which side is short while it is still being
 * typed.
 *
 * A line moves one side only. Entering both a debit and a credit on the same
 * row is not a compound entry, it is a mistake, and it is refused here rather
 * than being silently netted off.
 */
export function JournalEntryDialog({
  open,
  onOpenChange,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  onSubmit: (draft: JournalDraft) => void;
}) {
  const { data: accounts } = useAccounts();
  const { data: costCentres } = useCostCentres();

  const [description, setDescription] = useState("");
  const [postedOn, setPostedOn] = useState(today());
  const [lines, setLines] = useState<Line[]>([blankLine(), blankLine()]);
  const [touched, setTouched] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDescription("");
      setPostedOn(today());
      setLines([blankLine(), blankLine()]);
      setTouched(false);
    }
  }

  const chart = accounts ?? [];
  const centres = costCentres ?? [];

  const setLine = (key: number, patch: Partial<Line>) =>
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );

  const usable = lines.filter(
    (line) => line.accountId && (numberOf(line.debit) > 0 || numberOf(line.credit) > 0),
  );

  const totalDebit = usable.reduce((sum, l) => sum + numberOf(l.debit), 0);
  const totalCredit = usable.reduce((sum, l) => sum + numberOf(l.credit), 0);
  // Money in two decimal places; comparing floats directly would reject an
  // entry that balances to the cent.
  const balanced = Math.abs(totalDebit - totalCredit) < 0.005;

  const bothSides = lines.some(
    (line) => numberOf(line.debit) > 0 && numberOf(line.credit) > 0,
  );

  const complete =
    description.trim() && postedOn && usable.length >= 2 && balanced && !bothSides;

  const submit = () => {
    setTouched(true);
    if (!complete) return;
    onSubmit({
      description: description.trim(),
      postedOn,
      lines: usable.map((line) => ({
        accountId: Number(line.accountId),
        costCentreId: line.costCentreId ? Number(line.costCentreId) : undefined,
        debit: numberOf(line.debit),
        credit: numberOf(line.credit),
      })),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post a journal entry</DialogTitle>
          <DialogDescription>
            Every entry balances: the debits and the credits have to come to the
            same total. Entries are permanent — a mistake is corrected by
            posting a reversing entry, not by editing this one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Description</Label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this entry records"
                className={cn(touched && !description.trim() && "border-danger")}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Posted on</Label>
              <Input
                type="date"
                value={postedOn}
                onChange={(e) => setPostedOn(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Lines</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => setLines((prev) => [...prev, blankLine()])}
              >
                <Plus className="size-3" />
                Add line
              </Button>
            </div>

            {chart.length === 0 ? (
              <div className="rounded-lg border border-warning/30 bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-warning-foreground">
                There are no accounts yet. Build the chart of accounts first —
                an entry has to post against something.
              </div>
            ) : (
              <div className="space-y-2">
                {lines.map((line) => {
                  const clash =
                    numberOf(line.debit) > 0 && numberOf(line.credit) > 0;

                  return (
                    <div
                      key={line.key}
                      className={cn(
                        "grid grid-cols-[1fr_130px_110px_110px_auto] items-end gap-2 rounded-lg border p-2",
                        clash ? "border-danger/40 bg-red-50" : "border-border",
                      )}
                    >
                      <div className="min-w-0 space-y-1">
                        <Label className="text-[10px] text-faint">Account</Label>
                        <Select
                          value={line.accountId}
                          onValueChange={(v) => setLine(line.key, { accountId: v ?? "" })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose…" />
                          </SelectTrigger>
                          <SelectContent>
                            {chart.map((account) => (
                              <SelectItem key={account.id} value={String(account.id)}>
                                <span className="flex items-center gap-2">
                                  <span className="font-mono text-xs">
                                    {account.code}
                                  </span>
                                  <span>{account.name}</span>
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-faint">Cost centre</Label>
                        <Select
                          value={line.costCentreId}
                          onValueChange={(v) =>
                            setLine(line.key, { costCentreId: v ?? "" })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="—" />
                          </SelectTrigger>
                          <SelectContent>
                            {centres.map((centre) => (
                              <SelectItem key={centre.id} value={String(centre.id)}>
                                {centre.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-faint">Debit</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.debit}
                          onChange={(e) =>
                            setLine(line.key, { debit: e.target.value })
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-faint">Credit</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          value={line.credit}
                          onChange={(e) =>
                            setLine(line.key, { credit: e.target.value })
                          }
                          placeholder="0.00"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-9 p-0 text-faint hover:text-danger"
                        disabled={lines.length <= 2}
                        onClick={() =>
                          setLines((prev) => prev.filter((l) => l.key !== line.key))
                        }
                        aria-label="Remove this line"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* The running balance. This is the thing the form exists to get
              right, so it is always on screen rather than surfacing on submit. */}
          {chart.length > 0 && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm",
                usable.length === 0
                  ? "border-border bg-muted/40 text-muted-foreground"
                  : balanced
                    ? "border-success/30 bg-emerald-50 text-success"
                    : "border-warning/30 bg-amber-50 text-warning-foreground",
              )}
            >
              <Scale className="size-4 shrink-0" />
              <span className="font-mono">
                Dr {money(totalDebit)} · Cr {money(totalCredit)}
              </span>
              <span className="ml-auto text-xs font-medium">
                {usable.length === 0
                  ? "Nothing entered yet"
                  : balanced
                    ? "Balanced"
                    : `Out by ${money(Math.abs(totalDebit - totalCredit))}`}
              </span>
            </div>
          )}

          {bothSides && (
            <Problem>
              A line moves one side only. Put the debit and the credit on
              separate lines.
            </Problem>
          )}

          {touched && usable.length < 2 && chart.length > 0 && !bothSides && (
            <Problem>
              An entry needs at least two lines — something given and something
              received.
            </Problem>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={pending || chart.length === 0}>
            {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Post entry
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

function Problem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-danger/20 bg-red-50 px-3 py-2 text-xs leading-relaxed text-danger">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

let nextKey = 0;
function blankLine(): Line {
  return { key: nextKey++, accountId: "", costCentreId: "", debit: "", credit: "" };
}

function numberOf(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function money(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}
