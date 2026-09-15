"use client";

import { useState } from "react";

import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Plus, MapPin, CheckCircle, XCircle, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/stat-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogPopup, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocations, useCreateLocation } from "@/hooks/locations";
import type { Location } from "@/services/location.service";
import { barcodeService } from "@/services/barcode.service";
import { toast } from "sonner";

const typeColors: Record<string, string> = {
  FACTORY: "border-transparent bg-primary text-white",
  WAREHOUSE: "border-transparent bg-success text-white",
  DISTRIBUTION_CENTER: "border-transparent bg-warning-foreground text-white",
  STORE: "border-transparent bg-danger text-white",
  SHOP: "border-transparent bg-primary text-white",
  VEHICLE: "border-transparent bg-muted-foreground text-white",
};

const columns: ColumnDef<TableFeatures, Location>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-8 px-2">
        Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
          <MapPin className="size-4" />
        </div>
        <span className="text-sm font-medium">{row.getValue("name")}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return <Badge variant="outline" className={typeColors[type] ?? "border-border bg-muted/60 text-muted-foreground"}>{type}</Badge>;
    },
  },
  {
    accessorKey: "address",
    header: "Address",
    cell: ({ row }) => {
      const addr = row.getValue("address") as string | null;
      return addr ? <span className="text-sm text-muted-foreground">{addr}</span> : <span className="text-faint">—</span>;
    },
  },
  {
    accessorKey: "active",
    header: "Status",
    cell: ({ row }) => {
      const active = row.getValue("active") as boolean;
      return active ? <CheckCircle className="size-4 text-success" /> : <XCircle className="size-4 text-muted-foreground" />;
    },
  },
];

/** Where an organization physically keeps stock. Identities are registered
 * into one, and a transfer is received into one, so nothing can be minted or
 * moved until at least one exists. */
const LOCATION_TYPES = [
  { value: "FACTORY", label: "Factory" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "DISTRIBUTION_CENTER", label: "Distribution centre" },
  { value: "STORE", label: "Store" },
  { value: "SHOP", label: "Shop" },
  { value: "VEHICLE", label: "Vehicle" },
];

/**
 * Downloads a ZIP of Code 128 bay labels — one PNG per active location.
 *
 * Each label encodes the LOC-XXXXXX code, which the scan resolver recognises
 * as a LOCATION kind. Sticking the printed label on a bay or shelf makes every
 * dispatch, relocation and regulator inspection flow work with a single scan.
 */
async function downloadLocationLabels(locations: Location[]): Promise<void> {
  const active = locations.filter((l) => l.active);
  if (active.length === 0) {
    toast.error("No active locations to print");
    return;
  }

  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();

  const BATCH = 10;
  for (let i = 0; i < active.length; i += BATCH) {
    const chunk = active.slice(i, i + BATCH);
    const blobs = await Promise.all(
      chunk.map((loc) =>
        barcodeService.renderBlob({
          symbology: "CODE_128",
          value: loc.code || `LOC-${loc.id}`,
          scale: 3,
          height: 20,
          showText: true,
          format: "png",
        }),
      ),
    );
    blobs.forEach((blob, j) => {
      const locCode = chunk[j].code || `LOC-${chunk[j].id}`;
      zip.file(`${locCode}-${chunk[j].name.replace(/\s+/g, "_")}.png`, blob);
    });

  }

  const zipBlob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "location-labels.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${active.length} location label${active.length !== 1 ? "s" : ""}`);
}

export default function LocationsPage() {
  const { data, isLoading } = useLocations();
  const createLocation = useCreateLocation();
  const [open, setOpen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const locations = data ?? [];
  const total = locations.length;
  const activeCount = locations.filter((l) => l.active).length;
  const warehouseCount = locations.filter((l) => l.type === "WAREHOUSE" || l.type === "DISTRIBUTION_CENTER").length;

  const handlePrintLabels = async () => {
    setPrinting(true);
    try {
      await downloadLocationLabels(locations);
    } catch {
      toast.error("Could not generate location labels");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <MapPin className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Locations</h1>
            <p className="text-sm text-muted-foreground">Manage physical locations across your organization.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => void handlePrintLabels()}
            disabled={printing || locations.length === 0}
          >
            <Printer className="mr-2 size-4" />
            {printing ? "Generating…" : "Print Bay Labels"}
          </Button>
          <Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" /> Add location</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard title="Total Locations" value={total} icon={<MapPin className="size-4" />} iconBg="bg-primary" caption="All locations" />
        <MetricCard title="Active" value={activeCount} icon={<CheckCircle className="size-4" />} iconBg="bg-success" caption="Active locations" />
        <MetricCard title="Warehouses" value={warehouseCount} icon={<MapPin className="size-4" />} iconBg="bg-warning" caption="Storage facilities" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location List</CardTitle>
          <CardDescription>{total} locations</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">Loading locations...</div>
          ) : (
            <DataTable columns={columns} data={locations} filterPlaceholder="Search locations..." filterColumn="name" pageSize={10} noBorder />
          )}
        </CardContent>
      </Card>

      <NewLocationDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(data) => createLocation.mutate(data, { onSuccess: () => setOpen(false) })}
        pending={createLocation.isPending}
      />
    </div>
  );
}

function NewLocationDialog({
  open,
  onOpenChange,
  onSubmit,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { name: string; type: string; address?: string }) => void;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [address, setAddress] = useState("");

  const reset = () => {
    setName("");
    setType("");
    setAddress("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Add a location</DialogTitle>
          <DialogDescription>
            Somewhere this organization keeps stock. Units are registered into one, and a transfer
            is received into one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="location-name">Name</Label>
            <Input
              id="location-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kigali Main Warehouse"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="What kind of place is it">
                  {type
                    ? () => LOCATION_TYPES.find((t) => t.value === type)?.label ?? type
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-address">Address (optional)</Label>
            <Input
              id="location-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={name.trim().length === 0 || !type || pending}
            onClick={() =>
              onSubmit({ name: name.trim(), type, address: address.trim() || undefined })
            }
          >
            {pending ? "Adding..." : "Add location"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
