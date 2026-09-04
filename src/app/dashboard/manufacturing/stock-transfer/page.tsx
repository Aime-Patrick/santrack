"use client";

import { useState } from "react";
import { Truck, ArrowUpRight, ArrowDownLeft, Plus, Trash2, MapPin, Loader2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { type ColumnDef } from "@tanstack/react-table";
import { useOutgoingTransfers, useIncomingTransfers, useDispatchTransfer, useReceiveTransfer } from "@/hooks/transfers";
import { useItem } from "@/hooks/items";
import { useLocations } from "@/hooks/locations";
import { useOrganizations } from "@/hooks/organizations";
import { useResolveCode } from "@/hooks/scan";
import { cn } from "@/lib/utils";
import type { ScanResult } from "@/services/scan.service";
import type { Transfer } from "@/services/transfer.service";

const transferColumns: ColumnDef<TableFeatures, Transfer>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => <span className="font-medium">{row.getValue("reference")}</span>,
  },
  { accessorKey: "destinationOrganizationName", header: "Destination" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={status === "PENDING" ? "secondary" : status === "RECEIVED" ? "default" : "outline"}>{status}</Badge>;
    },
  },
  { accessorKey: "lineCount", header: "Items" },
  {
    accessorKey: "dispatchedAt",
    header: "Dispatched",
    cell: ({ row }) => row.getValue("dispatchedAt") ? new Date(row.getValue("dispatchedAt") as string).toLocaleDateString() : "—",
  },
];

const incomingColumns: ColumnDef<TableFeatures, Transfer>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => <span className="font-medium">{row.getValue("reference")}</span>,
  },
  { accessorKey: "sourceOrganizationName", header: "From" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={status === "PENDING" ? "secondary" : status === "RECEIVED" ? "default" : "outline"}>{status}</Badge>;
    },
  },
  { accessorKey: "lineCount", header: "Items" },
  {
    accessorKey: "dispatchedAt",
    header: "Dispatched",
    cell: ({ row }) => row.getValue("dispatchedAt") ? new Date(row.getValue("dispatchedAt") as string).toLocaleDateString() : "—",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const transfer = row.original;
      // API statuses: DISPATCHED / PARTIALLY_RECEIVED are open for receipt.
      // PENDING is not a transfer status (legacy UI check hid Receive forever).
      if (
        transfer.status !== "DISPATCHED" &&
        transfer.status !== "PARTIALLY_RECEIVED"
      ) {
        return null;
      }
      return <ReceiveButton transferId={transfer.id} />;
    },
  },
];

function ReceiveButton({ transferId }: { transferId: number }) {
  const receiveTransfer = useReceiveTransfer();
  return (
    <Button size="sm" onClick={() => receiveTransfer.mutate({ transferId })} disabled={receiveTransfer.isPending}>
      <ArrowDownLeft className="mr-1 size-3" /> Receive
    </Button>
  );
}

function ScannedItemRow({ code, onRemove }: { code: string; onRemove: () => void }) {
  const { data: item, isLoading } = useItem(code);
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant="outline" className="shrink-0 font-mono text-xs">{code}</Badge>
        {isLoading ? (
          <span className="text-xs text-muted-foreground">Loading...</span>
        ) : item ? (
          <span className="text-xs text-muted-foreground truncate">
            {item.productName || "Unknown"} {item.locationName ? `— ${item.locationName}` : ""}
          </span>
        ) : (
          <span className="text-xs text-destructive">Not found</span>
        )}
      </div>
      <button type="button" onClick={onRemove} className="ml-2 rounded-full p-0.5 hover:bg-muted shrink-0">
        <Trash2 className="size-3" />
      </button>
    </div>
  );
}

/** What one scan did, so a single input can still explain itself. */
interface ScanOutcome {
  id: number;
  code: string;
  tone: "added" | "destination" | "ignored" | "error";
  message: string;
}

