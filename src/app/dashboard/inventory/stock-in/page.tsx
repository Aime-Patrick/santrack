"use client";

/**
 * Stock In — RETAILER / SHOP
 *
 * Three-step flow:  Scan → Preview → Done
 *
 * The user never touches packaging operations manually.
 * One "Confirm Stock In" action triggers the entire atomic backend operation.
 */

import { useState } from "react";
import {
  PackageOpen,
  CheckCircle2,
  Loader2,
  ScanLine,
  ArrowRight,
  RotateCcw,
  Box,
  Package,
  Boxes,
  Building2,
  MapPin,
  Hash,
  AlertCircle,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrScanInput } from "@/components/ui/qr-scanner";
import { ScanTargetHint } from "@/components/trace/scan-target-hint";
import { useStockInPreview, useConfirmStockIn } from "@/hooks/stock-in";
import type { StockInReceipt } from "@/services/stock-in.service";
import { getApiErrorMessage } from "@/lib/api";

// ─── Shared sub-components ────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-3 py-2.5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
        {icon}
        <span>{label}</span>
      </div>
      <span className={cn("text-xs font-medium text-foreground truncate max-w-[55%] text-right", mono && "font-mono")}>
        {value}
      </span>
    </div>
  );
}

function ContentCard({
  icon,
  label,
  count,
  description,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  description: string;
  accent: "primary" | "secondary";
}) {
  return (
    <div className={cn(
      "flex flex-col gap-1 rounded-xl border p-3",
      accent === "primary" ? "border-primary/20 bg-primary/5" : "border-border/60 bg-muted/30",
    )}>
      <div className={cn(
        "flex items-center gap-1.5 text-xs font-semibold",
        accent === "primary" ? "text-primary" : "text-muted-foreground",
      )}>
        {icon}
        {label}
      </div>
      <p className="text-2xl font-bold text-foreground">{count}</p>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

function SealBadge({ sealState }: { sealState: string | null }) {
  if (!sealState) return null;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px] font-semibold",
        sealState === "SEALED"
          ? "border-warning/40 bg-warning/10 text-warning-foreground"
          : "border-success/40 bg-success/10 text-success",
      )}
    >
      {sealState}
    </Badge>
  );
}

// ─── Step 1: Scan ─────────────────────────────────────────────────────────────

function ScanStep({ onScan }: { onScan: (code: string) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ScanLine className="size-7" />
        </div>
        <h2 className="text-lg font-semibold">Scan incoming container</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Aim at the QR on the <span className="font-medium text-foreground">box, carton, or pallet</span> — not the bottle labels inside.
        </p>
      </div>
      <ScanTargetHint expect="package" />
      <QrScanInput
        onScan={onScan}
        placeholder="Scan package QR (box / pallet)…"
        scanning="a package (pallet, carton, or box)"
        aspect="wide"
        compact
      />
    </div>
  );
}

// ─── Step 2: Preview + Confirm ────────────────────────────────────────────────

