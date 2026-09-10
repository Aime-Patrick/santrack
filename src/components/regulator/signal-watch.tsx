"use client";

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

export function SignalWatch() {
  const { data: signals = [], isLoading } = useRegulatorySignals();

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-border/70 py-4">
        <div>
          <CardTitle className="text-base">Pattern watch</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Signals to investigate, not findings or enforcement decisions.
          </p>
        </div>
        <Badge variant="outline">{signals.length} signals</Badge>
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
              {signals.slice(0, 8).map((signal, index) => (
                <TableRow key={`${signal.type}-${signal.itemCode ?? signal.batchCode}-${index}`}>
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
                    <Badge
                      variant="outline"
                      className={
                        signal.severity === "HIGH"
                          ? "border-danger/30 text-danger"
                          : "border-warning/30 text-warning-foreground"
                      }
                    >
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
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
