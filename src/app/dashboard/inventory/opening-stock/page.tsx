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
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useProducts, useCreateProduct, useProductCategories } from "@/hooks/products";
import { useBatches, useCreateBatch } from "@/hooks/batches";
import { useLocations, useCreateLocation } from "@/hooks/locations";
import { useRegisterUnits } from "@/hooks/items";
import { type PackageType } from "@/services/item.service";
import { CategoryDialog } from "@/components/products/category-dialogs";
import { cn } from "@/lib/utils";

type CountMethod = "boxes" | "total" | "scan";

function makeLotCode() {
  const d = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const r = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LOT-${d}-${r}`;
}

export default function OpeningStockPage() {
  const router = useRouter();
  const { data: productsData } = useProducts(0, 200);
  const { data: batches } = useBatches();
  const { data: locations } = useLocations();
  const { data: categories } = useProductCategories();

  const registerUnits = useRegisterUnits();
  const createBatch = useCreateBatch();
  const createProduct = useCreateProduct();
  const createLocation = useCreateLocation();

  const [method, setMethod] = useState<CountMethod | null>(null);

  // Quick-create dialogs (new companies stay on this page)
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState("");

  // Count boxes
  const [cartonProductId, setCartonProductId] = useState("");
  const [cartonBatchId, setCartonBatchId] = useState("");
  const [cartonLocationId, setCartonLocationId] = useState("");
  const [cartonPackageType, setCartonPackageType] = useState<PackageType>("BOX");
  const [unitsPerCarton, setUnitsPerCarton] = useState(24);
  const [cartonCount, setCartonCount] = useState(100);
  const [isSubmittingCartons, setIsSubmittingCartons] = useState(false);
  const [showBoxMore, setShowBoxMore] = useState(false);

  const totalUnits = (Number(unitsPerCarton) || 0) * (Number(cartonCount) || 0);

  // Type how many
  const [batchProductId, setBatchProductId] = useState("");
  const [batchCode, setBatchCode] = useState(makeLotCode);
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
  const [showLotDetails, setShowLotDetails] = useState(false);

  // Scan each one
  const [scanProductId, setScanProductId] = useState("");
  const [scanBatchId, setScanBatchId] = useState("");
  const [scanLocationId, setScanLocationId] = useState("");
  const [targetScanCount, setTargetScanCount] = useState(1000);
  const [scanSessionActive, setScanSessionActive] = useState(false);
  const [currentScanInput, setCurrentScanInput] = useState("");
  const [scannedCodes, setScannedCodes] = useState<Array<{ code: string; timestamp: string }>>([]);
  const [rejectedCodes, setRejectedCodes] = useState<Array<{ code: string; reason: string; timestamp: string }>>([]);
  // false = each bottle has its own code; true = same code on every bottle
  const [sameCodeOnEveryBottle, setSameCodeOnEveryBottle] = useState(false);
  const [showScanMore, setShowScanMore] = useState(false);
  const [countedPage, setCountedPage] = useState(0);
  const [rejectedPage, setRejectedPage] = useState(0);
  const [listPageSize, setListPageSize] = useState(10);
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scanSessionActive && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [scanSessionActive]);

  // New scans prepend to the list — keep the user on the first page so they see them.
  useEffect(() => {
    setCountedPage(0);
  }, [scannedCodes.length]);

  useEffect(() => {
    setRejectedPage(0);
  }, [rejectedCodes.length]);

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
      toast.error("Choose a product and a place first");
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
      toast.success(`${totalUnits.toLocaleString()} pieces added to stock`);
      router.push("/dashboard/inventory");
    } catch {
      toast.error("Could not add stock. Try again.");
    } finally {
      setIsSubmittingCartons(false);
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchProductId || !batchLocationId || batchQuantity <= 0) {
      toast.error("Choose a product and a place first");
      return;
    }
    if (!batchCertified) {
      toast.error("Please tick the box to confirm this stock is already here");
      return;
    }

    const code = (batchCode.trim() || makeLotCode()).toUpperCase();

    setIsSubmittingBatch(true);
    try {
      const newBatch = await createBatch.mutateAsync({
        productId: Number(batchProductId),
        batchCode: code,
        manufacturedOn: batchManufacturedOn,
        expiresOn: batchExpiresOn,
      });

      await registerUnits.mutateAsync({
        productId: Number(batchProductId),
        batchId: newBatch.id,
        locationId: Number(batchLocationId),
        count: Number(batchQuantity),
      });

      toast.success(`${batchQuantity.toLocaleString()} pieces added to stock`);
      router.push("/dashboard/inventory");
    } catch {
      toast.error("Could not add stock. Try again.");
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = currentScanInput.trim();
    if (!code) return;

    const timestamp = new Date().toLocaleTimeString();

    if (sameCodeOnEveryBottle) {
      playAudioCue("success");
      setScannedCodes((prev) => [{ code, timestamp }, ...prev]);
    } else {
      const isDuplicate = scannedCodes.some((s) => s.code === code);
      if (isDuplicate) {
        playAudioCue("duplicate");
        setRejectedCodes((prev) => [
          { code, reason: "Already scanned — choose “Same code on every bottle” if all bottles share one code", timestamp },
          ...prev.slice(0, 29),
        ]);
        toast.error("This code was already scanned", {
          description: "Same code on every bottle? Go back and choose that option.",
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
      const confirmed = window.confirm(
        `Throw away ${scannedCodes.length} scanned pieces and stop?`
      );
      if (!confirmed) return;
    }
    setScannedCodes([]);
    setRejectedCodes([]);
    setScanSessionActive(false);
    toast.info("Scanning cancelled");
  };

  const handleRemoveScan = (indexToRemove: number) => {
    setScannedCodes((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    toast.info("Removed");
  };

  const handleFinishScan = async () => {
    if (scannedCodes.length === 0) {
      toast.error("Scan at least one piece first");
      return;
    }

    try {
      await registerUnits.mutateAsync({
        productId: Number(scanProductId),
        batchId: scanBatchId ? Number(scanBatchId) : undefined,
        locationId: Number(scanLocationId),
        count: scannedCodes.length,
      });
      toast.success(`${scannedCodes.length} pieces added to stock`);
      setScanSessionActive(false);
      router.push("/dashboard/inventory");
    } catch {
      toast.error("Could not save. Try again.");
    }
  };

  const filteredBatches = (productId: string) =>
    batches?.filter((b) => b.productId === Number(productId)) ?? [];

  const products = productsData?.content ?? [];
  const productsReady = productsData !== undefined;
  const hasProducts = products.length > 0;
  const locationList = locations ?? [];
  const hasLocations = locationList.length > 0;

  const applyNewProduct = (id: number) => {
    const idStr = String(id);
    if (method === "boxes") setCartonProductId(idStr);
    else if (method === "total") setBatchProductId(idStr);
    else if (method === "scan") setScanProductId(idStr);
  };

  const applyNewLocation = (id: number) => {
    const idStr = String(id);
    if (method === "boxes") setCartonLocationId(idStr);
    else if (method === "total") setBatchLocationId(idStr);
    else if (method === "scan") setScanLocationId(idStr);
  };

  const handleQuickCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newProductName.trim();
    if (!name) {
      toast.error("Type the product name");
      return;
    }
    if (!newProductCategoryId) {
      toast.error("Choose a category for this product");
      return;
    }
    try {
      const product = await createProduct.mutateAsync({
        name,
        sku: newProductSku.trim() || undefined,
        categoryId: Number(newProductCategoryId),
      });
      setProductDialogOpen(false);
      setNewProductName("");
      setNewProductSku("");
      setNewProductCategoryId("");
      if (product?.id) applyNewProduct(product.id);
    } catch {
      // toast from hook
    }
  };

  const handleQuickCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newLocationName.trim();
    if (!name) {
      toast.error("Type the place name");
      return;
    }
    try {
      const location = await createLocation.mutateAsync({
        name,
        type: "WAREHOUSE",
      });
      setLocationDialogOpen(false);
      setNewLocationName("");
      if (location?.id) applyNewLocation(location.id);
    } catch {
      // toast from hook
    }
  };

  const goBackToChoices = () => {
    if (scanSessionActive) {
      handleCancelSession();
      return;
    }
    setMethod(null);
  };

  const methodTitle =
    method === "boxes"
      ? "Count boxes"
      : method === "total"
        ? "Type how many"
        : method === "scan"
          ? "Scan each one"
          : null;

  const countedTotalPages = Math.max(1, Math.ceil(scannedCodes.length / listPageSize));
  const countedPageSafe = Math.min(countedPage, countedTotalPages - 1);
  const countedSliceStart = countedPageSafe * listPageSize;
  const countedPageItems = scannedCodes.slice(
    countedSliceStart,
    countedSliceStart + listPageSize
  );

  const rejectedTotalPages = Math.max(1, Math.ceil(rejectedCodes.length / listPageSize));
  const rejectedPageSafe = Math.min(rejectedPage, rejectedTotalPages - 1);
  const rejectedSliceStart = rejectedPageSafe * listPageSize;
  const rejectedPageItems = rejectedCodes.slice(
    rejectedSliceStart,
    rejectedSliceStart + listPageSize
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {!scanSessionActive && (
        <div className="flex items-center justify-between">
          {method ? (
            <button
              type="button"
              onClick={goBackToChoices}
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1.5 size-4" /> Change how you count
            </button>
          ) : (
            <Link
              href="/dashboard/inventory"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="mr-1.5 size-4" /> Back to Inventory
            </Link>
          )}
        </div>
      )}

      {!scanSessionActive && (
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Opening Stock</h1>
          <p className="text-sm text-muted-foreground">
            Add stock that is already in the warehouse.
          </p>
        </div>
      )}

      {scanSessionActive && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setScanSessionActive(false)}
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="mr-1.5 size-4" /> Back to setup
          </button>
          <p className="text-sm font-medium text-muted-foreground">Opening Stock · Scan</p>
        </div>
      )}

      {/* No catalogue products yet — create right here */}
      {productsReady && !hasProducts && (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <PackagePlus className="size-7 text-muted-foreground" />
            </div>
            <div className="space-y-2 max-w-md">
              <p className="text-lg font-semibold">Create a product first</p>
              <p className="text-sm text-muted-foreground">
                For a new company, start with the product name here.
                You can add more details later under Products.
              </p>
            </div>
            <Button
              size="lg"
              className="h-12"
              onClick={() => setProductDialogOpen(true)}
            >
              <PackagePlus className="mr-2 size-5" /> Create product here
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 1 — How do you want to count? */}
      {hasProducts && !method && (
        <div className="space-y-4">
          <p className="text-base font-medium">How do you want to count?</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setMethod("boxes")}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Box className="size-6 text-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">Count boxes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  I counted cartons or boxes. Tell me how many boxes and how many pieces in each.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod("total")}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileCheck className="size-6 text-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">Type how many</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  I already know the total number of pieces. I will type it in.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMethod("scan")}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <ScanLine className="size-6 text-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">Scan each one</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  I will scan every bottle or pack with a barcode scanner.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Count boxes */}
      {hasProducts && method === "boxes" && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{methodTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCartonSubmit} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-base">What product?</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary"
                    onClick={() => setProductDialogOpen(true)}
                  >
                    <PackagePlus className="mr-1 size-3.5" /> New product
                  </Button>
                </div>
                <Select value={cartonProductId} onValueChange={(v) => setCartonProductId(v || "")}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="Choose product">
                      {cartonProductId
                        ? products.find((p) => String(p.id) === cartonProductId)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-base">Where is it?</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary"
                    onClick={() => setLocationDialogOpen(true)}
                  >
                    <MapPin className="mr-1 size-3.5" /> New place
                  </Button>
                </div>
                <Select value={cartonLocationId} onValueChange={(v) => setCartonLocationId(v || "")}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder={hasLocations ? "Choose place" : "Add a place first"}>
                      {cartonLocationId
                        ? locationList.find((l) => String(l.id) === cartonLocationId)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {locationList.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-base">How many boxes?</Label>
                  <Input
                    type="number"
                    min={1}
                    value={cartonCount}
                    onChange={(e) => setCartonCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-12 text-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-base">Pieces in each box?</Label>
                  <Input
                    type="number"
                    min={1}
                    value={unitsPerCarton}
                    onChange={(e) => setUnitsPerCarton(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-12 text-lg"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-border bg-muted/40 px-5 py-4">
                <p className="text-sm text-muted-foreground">You will add</p>
                <p className="text-3xl font-bold tracking-tight">
                  {totalUnits.toLocaleString()} pieces
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {cartonCount} boxes × {unitsPerCarton} pieces
                </p>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowBoxMore((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {showBoxMore ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  More options
                </button>
                {showBoxMore && (
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Box type</Label>
                      <Select
                        value={cartonPackageType}
                        onValueChange={(v) => setCartonPackageType(v as PackageType)}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BOX">Box</SelectItem>
                          <SelectItem value="CARTON">Carton</SelectItem>
                          <SelectItem value="CASE">Case</SelectItem>
                          <SelectItem value="CRATE">Crate</SelectItem>
                          <SelectItem value="PALLET">Pallet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Lot (optional)</Label>
                      <Select
                        value={cartonBatchId}
                        onValueChange={(v) => setCartonBatchId(v || "")}
                        disabled={!cartonProductId}
                      >
                        <SelectTrigger className="w-full h-10">
                          <SelectValue placeholder={cartonProductId ? "No lot" : "Choose product first"}>
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
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isSubmittingCartons || !cartonProductId || !cartonLocationId}
                className="w-full h-12 text-base"
              >
                {isSubmittingCartons ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  `Add ${totalUnits.toLocaleString()} pieces to stock`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Type how many */}
      {hasProducts && method === "total" && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{methodTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBatchSubmit} className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-base">What product?</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary"
                    onClick={() => setProductDialogOpen(true)}
                  >
                    <PackagePlus className="mr-1 size-3.5" /> New product
                  </Button>
                </div>
                <Select value={batchProductId} onValueChange={(v) => setBatchProductId(v || "")}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder="Choose product">
                      {batchProductId
                        ? products.find((p) => String(p.id) === batchProductId)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-base">Where is it?</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-primary"
                    onClick={() => setLocationDialogOpen(true)}
                  >
                    <MapPin className="mr-1 size-3.5" /> New place
                  </Button>
                </div>
                <Select value={batchLocationId} onValueChange={(v) => setBatchLocationId(v || "")}>
                  <SelectTrigger className="w-full h-12 text-base">
                    <SelectValue placeholder={hasLocations ? "Choose place" : "Add a place first"}>
                      {batchLocationId
                        ? locationList.find((l) => String(l.id) === batchLocationId)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {locationList.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-base">How many pieces?</Label>
                <Input
                  type="number"
                  min={1}
                  value={batchQuantity}
                  onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-12 text-lg"
                />
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/20 p-4">
                <input
                  type="checkbox"
                  id="batch-certify"
                  checked={batchCertified}
                  onChange={(e) => setBatchCertified(e.target.checked)}
                  className="mt-1 size-5 rounded border-input text-primary cursor-pointer accent-primary"
                />
                <label htmlFor="batch-certify" className="text-sm cursor-pointer font-medium leading-snug">
                  Yes, this stock is already here.
                </label>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowLotDetails((v) => !v)}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  {showLotDetails ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  Lot details (optional)
                </button>
                {showLotDetails && (
                  <div className="mt-3 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Lot code</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBatchCode(makeLotCode())}
                          className="h-7 px-2 text-xs gap-1"
                        >
                          <RefreshCw className="size-3" /> Make one for me
                        </Button>
                      </div>
                      <Input
                        placeholder="Leave blank — we will make one"
                        value={batchCode}
                        onChange={(e) => setBatchCode(e.target.value)}
                        className="h-10 font-mono"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Made on</Label>
                        <Input
                          type="date"
                          value={batchManufacturedOn}
                          onChange={(e) => setBatchManufacturedOn(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Expires on</Label>
                        <Input
                          type="date"
                          value={batchExpiresOn}
                          onChange={(e) => setBatchExpiresOn(e.target.value)}
                          className="h-10"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={
                  isSubmittingBatch ||
                  !batchProductId ||
                  !batchLocationId ||
                  !batchCertified
                }
                className="w-full h-12 text-base"
              >
                {isSubmittingBatch ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  `Add ${batchQuantity.toLocaleString()} pieces to stock`
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2 — Scan setup */}
      {hasProducts && method === "scan" && !scanSessionActive && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{methodTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-base">What product?</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-primary"
                  onClick={() => setProductDialogOpen(true)}
                >
                  <PackagePlus className="mr-1 size-3.5" /> New product
                </Button>
              </div>
              <Select value={scanProductId} onValueChange={(v) => setScanProductId(v || "")}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder="Choose product">
                    {scanProductId
                      ? products.find((p) => String(p.id) === scanProductId)?.name
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-base">Where is it?</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-primary"
                  onClick={() => setLocationDialogOpen(true)}
                >
                  <MapPin className="mr-1 size-3.5" /> New place
                </Button>
              </div>
              <Select value={scanLocationId} onValueChange={(v) => setScanLocationId(v || "")}>
                <SelectTrigger className="w-full h-12 text-base">
                  <SelectValue placeholder={hasLocations ? "Choose place" : "Add a place first"}>
                    {scanLocationId
                      ? locationList.find((l) => String(l.id) === scanLocationId)?.name
                      : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locationList.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base">Stop around this many (optional)</Label>
              <Input
                type="number"
                min={1}
                value={targetScanCount}
                onChange={(e) => setTargetScanCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-12 text-lg"
              />
              <p className="text-xs text-muted-foreground">
                A goal only — you can save sooner or keep going.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-base">What kind of codes?</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setSameCodeOnEveryBottle(false)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-left transition-colors",
                    !sameCodeOnEveryBottle
                      ? "border-primary/50 bg-primary/5"
                      : "hover:bg-muted/40"
                  )}
                >
                  <ShieldCheck className={cn("size-5", !sameCodeOnEveryBottle ? "text-primary" : "text-muted-foreground")} />
                  <span className="font-semibold text-sm">Each bottle has its own code</span>
                  <span className="text-xs text-muted-foreground">
                    Unique QR codes. Same code twice = error.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSameCodeOnEveryBottle(true)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border border-border p-4 text-left transition-colors",
                    sameCodeOnEveryBottle
                      ? "border-amber-500/50 bg-amber-500/5"
                      : "hover:bg-muted/40"
                  )}
                >
                  <Repeat2 className={cn("size-5", sameCodeOnEveryBottle ? "text-amber-600" : "text-muted-foreground")} />
                  <span className="font-semibold text-sm">Same code on every bottle</span>
                  <span className="text-xs text-muted-foreground">
                    Old printed barcodes. Each scan adds 1 piece.
                  </span>
                </button>
              </div>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setShowScanMore((v) => !v)}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {showScanMore ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                More options
              </button>
              {showScanMore && (
                <div className="mt-3 space-y-2">
                  <Label>Lot (optional)</Label>
                  <Select
                    value={scanBatchId}
                    onValueChange={(v) => setScanBatchId(v || "")}
                    disabled={!scanProductId}
                  >
                    <SelectTrigger className="w-full h-10">
                      <SelectValue placeholder={scanProductId ? "No lot" : "Choose product first"}>
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
              )}
            </div>

            <Button
              size="lg"
              className="w-full h-12 text-base"
              onClick={() => {
                if (!scanProductId || !scanLocationId) {
                  toast.error("Select a product and a place first");
                  return;
                }
                setScanSessionActive(true);
              }}
            >
              <ScanLine className="mr-2 size-5" /> Start scanning
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Scan session — focused floor workspace */}
      {hasProducts && method === "scan" && scanSessionActive && (
        <div className="space-y-4">
          {/* Session toolbar */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-semibold">Scanning now</p>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-border font-normal",
                    sameCodeOnEveryBottle
                      ? "text-amber-800 dark:text-amber-300"
                      : "text-emerald-800 dark:text-emerald-300"
                  )}
                >
                  {sameCodeOnEveryBottle ? "Same code on every bottle" : "Own code each bottle"}
                </Badge>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {products.find((p) => String(p.id) === scanProductId)?.name ?? "Product"}
                </span>
                <span className="mx-1.5 text-border">·</span>
                {locationList.find((l) => String(l.id) === scanLocationId)?.name ?? "Place"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelSession}
                className="text-muted-foreground hover:text-destructive"
              >
                <XCircle className="mr-1.5 size-4" /> Cancel
              </Button>
              <Button variant="outline" size="sm" onClick={() => setScanSessionActive(false)}>
                <Pause className="mr-1.5 size-4" /> Pause
              </Button>
              <Button
                size="sm"
                onClick={handleFinishScan}
                disabled={scannedCodes.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium min-w-[9.5rem]"
              >
                <Check className="mr-1.5 size-4" /> Save to stock ({scannedCodes.length})
              </Button>
            </div>
          </div>

          {/* Big count + optional goal */}
          <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
            <p className="text-6xl font-bold tracking-tight tabular-nums sm:text-7xl">
              {scannedCodes.length.toLocaleString()}
            </p>
            <p className="mt-2 text-base text-muted-foreground">
              pieces scanned
              {targetScanCount > 1 && (
                <span> · goal {targetScanCount.toLocaleString()}</span>
              )}
            </p>
            {targetScanCount > 1 && (
              <div className="mx-auto mt-5 max-w-md space-y-2">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (scannedCodes.length / targetScanCount) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {Math.min(100, Math.round((scannedCodes.length / targetScanCount) * 100))}% of goal
                </p>
              </div>
            )}
          </div>

          {/* Scan input */}
          <form onSubmit={handleScanSubmit}>
            <div className="relative">
              <Barcode className="absolute left-4 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={scanInputRef}
                autoFocus
                placeholder="Scan now — or type a code and press Enter"
                value={currentScanInput}
                onChange={(e) => setCurrentScanInput(e.target.value)}
                className="h-16 border border-border pl-14 pr-4 font-mono text-lg focus-visible:border-ring focus-visible:ring-primary"
              />
            </div>
          </form>

          {/* Lists */}
          <div
            className={cn(
              "grid gap-4",
              sameCodeOnEveryBottle ? "grid-cols-1" : "sm:grid-cols-2"
            )}
          >
            <div className="flex min-h-[16rem] flex-col rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  Counted ({scannedCodes.length})
                </div>
                {scannedCodes.length > 0 && (
                  <div className="flex items-center gap-2">
                    {sameCodeOnEveryBottle && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground"
                        onClick={() => {
                          if (window.confirm("Reset count to 0?")) {
                            setScannedCodes([]);
                          }
                        }}
                      >
                        <RotateCcw className="mr-1 size-3.5" /> Reset
                      </Button>
                    )}
                    <span className="hidden text-[11px] text-muted-foreground sm:inline">
                      Hover a row to remove a mistake
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto font-mono text-xs">
                {scannedCodes.length === 0 ? (
                  <div className="flex h-full min-h-[12rem] flex-col items-center justify-center text-center font-sans text-muted-foreground">
                    <Barcode className="mb-3 size-10 opacity-40" />
                    <p className="text-sm font-medium">Ready to scan</p>
                    <p className="mt-1 text-xs opacity-70">Point the scanner at a barcode</p>
                  </div>
                ) : (
                  countedPageItems.map((s, idx) => {
                    const absoluteIdx = countedSliceStart + idx;
                    return (
                      <div
                        key={`${s.code}-${absoluteIdx}-${s.timestamp}`}
                        className="group flex items-center justify-between rounded-lg bg-muted/40 p-2.5 transition-colors hover:bg-muted/70"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-sans font-bold text-muted-foreground">
                            #{scannedCodes.length - absoluteIdx}
                          </span>
                          <span className="truncate font-semibold text-foreground">{s.code}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{s.timestamp}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveScan(absoluteIdx)}
                            title="Remove"
                            className="rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {scannedCodes.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 font-sans text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>Rows</span>
                    <select
                      className="h-7 rounded-md border border-border bg-background px-2 text-xs"
                      value={listPageSize}
                      onChange={(e) => {
                        setListPageSize(Number(e.target.value));
                        setCountedPage(0);
                        setRejectedPage(0);
                      }}
                    >
                      {[10, 15, 25, 50].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                    <span>
                      {countedSliceStart + 1}–{Math.min(countedSliceStart + listPageSize, scannedCodes.length)} of{" "}
                      {scannedCodes.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={countedPageSafe <= 0}
                      onClick={() => setCountedPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <span className="px-1 tabular-nums">
                      {countedPageSafe + 1} / {countedTotalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 px-2"
                      disabled={countedPageSafe >= countedTotalPages - 1}
                      onClick={() =>
                        setCountedPage((p) => Math.min(countedTotalPages - 1, p + 1))
                      }
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {!sameCodeOnEveryBottle && (
              <div className="flex min-h-[16rem] flex-col rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2 border-b border-border pb-3 font-semibold text-rose-600">
                  <AlertCircle className="size-4" />
                  Already scanned ({rejectedCodes.length})
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto font-mono text-xs">
                  {rejectedCodes.length === 0 ? (
                    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center text-center font-sans text-muted-foreground">
                      <ShieldCheck className="mb-3 size-10 text-emerald-500 opacity-40" />
                      <p className="text-sm font-medium">No duplicates yet</p>
                      <p className="mt-1 text-xs opacity-70">Each code counted once</p>
                    </div>
                  ) : (
                    rejectedPageItems.map((r, idx) => (
                      <div
                        key={`${r.code}-${rejectedSliceStart + idx}-${r.timestamp}`}
                        className="flex justify-between rounded-lg bg-rose-50 p-2.5 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"
                      >
                        <span className="truncate font-semibold">{r.code}</span>
                        <span className="ml-2 shrink-0 text-[10px] opacity-70">{r.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
                {rejectedCodes.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 font-sans text-xs text-muted-foreground">
                    <span>
                      {rejectedSliceStart + 1}–{Math.min(rejectedSliceStart + listPageSize, rejectedCodes.length)} of{" "}
                      {rejectedCodes.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        disabled={rejectedPageSafe <= 0}
                        onClick={() => setRejectedPage((p) => Math.max(0, p - 1))}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="px-1 tabular-nums">
                        {rejectedPageSafe + 1} / {rejectedTotalPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        disabled={rejectedPageSafe >= rejectedTotalPages - 1}
                        onClick={() =>
                          setRejectedPage((p) => Math.min(rejectedTotalPages - 1, p + 1))
                        }
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogPopup className="sm:max-w-md">
          <form onSubmit={handleQuickCreateProduct}>
            <DialogHeader>
              <DialogTitle>New product</DialogTitle>
              <DialogDescription>
                Every product belongs to a category. You can add barcodes and packaging later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="quick-product-name">Product name</Label>
                <Input
                  id="quick-product-name"
                  autoFocus
                  placeholder="e.g. Inyange Juice 500ml"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Category</Label>
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={() => setCategoryDialogOpen(true)}
                  >
                    New category
                  </Button>
                </div>
                <Select
                  value={newProductCategoryId}
                  onValueChange={setNewProductCategoryId}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue placeholder="Select a category">
                      {newProductCategoryId
                        ? categories?.find((c) => String(c.id) === newProductCategoryId)?.name
                        : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(categories ?? [])
                      .filter((c) => c.active)
                      .map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {(categories ?? []).filter((c) => c.active).length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No categories yet — create one with “New category”.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quick-product-sku">Code / SKU (optional)</Label>
                <Input
                  id="quick-product-sku"
                  placeholder="Leave blank if you do not have one"
                  value={newProductSku}
                  onChange={(e) => setNewProductSku(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createProduct.isPending ||
                  !newProductName.trim() ||
                  !newProductCategoryId
                }
              >
                {createProduct.isPending ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </Dialog>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onCreated={(category) => {
          setNewProductCategoryId(String(category.id));
        }}
      />

      <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
        <DialogPopup className="sm:max-w-md">
          <form onSubmit={handleQuickCreateLocation}>
            <DialogHeader>
              <DialogTitle>New place</DialogTitle>
              <DialogDescription>
                Where this stock sits — e.g. Main warehouse or Store room.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="quick-location-name">Place name</Label>
                <Input
                  id="quick-location-name"
                  autoFocus
                  placeholder="e.g. Main warehouse"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createLocation.isPending || !newLocationName.trim()}>
                {createLocation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 size-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save place"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
