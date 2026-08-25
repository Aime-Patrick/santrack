"use client";

import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle,
  Factory,
  MoreHorizontal,
  Pencil,
  Plus,
  PowerOff,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable, type TableFeatures } from "@/components/ui/data-table";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MetricCard } from "@/components/dashboard/stat-card";
import { useCapabilities } from "@/hooks/permissions";
import {
  useCreateFacility,
  useFacilities,
  useUpdateFacility,
} from "@/hooks/facilities";
import type { Facility } from "@/services/facility.service";

/**
 * Compliance → Facilities (DR-07 WU-8).
 *
 * The sites this organization operates. Reading the list is an operations
 * question (`VIEW_OPERATIONS`); opening, renaming, closing or reopening one is
 * a catalogue decision (`MANAGE_CATALOG`), which is the same pair the API
 * enforces on `GET`, `POST` and `PATCH /api/facilities`.
 *
 * Two things this screen does not do. It does not offer to edit a site's code:
 * the code is minted by the server from a shared counter, it is printed on
 * labels already in circulation, and the API refuses to change it — a field
 * that looks editable and is not is a field somebody will fill in. And it draws
 * no conclusion about a site's licensing standing; that lives on the overview,
 * where the server sends it.
 */
export default function ComplianceFacilitiesPage() {
  const permissions = useCapabilities();
  const mayManage = permissions.can("MANAGE_CATALOG");

  const { data, isLoading } = useFacilities();
  const createFacility = useCreateFacility();
  const updateFacility = useUpdateFacility();

  const [dialog, setDialog] = useState<
    { mode: "create" } | { mode: "edit"; facility: Facility } | null
  >(null);
  const [closing, setClosing] = useState<Facility | null>(null);

  const facilities = data ?? [];
  const openCount = facilities.filter((f) => f.active).length;

  const columns: ColumnDef<TableFeatures, Facility>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2"
        >
          Site
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Factory className="size-4" />
          </div>
          <span className="text-sm font-medium">{row.getValue("name")}</span>
        </div>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => {
        const code = row.getValue("code") as string | null;
        return code ? (
          <span className="font-mono text-sm text-muted-foreground">{code}</span>
        ) : (
          <span className="text-faint">—</span>
        );
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const address = row.getValue("address") as string | null;
        return address ? (
          <span className="text-sm text-muted-foreground">{address}</span>
        ) : (
          <span className="text-faint">—</span>
        );
      },
    },
    {
      accessorKey: "active",
      header: "Status",
      cell: ({ row }) => {
        const active = row.getValue("active") as boolean;
        return active ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-success">
            <CheckCircle className="size-4" /> In operation
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <XCircle className="size-4" /> Closed
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        if (!mayManage) return null;
        const facility = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="sm" className="size-8 p-0" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setDialog({ mode: "edit", facility })}>
                <Pencil className="mr-2 size-4" /> Edit details
              </DropdownMenuItem>
              {facility.active ? (
                <DropdownMenuItem
                  className="text-danger"
                  onClick={() => setClosing(facility)}
                >
                  <PowerOff className="mr-2 size-4" /> Close this site
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() =>
                    updateFacility.mutate({ id: facility.id, input: { active: true } })
                  }
                >
                  <RotateCcw className="mr-2 size-4" /> Reopen this site
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
            <Factory className="size-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sites</h1>
            <p className="text-sm text-muted-foreground">
              The premises this organization operates. Production is recorded
              against one of them.
            </p>
          </div>
        </div>

        {mayManage && (
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus className="mr-2 size-4" /> Open a site
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Sites"
          value={facilities.length}
          icon={<Factory className="size-4" />}
          iconBg="bg-primary"
          caption="On record"
        />
        <MetricCard
          title="In operation"
          value={openCount}
          icon={<CheckCircle className="size-4" />}
          iconBg="bg-success"
          caption="Able to produce"
        />
        <MetricCard
          title="Closed"
          value={facilities.length - openCount}
          icon={<XCircle className="size-4" />}
          iconBg="bg-muted text-muted-foreground"
          caption="Not in operation"
        />
      </div>

      {/* With two or more open sites the API stops inferring which plant is
          producing and requires it to be named. Said here rather than
          discovered as a 409 halfway through a production run. */}
      {openCount > 1 && (
        <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          This organization operates {openCount} sites, so every production run
          must name the one producing it. The platform will not choose between
          them — a guess would put a recall at the wrong plant.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Site register</CardTitle>
          <CardDescription>
            {facilities.length} site{facilities.length === 1 ? "" : "s"}. Codes
            are issued by the platform and cannot be changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              Loading sites…
            </div>
          ) : facilities.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No sites on record yet.
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={facilities}
              filterPlaceholder="Search sites…"
              filterColumn="name"
              pageSize={10}
              noBorder
            />
          )}
        </CardContent>
      </Card>

      <SiteDialog
        state={dialog}
        onOpenChange={(open) => !open && setDialog(null)}
        pending={createFacility.isPending || updateFacility.isPending}
        onSubmit={(values) => {
          if (!dialog) return;
          if (dialog.mode === "create") {
            createFacility.mutate(values, { onSuccess: () => setDialog(null) });
          } else {
            updateFacility.mutate(
              { id: dialog.facility.id, input: values },
              { onSuccess: () => setDialog(null) },
            );
          }
        }}
      />

      <CloseSiteDialog
        facility={closing}
        pending={updateFacility.isPending}
        onOpenChange={(open) => !open && setClosing(null)}
        onConfirm={() => {
          if (!closing) return;
          updateFacility.mutate(
            { id: closing.id, input: { active: false } },
            { onSuccess: () => setClosing(null) },
          );
        }}
      />
    </div>
  );
}

/**
 * Open a site, or correct one.
 *
 * The code is shown when editing and is not a field. It exists to be printed
 * and scanned; two sites answering to one code would misroute production, and
 * a changed code would break every label already out there.
 */
function SiteDialog({
  state,
  onOpenChange,
  onSubmit,
  pending,
}: {
  state: { mode: "create" } | { mode: "edit"; facility: Facility } | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: { name: string; address?: string }) => void;
  pending: boolean;
}) {
  const editing = state?.mode === "edit" ? state.facility : null;

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Seed the form during render rather than in an effect: a dialog that shows
  // the previous site's name for a frame is one somebody will submit.
  const key = state ? (editing ? `edit-${editing.id}` : "create") : null;
  if (key !== loadedFor) {
    setLoadedFor(key);
    setName(editing?.name ?? "");
    setAddress(editing?.address ?? "");
  }

  return (
    <Dialog open={!!state} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit site" : "Open a site"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Correct the record. The site's code is fixed and is not part of this form."
              : "A new premises for this organization. The platform issues its code."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {editing && (
            <div className="space-y-1.5">
              <Label className="text-xs">Code</Label>
              <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-sm text-muted-foreground">
                {editing.code ?? "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                Issued by the platform when the site was opened. It is printed on
                labels already in circulation, so it never changes.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="site-name" className="text-xs">
              Name
            </Label>
            <Input
              id="site-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Huye Plant"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="site-address" className="text-xs">
              Address <span className="font-normal text-faint">(optional)</span>
            </Label>
            <Input
              id="site-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Huye District, Southern Province"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={name.trim().length < 2 || pending}
            onClick={() =>
              onSubmit({
                name: name.trim(),
                address: address.trim() || undefined,
              })
            }
          >
            {pending ? "Saving…" : editing ? "Save changes" : "Open site"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}

/**
 * Closing a site is an operational act, not a regulatory one.
 *
 * Its licences go dormant rather than lapsing (DR-07 OQ 10) — deactivating a
 * site must not forge a regulatory decision — and the site can be reopened.
 * Said plainly here so nobody expects closing a plant to surrender a licence.
 */
function CloseSiteDialog({
  facility,
  onOpenChange,
  onConfirm,
  pending,
}: {
  facility: Facility | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  return (
    <Dialog open={!!facility} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Close {facility?.name}?</DialogTitle>
          <DialogDescription>
            The site stops being available for production. Any licence attached
            to it goes dormant rather than lapsing, and the site can be reopened
            later.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep it open
          </Button>
          <Button variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending ? "Closing…" : "Close the site"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
