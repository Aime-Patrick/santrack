"use client";

import { useState } from "react";
import { ScanLine, Search, LoaderCircle, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { regulatoryFieldScanService, type FieldScanResult } from "@/services/regulatory-field-scan.service";
import { useRegulatoryCases } from "@/hooks/regulatory-cases";
import { useBatchTimeline, useProductTimeline } from "@/hooks/accountability";
import { AccountabilityLedger } from "@/components/regulator/accountability-ledger";
import { getApiErrorMessage } from "@/lib/api";

export function FieldInspectionMode() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<FieldScanResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { data: cases = [] } = useRegulatoryCases();
  const linked = result ? cases.filter((caseRecord) =>
    (result.batchId && caseRecord.batch?.id === result.batchId) ||
    (result.facilityId && caseRecord.facility?.id === result.facilityId)
  ) : [];

  // Scanning is the accountability view: resolve the subject the code names,
  // then show its full multi-source ledger right under the scan result.
  const ledgerSubject =
    result && result.kind !== "UNKNOWN"
      ? result.batchId
        ? ({ kind: "batch" as const, id: result.batchId })
        : result.productId
          ? ({ kind: "product" as const, id: result.productId })
          : null
      : null;
  const batchEntriesQuery = useBatchTimeline(ledgerSubject?.kind === "batch" ? ledgerSubject.id : 0, 40);
  const productEntriesQuery = useProductTimeline(ledgerSubject?.kind === "product" ? ledgerSubject.id : 0, 40);
  const ledgerQuery = ledgerSubject?.kind === "product" ? productEntriesQuery : batchEntriesQuery;

  async function scan() {
    if (!code.trim()) return;
    setLoading(true); setError("");
    try { setResult(await regulatoryFieldScanService.resolve(code.trim())); }
    catch (reason) { setResult(null); setError(getApiErrorMessage(reason) || "Could not resolve this scan."); }
    finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ScanLine className="size-5 text-primary" /> Field inspection
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Scan the product, unit, or site label. The scan shows everything that
          happened to it; the linked open case appears below to record the inspection.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            autoFocus
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && scan()}
            placeholder="Scan product QR, batch, or location label"
            className="h-11 text-base"
          />
          <Button className="h-11" disabled={loading || !code.trim()} onClick={scan}>
            {loading ? <LoaderCircle className="size-4 animate-spin" /> : <Search className="size-4" />}
            <span className="sr-only">Resolve scan</span>
          </Button>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {result && (
          <div className="rounded-lg bg-muted/45 p-3">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 text-primary" />
              <div>
                <p className="text-sm font-medium">{result.describes}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.kind === "UNKNOWN"
                    ? "No identity was found. Treat this as a signal and record the evidence in triage."
                    : "Scan resolved. The ledger below shows everything recorded against this subject."}
                </p>
              </div>
            </div>
          </div>
        )}

        {result && result.kind !== "UNKNOWN" && ledgerSubject && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {ledgerSubject.kind === "product" ? "Product timeline" : "Batch timeline"}
            </p>
            {ledgerQuery.isLoading ? (
              <div className="flex justify-center py-8">
                <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <AccountabilityLedger entries={ledgerQuery.data ?? []} />
            )}
          </div>
        )}

        {result && linked.length > 0 && (
          <div className="divide-y rounded-lg border">
            {linked.map((caseRecord) => (
              <button
                key={caseRecord.id}
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("santrack:open-case", { detail: caseRecord.id }))}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40 cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{caseRecord.title}</p>
                  <p className="text-xs text-muted-foreground">{caseRecord.caseNumber} · {caseRecord.status}</p>
                </div>
                <Badge variant="outline">Record inspection</Badge>
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {result && result.kind !== "UNKNOWN" && linked.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No open case is linked to this scan. Review the signals or triage queue before opening one.
          </p>
        )}
      </CardContent>
    </Card>
  );
}