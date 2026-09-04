"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Issue = "SUSPECTED_COUNTERFEIT" | "ILLNESS" | "DAMAGED" | "EXPIRED" | "OTHER";

export function ReportProductIssue({ token }: { token: string }) {
  const [open, setOpen] = useState(false);
  const [issue, setIssue] = useState<Issue>("SUSPECTED_COUNTERFEIT");
  const [note, setNote] = useState("");
  const [locationHint, setLocationHint] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [reference, setReference] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function submit() {
    setState("sending"); setError("");
    const form = new FormData();
    form.set("token", token); form.set("issue", issue);
    if (note.trim()) form.set("note", note.trim());
    if (locationHint.trim()) form.set("locationHint", locationHint.trim());
    if (photo) form.set("photo", photo);
    try {
      const { data } = await api.post<{ reference?: string }>("/api/public/complaints", form);
      setReference(data?.reference ?? null);
      setState("done");
    } catch (reason) {
      setError(getApiErrorMessage(reason) || "Could not send your report. Please try again."); setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl bg-success p-4 text-left text-white">
        <p className="text-sm font-bold">Thank you — your report was recorded.</p>
        {reference ? (
          <p className="mt-2 inline-block rounded-lg bg-white px-3 py-1.5 font-mono text-sm font-bold text-success">
            {reference}
          </p>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-white/90">
          Keep this reference if you follow up with the regulator. A safety
          officer will review your report.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="h-12 w-full rounded-2xl bg-primary text-xs font-bold text-white hover:bg-primary-dark"
      >
        <AlertTriangle className="mr-2 size-4" />
        Report a problem with this product
      </Button>
    );
  }

  return (
    <div className="space-y-3 text-left">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Report a product problem</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          className="h-7 px-2 text-slate-500 hover:text-slate-900"
          aria-label="Close report form"
        >
          <X className="size-4" />
        </Button>
      </div>
      <p className="text-xs leading-relaxed text-slate-600">
        Your scan is already attached. Do not include personal medical details.
      </p>
      <select
        aria-label="Issue type"
        value={issue}
        onChange={(event) => setIssue(event.target.value as Issue)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base"
      >
        <option value="SUSPECTED_COUNTERFEIT">Suspected fake product</option>
        <option value="ILLNESS">Made someone unwell</option>
        <option value="DAMAGED">Damaged or unsafe</option>
        <option value="EXPIRED">Expired product</option>
        <option value="OTHER">Other issue</option>
      </select>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="What happened? (optional)"
        className="min-h-20 rounded-xl text-base"
      />
      <Input
        value={locationHint}
        onChange={(event) => setLocationHint(event.target.value)}
        placeholder="Area or shop name (optional)"
        className="rounded-xl text-base"
      />
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
        className="rounded-xl text-base"
      />
      {error && <p className="text-sm font-semibold text-danger">{error}</p>}
      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary-dark"
          disabled={state === "sending"}
          onClick={() => void submit()}
        >
          {state === "sending" && <Loader2 className="mr-2 size-4 animate-spin" />}
          Send report
        </Button>
        <Button variant="outline" className="rounded-xl text-xs font-bold" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
