"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert, LoaderCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRegulatorySignals } from "@/hooks/regulatory-signals";
import { FLAG_DANGER, FLAG_YELLOW } from "@/lib/badge-tones";
import { INTEL_PAGE_SIZE, QueueToolbar } from "@/components/regulator/queue-toolbar";
import type { RegulatorySignal } from "@/services/regulatory-signal.service";

function openSignal(signal: RegulatorySignal) {
  if (signal.batchId) return `/dashboard/recall/${signal.batchId}`;
  if (signal.itemCode) return `/dashboard/manufacturing/trace`;
  return null;
}

export function SignalWatch() {
  const router = useRouter();
  const { data: signals = [], isLoading } = useRegulatorySignals();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return signals;
    return signals.filter((signal) => {
      const haystack = [
        signal.title,
        signal.detail,
        signal.batchCode ?? "",
        signal.itemCode ?? "",
        signal.severity,
        signal.type,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [signals, query]);

  useEffect(() => {
    setPage(0);
  }, [query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / INTEL_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * INTEL_PAGE_SIZE, safePage * INTEL_PAGE_SIZE + INTEL_PAGE_SIZE);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4">
        <div>
          <CardTitle className="text-base">Pattern watch</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Signals to investigate, not findings or enforcement decisions. Click a row to open the related batch or trace.
          </p>
        </div>
        <Badge variant="outline">{filtered.length} signals</Badge>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : signals.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No matching patterns detected.
          </div>
        ) : (
          <>
            <QueueToolbar
              query={query}
              onQuery={setQuery}
              placeholder="Search signal, batch, identity, or severity…"
              total={filtered.length}
              page={safePage}
              pageSize={INTEL_PAGE_SIZE}
              onPage={setPage}
            />
            {filtered.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                No signals match that search.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted hover:bg-muted">
                    <TableHead>Signal</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Last seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((signal, index) => {
                    const href = openSignal(signal);
                    return (
                      <TableRow
                        key={`${signal.type}-${signal.itemCode ?? signal.batchCode}-${index}`}
                        className={href ? "cursor-pointer hover:bg-muted/40" : undefined}
                        onClick={() => {
                          if (href) router.push(href);
                        }}
                      >
                        <TableCell>
                          <div className="flex items-start gap-2">
                            <TriangleAlert
                              className={
                                signal.severity === "HIGH"
                                  ? "mt-0.5 size-3.5 shrink-0 text-danger"
                                  : "mt-0.5 size-3.5 shrink-0 text-warning"
                              }
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{signal.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                {signal.detail}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={signal.severity === "HIGH" ? FLAG_DANGER : FLAG_YELLOW}>
                            {signal.severity === "HIGH" ? "High attention" : "Watch"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">
                            {signal.itemCode ?? signal.batchCode ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(signal.lastSeenAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