export default function StockTransferPage() {
  const [childCodes, setChildCodes] = useState<string[]>([]);
  const [destOrgId, setDestOrgId] = useState("");
  const [destLocId, setDestLocId] = useState("");
  const [destinationLocationName, setDestinationLocationName] = useState<string | null>(null);
  const [scanLog, setScanLog] = useState<ScanOutcome[]>([]);
  const [notes, setNotes] = useState("");

  const resolve = useResolveCode();

  const note = (outcome: Omit<ScanOutcome, "id">) =>
    setScanLog((prev) =>
      [{ ...outcome, id: Date.now() + Math.random() }, ...prev].slice(0, 6),
    );

  const { data: outgoingData, isLoading: outLoading } = useOutgoingTransfers();
  const { data: incomingData, isLoading: inLoading } = useIncomingTransfers();
  const { data: locations } = useLocations();
  const { data: organizations } = useOrganizations();
  const dispatchTransfer = useDispatchTransfer();

  const locationList = locations ?? [];
  const orgList = (organizations ?? []).filter((o) => o.type !== "REGULATOR" && o.type !== "CONSUMER");

  // Auto-fill source location from first scanned item
  const firstItem = useItem(childCodes[0] ?? "");
  const [sourceLocId, setSourceLocId] = useState<string>("");

  // Adopt the scanned item's location during render rather than in an effect.
  // An effect renders the picker empty first and fills it a beat later, which
  // reads as the field clearing itself just as the operator reaches for it.
  const [adoptedFrom, setAdoptedFrom] = useState<number | null>(null);
  const scannedLocationId = firstItem.data?.locationId ?? null;

  if (scannedLocationId !== adoptedFrom) {
    setAdoptedFrom(scannedLocationId);
    setSourceLocId(scannedLocationId ? String(scannedLocationId) : "");
  }

  /**
   * One scan box, routed by what the code turns out to be.
   *
   * The screen used to ask for four separate things: scan the goods, then read
   * a source location off a banner, then pick a destination business from one
   * dropdown and a destination location from another. Three of those the
   * platform can work out on its own — the source comes from the first item
   * scanned, and a bay label names both the place and the business that owns
   * it — so the operator now only ever scans.
   */
  const handleScan = async (raw: string) => {
    const code = raw.trim();
    if (!code) return;

    let result: ScanResult;
    try {
      result = await resolve.mutateAsync(code);
    } catch {
      note({ code, tone: "error", message: "Could not look that up" });
      return;
    }

    if (result.kind === "LOCATION") {
      // A bay label answers "where to?" and "which business?" at once.
      setDestOrgId(String(result.organizationId ?? ""));
      setDestLocId(String(result.locationId ?? ""));
      setDestinationLocationName(result.describes);
      note({ code, tone: "destination", message: `Dispatching to ${result.describes}` });
      return;
    }

    if (result.kind !== "ITEM" || !result.itemQrCode) {
      note({
        code,
        tone: "error",
        message:
          result.kind === "PRODUCT"
            ? "That is a product, not one specific unit — scan the label on the goods"
            : result.describes,
      });
      return;
    }

    if (childCodes.includes(result.itemQrCode)) {
      note({ code, tone: "ignored", message: "Already on the list" });
      return;
    }

    setChildCodes((prev) => [...prev, result.itemQrCode!]);
    note({ code, tone: "added", message: result.describes });
  };

  const removeCode = (code: string) => {
    setChildCodes((prev) => {
      const next = prev.filter((c) => c !== code);
      if (next.length === 0) setSourceLocId("");
      return next;
    });
  };

  const onDispatch = () => {
    const validCodes = childCodes.filter((c) => c.trim());
    if (validCodes.length === 0 || !destOrgId) return;
    dispatchTransfer.mutate(
      {
        destinationOrganizationId: Number(destOrgId),
        destinationLocationId: destLocId ? Number(destLocId) : undefined,
        sourceLocationId: sourceLocId ? Number(sourceLocId) : undefined,
        itemQrCodes: validCodes,
        notes: notes || undefined,
      },
      { onSuccess: () => { setChildCodes([]); setDestOrgId(""); setDestLocId(""); setSourceLocId(""); setNotes(""); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <Truck className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Stock Transfer</h1>
          <p className="text-sm text-muted-foreground">
            Dispatch items to another organization or receive incoming transfers.
          </p>
        </div>
      </div>

      <Tabs defaultValue="outgoing" className="w-full">
        <TabsList>
          <TabsTrigger value="outgoing" className="gap-2">
            <ArrowUpRight className="size-4" /> Outgoing
          </TabsTrigger>
          <TabsTrigger value="incoming" className="gap-2">
            <ArrowDownLeft className="size-4" /> Incoming
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-2">
            <Plus className="size-4" /> New Transfer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outgoing">
          <Card>
            <CardHeader>
              <CardTitle>Outgoing Transfers</CardTitle>
              <CardDescription>Transfers dispatched from your organization</CardDescription>
            </CardHeader>
            <CardContent>
              {outLoading ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <DataTable columns={transferColumns} data={outgoingData?.content ?? []} showFilter={false} showPagination={false} noBorder />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incoming">
          <Card>
            <CardHeader>
              <CardTitle>Incoming Transfers</CardTitle>
              <CardDescription>Transfers addressed to your organization</CardDescription>
            </CardHeader>
            <CardContent>
              {inLoading ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">Loading...</div>
              ) : (
                <DataTable columns={incomingColumns} data={incomingData?.content ?? []} showFilter={false} showPagination={false} noBorder />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Items</CardTitle>
              <CardDescription>
                Scan goods into the list, then choose where they go — pick a
                destination business below, or scan a receiving bay label to set
                both business and bay at once.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ── One box, for everything ── */}
              <div className="space-y-3">
                <QrScanInput
                  onScan={handleScan}
                  scanning="goods, then the destination bay"
                  placeholder="e.g. ST-LPT-000001 or LOC-000004"
                />

                {resolve.isPending && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3.5 animate-spin" />
                    Working out what that was…
                  </p>
                )}

                {/* One input has to say what it decided with each scan, or the
                    operator is scanning into a void. */}
                {scanLog.length > 0 && (
                  <div className="space-y-1">
                    {scanLog.map((entry) => (
                      <div
                        key={entry.id}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs",
                          entry.tone === "added" && "bg-emerald-50 text-success",
                          entry.tone === "destination" && "bg-primary-light text-primary",
                          entry.tone === "ignored" && "bg-muted text-muted-foreground",
                          entry.tone === "error" && "bg-red-50 text-danger",
                        )}
                      >
                        {entry.tone === "error" ? (
                          <AlertCircle className="size-3.5 shrink-0" />
                        ) : entry.tone === "ignored" ? (
                          <Info className="size-3.5 shrink-0" />
                        ) : entry.tone === "destination" ? (
                          <MapPin className="size-3.5 shrink-0" />
                        ) : (
                          <Plus className="size-3.5 shrink-0" />
                        )}
                        <span className="font-mono font-medium">{entry.code}</span>
                        <span className="truncate opacity-80">{entry.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── What is going ── */}
              {childCodes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Going out ({childCodes.length})
                  </p>
                  {childCodes.map((code) => (
                    <ScannedItemRow key={code} code={code} onRemove={() => removeCode(code)} />
                  ))}
                </div>
              )}

              {/* ── Where from, where to ── */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                      From
                    </p>
                    <p className="text-sm text-foreground">
                      {sourceLocId
                        ? (locationList.find((l) => String(l.id) === sourceLocId)?.name ??
                          `Location ${sourceLocId}`)
                        : "Taken from the first item you scan"}
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2.5",
                    destOrgId
                      ? "border-primary/30 bg-primary-light"
                      : "border-dashed border-border bg-muted/30",
                  )}
                >
                  <MapPin
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      destOrgId ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-faint">
                      To
                    </p>
                    <SearchableSelect
                      value={destOrgId || undefined}
                      onValueChange={(v) => {
                        setDestOrgId(v ?? "");
                        // Manual org pick is not a bay scan — drop any prior
                        // location that belonged to a different destination.
                        setDestLocId("");
                        setDestinationLocationName(null);
                      }}
                      placeholder="Choose destination business…"
                      searchPlaceholder="Search businesses by name, type…"
                      allowClear
                      emptyMessage="No trading partners available."
                      items={orgList.map((org) => ({
                        value: String(org.id),
                        label: org.name,
                        badge: org.type,
                      }))}
                    />
                    {destinationLocationName ? (
                      <p className="text-xs text-muted-foreground">
                        Bay from scan:{" "}
                        <span className="font-medium text-foreground">
                          {destinationLocationName}
                        </span>
                        {" · "}
                        <button
                          type="button"
                          onClick={() => {
                            setDestLocId("");
                            setDestinationLocationName(null);
                          }}
                          className="underline-offset-2 hover:underline"
                        >
                          Clear bay
                        </button>
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Or scan the receiving bay&apos;s label in the box above
                        to set business and bay together.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Input
                placeholder="Notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <Button
                onClick={onDispatch}
                disabled={dispatchTransfer.isPending || childCodes.length === 0 || !destOrgId}
              >
                {dispatchTransfer.isPending
                  ? "Dispatching…"
                  : `Dispatch ${childCodes.length} item${childCodes.length === 1 ? "" : "s"}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
