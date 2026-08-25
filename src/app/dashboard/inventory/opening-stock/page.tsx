"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Box,
  FileCheck,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowLeft,
  RefreshCw,
  Barcode,
  Repeat2,
  ShieldCheck,
  Trash2,
  XCircle,
  Check,
  Pause,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useProducts } from "@/hooks/products";
import { useBatches, useCreateBatch } from "@/hooks/batches";
import { useLocations } from "@/hooks/locations";
import { useRegisterUnits } from "@/hooks/items";
import { type PackageType } from "@/services/item.service";

export default function OpeningStockPage() {
  const router = useRouter();
  const { data: productsData } = useProducts(0, 200);
  const { data: batches } = useBatches();
  const { data: locations } = useLocations();

  const registerUnits = useRegisterUnits();
  const createBatch = useCreateBatch();

  const [activeTab, setActiveTab] = useState<"carton" | "batch" | "scan">("carton");

  // Tab 1: Carton
  const [cartonProductId, setCartonProductId] = useState("");
  const [cartonBatchId, setCartonBatchId] = useState("");
  const [cartonLocationId, setCartonLocationId] = useState("");
  const [cartonPackageType, setCartonPackageType] = useState<PackageType>("CARTON");
  const [unitsPerCarton, setUnitsPerCarton] = useState(24);
  const [cartonCount, setCartonCount] = useState(100);
  const [isSubmittingCartons, setIsSubmittingCartons] = useState(false);

  const totalUnits = (Number(unitsPerCarton) || 0) * (Number(cartonCount) || 0);

  // Tab 2: Batch Declaration
  const [batchProductId, setBatchProductId] = useState("");
  const [batchCode, setBatchCode] = useState(() => {
    const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const r = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LOT-${d}-${r}`;
  });
  const [batchLocationId, setBatchLocationId] = useState("");
  const [batchManufacturedOn, setBatchManufacturedOn] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [batchExpiresOn, setBatchExpiresOn] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [batchQuantity, setBatchQuantity] = useState(10000);
  const [batchCertified, setBatchCertified] = useState(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Tab 3: Scan
  const [scanProductId, setScanProductId] = useState("");
  const [scanBatchId, setScanBatchId] = useState("");
  const [scanLocationId, setScanLocationId] = useState("");
  const [targetScanCount, setTargetScanCount] = useState(1000);
  const [scanSessionActive, setScanSessionActive] = useState(false);
  const [currentScanInput, setCurrentScanInput] = useState("");
  const [scannedCodes, setScannedCodes] = useState<Array<{ code: string; timestamp: string }>>([]);
  const [rejectedCodes, setRejectedCodes] = useState<Array<{ code: string; reason: string; timestamp: string }>>([]);
  // Legacy GS1 mode: same barcode on every unit (e.g. 6 161106 380602 on every Inyange bottle).
  // In this mode each scan counts as +1 unit; duplicates are expected and allowed.
  // In unique-code mode (default) duplicates are rejected because our QR codes are one-per-unit.
  const [legacyGsMode, setLegacyGsMode] = useState(false);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scanSessionActive && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [scanSessionActive]);

  const playAudioCue = (type: "success" | "duplicate") => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }
    } catch {
      // Audio not supported
    }
  };

  const handleCartonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartonProductId || !cartonLocationId || cartonCount <= 0 || unitsPerCarton <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmittingCartons(true);
    try {
      await registerUnits.mutateAsync({
        productId: Number(cartonProductId),
        batchId: cartonBatchId ? Number(cartonBatchId) : undefined,
        locationId: Number(cartonLocationId),
        count: totalUnits,
      });
      toast.success(`${totalUnits.toLocaleString()} units (${cartonCount} ${cartonPackageType.toLowerCase()}s) added to inventory`);
      router.push("/dashboard/inventory");
    } catch {
      toast.error("Failed to onboard stock");
    } finally {
      setIsSubmittingCartons(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchProductId || !batchCode || !batchLocationId || batchQuantity <= 0) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!batchCertified) {
      toast.error("Please check the verification confirmation box");
      return;
    }

    setIsSubmittingBatch(true);
    try {
      const newBatch = await createBatch.mutateAsync({
        productId: Number(batchProductId),
        batchCode: batchCode.trim().toUpperCase(),
        manufacturedOn: batchManufacturedOn,
        expiresOn: batchExpiresOn,
      });

      await registerUnits.mutateAsync({
        productId: Number(batchProductId),
        batchId: newBatch.id,
        locationId: Number(batchLocationId),
        count: Number(batchQuantity),
      });

      toast.success(`Batch ${newBatch.batchCode} (${batchQuantity.toLocaleString()} units) registered`);
      router.push("/dashboard/inventory");
    } catch {
      toast.error("Failed to register batch opening stock");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = currentScanInput.trim();
    if (!code) return;

    const timestamp = new Date().toLocaleTimeString();

    if (legacyGsMode) {
      // Legacy mode: same GS1 barcode on every unit — count every scan as a new unit.
      // We append with a counter suffix so each entry is unique in the list display,
      // but the real quantity is just scannedCodes.length.
      playAudioCue("success");
      setScannedCodes((prev) => [{ code, timestamp }, ...prev]);
    } else {
      // Unique-code mode (our generated QR codes): reject duplicates.
      const isDuplicate = scannedCodes.some((s) => s.code === code);
      if (isDuplicate) {
        playAudioCue("duplicate");
        setRejectedCodes((prev) => [
          { code, reason: "Duplicate — switch to Legacy GS1 mode if all bottles share this code", timestamp },
          ...prev.slice(0, 29),
        ]);
        toast.error(`Duplicate scan: ${code}`, {
          description: "All bottles share the same barcode? Switch to Legacy GS1 mode.",
        });
      } else {
        playAudioCue("success");
        setScannedCodes((prev) => [{ code, timestamp }, ...prev]);
      }
    }

    setCurrentScanInput("");
    if (scanInputRef.current) scanInputRef.current.focus();
  };

  const handleCancelSession = () => {
    if (scannedCodes.length > 0) {
      const confirmed = window.confirm(`Discard all ${scannedCodes.length} scanned units and exit this scan session?`);
      if (!confirmed) return;
    }
    setScannedCodes([]);
    setRejectedCodes([]);
    setScanSessionActive(false);
    toast.info("Scan session discarded");
  };

  const handleRemoveScan = (indexToRemove: number) => {
    setScannedCodes((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.info("Removed scanned item");
  };

  const handleFinishScan = async () => {
    if (scannedCodes.length === 0) {
      toast.error("No items scanned yet");
      return;
    }

    try {
      await registerUnits.mutateAsync({
        productId: Number(scanProductId),
        batchId: scanBatchId ? Number(scanBatchId) : undefined,
        locationId: Number(scanLocationId),
        count: scannedCodes.length,
      });
      toast.success(`${scannedCodes.length} verified units added to inventory`);
      setScanSessionActive(false);
      router.push("/dashboard/inventory");
    } catch {
      toast.error("Failed to save scan session");
    }
  };

  const filteredBatches = (productId: string) =>
    batches?.filter((b) => b.productId === Number(productId)) ?? [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/inventory"
          className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="mr-1.5 size-4" /> Back to Inventory
        </Link>
      </div>

      {/* Main Container */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Opening Stock Onboarding</h1>
          <p className="text-sm text-muted-foreground">
            Enter pre-existing warehouse inventory into stock.
          </p>
        </div>

        {/* Clean Mode Switcher */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="carton" className="flex items-center gap-2 font-medium">
              <Box className="size-4" /> Cartons & Cases
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2 font-medium">
              <FileCheck className="size-4" /> Batch Lot Entry
            </TabsTrigger>
            <TabsTrigger value="scan" className="flex items-center gap-2 font-medium">
              <ScanLine className="size-4" /> Barcode Scanner
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CARTON / BULK */}
          <TabsContent value="carton">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Carton & Packaging Entry</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCartonSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Product *</Label>
                      <Select value={cartonProductId} onValueChange={(v) => setCartonProductId(v || "")}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Select product">
                            {cartonProductId
                              ? productsData?.content.find((p) => String(p.id) === cartonProductId)?.name
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {productsData?.content.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} ({p.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Batch / Lot (Optional)</Label>
                      <Select
                        value={cartonBatchId}
                        onValueChange={(v) => setCartonBatchId(v || "")}
                        disabled={!cartonProductId}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder={cartonProductId ? "Select batch" : "Select product first"}>
                            {cartonBatchId
                              ? batches?.find((b) => String(b.id) === cartonBatchId)?.batchCode
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {filteredBatches(cartonProductId).map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.batchCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Warehouse Location *</Label>
                      <Select value={cartonLocationId} onValueChange={(v) => setCartonLocationId(v || "")}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Select location">
                            {cartonLocationId
                              ? locations?.find((l) => String(l.id) === cartonLocationId)?.name
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {locations?.map((l) => (
                            <SelectItem key={l.id} value={String(l.id)}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Container Type</Label>
                      <Select
                        value={cartonPackageType}
                        onValueChange={(v) => setCartonPackageType(v as PackageType)}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CARTON">Carton</SelectItem>
                          <SelectItem value="BOX">Box</SelectItem>
                          <SelectItem value="CASE">Case</SelectItem>
                          <SelectItem value="CRATE">Crate</SelectItem>
                          <SelectItem value="PALLET">Pallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Units per Container *</Label>
                      <Input
                        type="number"
                        min={1}
                        value={unitsPerCarton}
                        onChange={(e) => setUnitsPerCarton(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Containers *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={cartonCount}
                      onChange={(e) => setCartonCount(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                  </div>

                  {/* Summary Bar */}
                  <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Physical Output</p>
                      <p className="text-xl font-bold tracking-tight">
                        {totalUnits.toLocaleString()} units
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {cartonCount} × {unitsPerCarton}
                    </span>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmittingCartons || !cartonProductId || !cartonLocationId}
                      className="min-w-[160px]"
                    >
                      {isSubmittingCartons ? (
                        <>
                          <RefreshCw className="mr-2 size-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        `Add ${totalUnits.toLocaleString()} Units`
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: BATCH DECLARATION */}
          <TabsContent value="batch">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Batch Lot Declaration</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBatchSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Product *</Label>
                      <Select value={batchProductId} onValueChange={(v) => setBatchProductId(v || "")}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Select product">
                            {batchProductId
                              ? productsData?.content.find((p) => String(p.id) === batchProductId)?.name
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {productsData?.content.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} ({p.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Batch Code *</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
                            const r = Math.random().toString(36).substring(2, 6).toUpperCase();
                            setBatchCode(`LOT-${d}-${r}`);
                          }}
                          className="h-6 px-2 text-[11px] text-primary gap-1"
                        >
                          <RefreshCw className="size-3" /> Auto-generate
                        </Button>
                      </div>
                      <Input
                        placeholder="e.g. LOT-20260824-001"
                        value={batchCode}
                        onChange={(e) => setBatchCode(e.target.value)}
                        className="h-10 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Warehouse Location *</Label>
                      <Select value={batchLocationId} onValueChange={(v) => setBatchLocationId(v || "")}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Select location">
                            {batchLocationId
                              ? locations?.find((l) => String(l.id) === batchLocationId)?.name
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {locations?.map((l) => (
                            <SelectItem key={l.id} value={String(l.id)}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Manufactured Date</Label>
                      <Input
                        type="date"
                        value={batchManufacturedOn}
                        onChange={(e) => setBatchManufacturedOn(e.target.value)}
                        className="h-10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Expiry Date</Label>
                      <Input
                        type="date"
                        value={batchExpiresOn}
                        onChange={(e) => setBatchExpiresOn(e.target.value)}
                        className="h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Total Units *</Label>
                    <Input
                      type="number"
                      min={1}
                      value={batchQuantity}
                      onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-10"
                    />
                  </div>

                  <div className="flex items-center space-x-3 rounded-lg border bg-muted/20 p-3.5">
                    <input
                      type="checkbox"
                      id="batch-certify"
                      checked={batchCertified}
                      onChange={(e) => setBatchCertified(e.target.checked)}
                      className="size-4 rounded border-input text-primary focus:ring-primary cursor-pointer accent-primary"
                    />
                    <label htmlFor="batch-certify" className="text-xs cursor-pointer text-muted-foreground font-medium">
                      I confirm these units exist in warehouse storage as pre-onboarding stock.
                    </label>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={
                        isSubmittingBatch ||
                        !batchProductId ||
                        !batchCode ||
                        !batchLocationId ||
                        !batchCertified
                      }
                      className="min-w-[160px]"
                    >
                      {isSubmittingBatch ? (
                        <>
                          <RefreshCw className="mr-2 size-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        `Register ${batchQuantity.toLocaleString()} Units`
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: SCANNER GUN */}
          <TabsContent value="scan">
            {!scanSessionActive ? (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Continuous Barcode Scanner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select value={scanProductId} onValueChange={(v) => setScanProductId(v || "")}>
                      <SelectTrigger className="w-full h-10">
                        <SelectValue placeholder="Select product">
                          {scanProductId
                            ? productsData?.content.find((p) => String(p.id) === scanProductId)?.name
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {productsData?.content.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Batch (Optional)</Label>
                      <Select value={scanBatchId} onValueChange={(v) => setScanBatchId(v || "")} disabled={!scanProductId}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder={scanProductId ? "Select batch" : "Select product first"}>
                            {scanBatchId
                              ? batches?.find((b) => String(b.id) === scanBatchId)?.batchCode
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {filteredBatches(scanProductId).map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.batchCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Location *</Label>
                      <Select value={scanLocationId} onValueChange={(v) => setScanLocationId(v || "")}>
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder="Select location">
                            {scanLocationId
                              ? locations?.find((l) => String(l.id) === scanLocationId)?.name
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {locations?.map((l) => (
                            <SelectItem key={l.id} value={String(l.id)}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={targetScanCount}
                      onChange={(e) => setTargetScanCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="h-10"
                    />
                  </div>

                  {/* Scan Mode Toggle */}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setLegacyGsMode((v) => !v)}
                    onKeyDown={(e) => e.key === "Enter" && setLegacyGsMode((v) => !v)}
                    className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors select-none ${
                      legacyGsMode
                        ? "border-amber-500/40 bg-amber-500/8"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      legacyGsMode ? "border-amber-500 bg-amber-500" : "border-border bg-background"
                    }`}>
                      {legacyGsMode && <span className="text-white text-xs font-bold leading-none">✓</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Repeat2 className={`size-4 shrink-0 ${legacyGsMode ? "text-amber-600" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">
                          Legacy GS1 Mode (same barcode on every unit)
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {legacyGsMode ? (
                          <span className="text-amber-700 dark:text-amber-400 font-medium">
                            Active — each scan counts as +1 unit. The same barcode (<span className="font-mono">6 161106 380602</span>) can be scanned many times.
                          </span>
                        ) : (
                          <>
                            <span className="font-medium">Off</span> — for our unique QR codes (one code per unit, duplicates rejected).{" "}
                            Turn on if every bottle of this product has the same barcode printed on it.
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => {
                        if (!scanProductId || !scanLocationId) {
                          toast.error("Select a product and location first");
                          return;
                        }
                        setScanSessionActive(true);
                      }}
                    >
                      <ScanLine className="mr-2 size-4" /> Start Scanning
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-4 border-b">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" /> Scanner Session Active
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                        {legacyGsMode ? (
                          <>
                            <Repeat2 className="size-3.5 text-amber-600" />
                            <span className="text-amber-700 dark:text-amber-400 font-medium">Legacy GS1 Mode — counting repeated bottle scans (+1 per scan)</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="size-3.5 text-emerald-600" />
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Unique QR Mode — strict duplicate prevention</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelSession}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="mr-1.5 size-4" /> Cancel Session
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setScanSessionActive(false)}>
                        <Pause className="mr-1.5 size-4" /> Pause
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleFinishScan}
                        disabled={scannedCodes.length === 0}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        <Check className="mr-1.5 size-4" /> Finish &amp; Save ({scannedCodes.length})
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 pt-5">
                  {/* KPI Progress Bar */}
                  <div className="space-y-2 rounded-lg border bg-muted/20 p-4">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-foreground text-sm">
                          {scannedCodes.length.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground"> / {targetScanCount.toLocaleString()} units scanned</span>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {Math.min(100, Math.round((scannedCodes.length / targetScanCount) * 100))}% of Target
                      </Badge>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                        style={{ width: `${Math.min(100, (scannedCodes.length / targetScanCount) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleScanSubmit}>
                    <div className="relative">
                      <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
                      <Input
                        ref={scanInputRef}
                        autoFocus
                        placeholder="Scan barcode with gun or type code and press Enter..."
                        value={currentScanInput}
                        onChange={(e) => setCurrentScanInput(e.target.value)}
                        className="h-12 pl-11 pr-4 font-mono text-base border-2 focus-visible:ring-primary shadow-xs"
                      />
                    </div>
                  </form>

                  {/* Feeds */}
                  <div className="grid gap-4 sm:grid-cols-2 text-xs">
                    {/* Left: Accepted Scans */}
                    <div className="rounded-lg border bg-card p-3.5 space-y-2 flex flex-col">
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-4" />
                          <span>Accepted Units ({scannedCodes.length})</span>
                        </div>
                        {scannedCodes.length > 0 && (
                          <span className="text-[11px] text-muted-foreground">
                            Hover row to delete accidental scan
                          </span>
                        )}
                      </div>
                      <div className="h-56 overflow-y-auto space-y-1 font-mono pr-1">
                        {scannedCodes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center font-sans">
                            <Barcode className="size-8 mb-2 opacity-40" />
                            <p>Ready for barcode gun input</p>
                            <p className="text-[11px] opacity-70">Pull scanner trigger on product barcode</p>
                          </div>
                        ) : (
                          scannedCodes.map((s, idx) => (
                            <div
                              key={idx}
                              className="group flex items-center justify-between p-2 rounded bg-muted/40 hover:bg-muted/70 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-[10px] font-sans font-bold text-muted-foreground bg-background px-1.5 py-0.5 rounded border">
                                  #{scannedCodes.length - idx}
                                </span>
                                <span className="font-semibold text-foreground truncate">{s.code}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-muted-foreground text-[10px]">{s.timestamp}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveScan(idx)}
                                  title="Remove this unit scan"
                                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-all"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Right: Mode-specific info */}
                    {legacyGsMode ? (
                      <div className="rounded-lg border bg-amber-500/5 border-amber-500/20 p-3.5 space-y-3 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400 pb-2 border-b border-amber-500/20">
                            <Repeat2 className="size-4" />
                            <span>Legacy GS1 Session Overview</span>
                          </div>
                          <div className="space-y-2 text-xs text-muted-foreground pt-1">
                            <div className="flex justify-between py-1 border-b border-border/50">
                              <span className="font-medium text-foreground">Target Product:</span>
                              <span className="font-semibold text-foreground">
                                {productsData?.content.find((p) => String(p.id) === scanProductId)?.name ?? "Selected Product"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border/50">
                              <span className="font-medium text-foreground">Warehouse Location:</span>
                              <span>
                                {locations?.find((l) => String(l.id) === scanLocationId)?.name ?? "Selected Location"}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border/50">
                              <span className="font-medium text-foreground">Counted Physical Units:</span>
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 text-sm">
                                {scannedCodes.length.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 pt-1">
                              Every scan of the product barcode adds 1 verified unit to stock. Click <strong>Finish &amp; Save</strong> when your count is complete.
                            </p>
                          </div>
                        </div>

                        {scannedCodes.length > 0 && (
                          <div className="pt-2 border-t border-amber-500/20 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (window.confirm("Reset all scans to 0?")) {
                                  setScannedCodes([]);
                                }
                              }}
                              className="text-xs h-8 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/10"
                            >
                              <RotateCcw className="mr-1.5 size-3.5" /> Reset Count (0)
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-lg border p-3.5 space-y-2 flex flex-col">
                        <div className="flex items-center justify-between pb-2 border-b">
                          <div className="flex items-center gap-1.5 font-semibold text-rose-600">
                            <AlertCircle className="size-4" />
                            <span>Duplicates Rejected ({rejectedCodes.length})</span>
                          </div>
                        </div>
                        <div className="h-56 overflow-y-auto space-y-1 font-mono pr-1">
                          {rejectedCodes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center font-sans">
                              <ShieldCheck className="size-8 mb-2 opacity-40 text-emerald-500" />
                              <p>No duplicate codes detected</p>
                              <p className="text-[11px] opacity-70">Each scan was verified unique</p>
                            </div>
                          ) : (
                            rejectedCodes.map((r, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between p-2 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300"
                              >
                                <span className="font-semibold">{r.code}</span>
                                <span className="text-[10px] opacity-70">{r.timestamp}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
