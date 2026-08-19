"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Truck, ArrowUpRight, ArrowDownLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { type ColumnDef } from "@tanstack/react-table";
import { useOutgoingTransfers, useIncomingTransfers, useDispatchTransfer, useReceiveTransfer } from "@/hooks/transfers";
import { useItems } from "@/hooks/items";
import { useLocations } from "@/hooks/locations";
import type { Transfer } from "@/services/transfer.service";

// Dispatch form
const dispatchSchema = z.object({
  destinationOrganizationId: z.string().min(1, "Destination is required"),
  destinationLocationId: z.string().optional(),
  sourceLocationId: z.string().optional(),
  notes: z.string().optional(),
});
type DispatchFormValues = z.infer<typeof dispatchSchema>;

const transferColumns: ColumnDef<TableFeatures, Transfer>[] = [
  {
    accessorKey: "reference",
    header: "Reference",
    cell: ({ row }) => <span className="font-medium">{row.getValue("reference")}</span>,
  },
  {
    accessorKey: "destinationOrganizationName",
    header: "Destination",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={status === "PENDING" ? "secondary" : status === "RECEIVED" ? "default" : "outline"}>{status}</Badge>;
    },
  },
  {
    accessorKey: "lineCount",
    header: "Items",
  },
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
  {
    accessorKey: "sourceOrganizationName",
    header: "From",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={status === "PENDING" ? "secondary" : status === "RECEIVED" ? "default" : "outline"}>{status}</Badge>;
    },
  },
  {
    accessorKey: "lineCount",
    header: "Items",
  },
  {
    accessorKey: "dispatchedAt",
    header: "Dispatched",
    cell: ({ row }) => row.getValue("dispatchedAt") ? new Date(row.getValue("dispatchedAt") as string).toLocaleDateString() : "—",
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const transfer = row.original;
      if (transfer.status !== "PENDING") return null;
      return <ReceiveButton transferId={transfer.id} />;
    },
  },
];

function ReceiveButton({ transferId }: { transferId: number }) {
  const receiveTransfer = useReceiveTransfer();
  return (
    <Button
      size="sm"
      onClick={() => receiveTransfer.mutate({ transferId })}
      disabled={receiveTransfer.isPending}
    >
      <ArrowDownLeft className="mr-1 size-3" />
      Receive
    </Button>
  );
}

export default function StockTransferPage() {
  const [childCodes, setChildCodes] = useState<string[]>([""]);
  const [scanInput, setScanInput] = useState("");

  const { data: outgoingData, isLoading: outLoading } = useOutgoingTransfers();
  const { data: incomingData, isLoading: inLoading } = useIncomingTransfers();
  const { data: itemsData } = useItems({ size: 200 });
  const { data: locations } = useLocations();
  const dispatchTransfer = useDispatchTransfer();

  const form = useForm<DispatchFormValues>({
    resolver: zodResolver(dispatchSchema),
    defaultValues: {
      destinationOrganizationId: "",
      destinationLocationId: "",
      sourceLocationId: "",
      notes: "",
    },
  });

  const addCode = () => {
    const code = scanInput.trim();
    if (code && !childCodes.includes(code)) {
      setChildCodes((prev) => [...prev, code]);
      setScanInput("");
    }
  };

  const removeCode = (code: string) => {
    setChildCodes((prev) => prev.filter((c) => c !== code));
  };

  const onDispatch = (values: DispatchFormValues) => {
    const validCodes = childCodes.filter((c) => c.trim());
    if (validCodes.length === 0) return;
    dispatchTransfer.mutate(
      {
        destinationOrganizationId: Number(values.destinationOrganizationId),
        destinationLocationId: values.destinationLocationId ? Number(values.destinationLocationId) : undefined,
        sourceLocationId: values.sourceLocationId ? Number(values.sourceLocationId) : undefined,
        itemQrCodes: validCodes,
        notes: values.notes || undefined,
      },
      { onSuccess: () => { setChildCodes([""]); form.reset(); } }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Truck className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stock Transfer</h1>
          <p className="text-muted-foreground">
            Dispatch items to another organization or receive incoming transfers.
          </p>
        </div>
      </div>

      <Tabs defaultValue="outgoing" className="w-full">
        <TabsList>
          <TabsTrigger value="outgoing" className="gap-2">
            <ArrowUpRight className="size-4" />
            Outgoing
          </TabsTrigger>
          <TabsTrigger value="incoming" className="gap-2">
            <ArrowDownLeft className="size-4" />
            Incoming
          </TabsTrigger>
          <TabsTrigger value="new" className="gap-2">
            <Plus className="size-4" />
            New Transfer
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
              <CardDescription>Scan items and select a destination to dispatch</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onDispatch)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="destinationOrganizationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination Organization ID *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Enter org ID" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="sourceLocationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Location</FormLabel>
                          <Input type="number" placeholder="Location ID" {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Items to Dispatch</p>
                    <QrScanInput
                      onScan={(code) => {
                        if (!childCodes.includes(code)) {
                          setChildCodes((prev) => [...prev, code]);
                        }
                      }}
                      placeholder="Scan item QR code..."
                    />
                    <div className="flex flex-wrap gap-2">
                      {childCodes.filter(Boolean).map((code) => (
                        <Badge key={code} variant="secondary" className="gap-1 pr-1">
                          {code}
                          <button type="button" onClick={() => removeCode(code)} className="ml-1 rounded-full p-0.5 hover:bg-muted">
                            <Trash2 className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional transfer notes" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={dispatchTransfer.isPending || childCodes.filter(Boolean).length === 0}>
                    {dispatchTransfer.isPending ? "Dispatching..." : `Dispatch ${childCodes.filter(Boolean).length} Item(s)`}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