function PreviewStep({
  qrCode,
  onReset,
  onReceipt,
}: {
  qrCode: string;
  onReset: () => void;
  onReceipt: (receipt: StockInReceipt) => void;
}) {
  const { data: preview, isLoading, error } = useStockInPreview(qrCode);
  const confirm = useConfirmStockIn();

  function handleConfirm() {
    // Generate a stable client event id for idempotency.
    // crypto.randomUUID() is available in all modern browsers and Node 14.17+.
    const clientEventId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    confirm.mutate(
      { containerQrCode: qrCode, meta: { clientEventId } },
      { onSuccess: onReceipt },
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm">Loading container details…</p>
      </div>
    );
  }

  if (error || !preview) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-destructive">Container not found</p>
            <p className="text-xs text-destructive/80">
              {getApiErrorMessage(error, "This QR code is not registered in the system.")}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onReset} className="gap-2">
          <RotateCcw className="size-4" />
          Scan again
        </Button>
      </div>
    );
  }

  const { container } = preview;

  return (
    <div className="flex flex-col gap-5">
      {/* Container identity */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Package className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold font-mono truncate">{container.code}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {container.packageType?.toLowerCase() ?? "container"}
          </p>
        </div>
        <SealBadge sealState={container.sealState} />
      </div>

      {/* Details */}
      <div className="rounded-xl border border-border/60 bg-muted/30 divide-y divide-border/60">
        <DetailRow icon={<Hash className="size-3.5" />} label="QR Code" value={container.qrCode} mono />
        {container.productName && (
          <DetailRow icon={<Box className="size-3.5" />} label="Product" value={container.productName} />
        )}
        {container.holderName && (
          <DetailRow icon={<Building2 className="size-3.5" />} label="Current holder" value={container.holderName} />
        )}
        {container.locationName && (
          <DetailRow icon={<MapPin className="size-3.5" />} label="Current location" value={container.locationName} />
        )}
        <DetailRow icon={<Boxes className="size-3.5" />} label="Total quantity" value={String(container.quantity)} />
      </div>

      {/* Contents summary */}
      <div className="grid grid-cols-2 gap-3">
        <ContentCard
          icon={<Package className="size-4" />}
          label="Units"
          count={preview.unitCount}
          description="Individual product units"
          accent="primary"
        />
        {preview.nestedContainerCount > 0 && (
          <ContentCard
            icon={<Boxes className="size-4" />}
            label="Containers"
            count={preview.nestedContainerCount}
            description="Nested boxes / cartons"
            accent="secondary"
          />
        )}
      </div>

      {/* Idempotency notice */}
      {preview.alreadyHeld && (
        <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 px-3 py-2.5">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
          <p className="text-xs text-warning-foreground">
            Your organisation already holds this container. Confirming again is safe — no duplicate
            records will be created.
          </p>
        </div>
      )}

      {/*
        SINGLE primary action.
        No Open / Unseal / Remove / Pack / Move buttons here — those are
        internal operations the system handles automatically.
      */}
      <div className="flex gap-3 pt-1">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={confirm.isPending}
          className="gap-2"
        >
          <RotateCcw className="size-4" />
          Scan different
        </Button>
        <Button
          className="flex-1 gap-2"
          onClick={handleConfirm}
          disabled={confirm.isPending}
        >
          {confirm.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          Confirm Stock In
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Receipt ──────────────────────────────────────────────────────────

function ReceiptStep({
  receipt,
  onDone,
}: {
  receipt: StockInReceipt;
  onDone: () => void;
}) {
  const isIdempotent = receipt.outcome === "idempotent";

  return (
    <div className="flex flex-col gap-5">
      {/* Success header */}
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <BadgeCheck className="size-8" />
        </div>
        <h2 className="text-lg font-semibold">
          {isIdempotent ? "Already received" : "Stock received"}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {isIdempotent
            ? "This container was already in your inventory — no duplicate records were created."
            : `${receipt.unitCount} unit${receipt.unitCount !== 1 ? "s" : ""} added to your inventory.`}
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-xl border border-border/60 bg-muted/30 divide-y divide-border/60">
        <DetailRow icon={<Package className="size-3.5" />} label="Container" value={receipt.container.code} mono />
        <DetailRow icon={<Building2 className="size-3.5" />} label="Received by" value={receipt.receivingOrganizationName} />
        <DetailRow icon={<Boxes className="size-3.5" />} label="Units added" value={String(receipt.unitCount)} />
        {receipt.nestedContainerCount > 0 && (
          <DetailRow icon={<Box className="size-3.5" />} label="Nested containers" value={String(receipt.nestedContainerCount)} />
        )}
        <DetailRow icon={<Hash className="size-3.5" />} label="Total items registered" value={String(receipt.totalItemsRegistered)} />
      </div>

      <Button className="gap-2" onClick={onDone}>
        <ScanLine className="size-4" />
        Receive another container
      </Button>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 0 | 1 | 2 }) {
  const steps = ["Scan", "Preview", "Done"] as const;
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className={cn(
              "flex size-5 items-center justify-center rounded-full text-[10px] font-bold",
              i < current ? "bg-success text-white" : i === current ? "bg-primary text-white" : "bg-muted text-muted-foreground",
            )}>
              {i < current ? <CheckCircle2 className="size-3" /> : i + 1}
            </div>
            <span className={cn("text-xs font-medium", i === current ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && <ArrowRight className="size-3 text-muted-foreground/40" />}
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type PageState =
  | { step: "scan" }
  | { step: "preview"; qrCode: string }
  | { step: "receipt"; receipt: StockInReceipt };

export default function StockInPage() {
  const [state, setState] = useState<PageState>({ step: "scan" });

  const stepIndex: 0 | 1 | 2 =
    state.step === "scan" ? 0 : state.step === "preview" ? 1 : 2;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
          <PackageOpen className="size-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Receive Transfer</h1>
          <p className="text-sm text-muted-foreground">
            Scan an incoming container from a dispatch to receive it into your inventory.
          </p>
        </div>
      </div>

      {/* Progress */}
      <StepIndicator current={stepIndex} />

      {/* Step content */}
      <Card>
        <CardContent className="pt-5">
          {state.step === "scan" && (
            <ScanStep onScan={(code) => setState({ step: "preview", qrCode: code.trim() })} />
          )}
          {state.step === "preview" && (
            <PreviewStep
              qrCode={state.qrCode}
              onReset={() => setState({ step: "scan" })}
              onReceipt={(receipt) => setState({ step: "receipt", receipt })}
            />
          )}
          {state.step === "receipt" && (
            <ReceiptStep receipt={state.receipt} onDone={() => setState({ step: "scan" })} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
