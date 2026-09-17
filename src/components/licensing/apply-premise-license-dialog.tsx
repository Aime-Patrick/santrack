"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Provinces, Districts, Sectors, Cells, Villages } from "rwanda";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApplyLicense,
  useLicenseCategories,
  useAttachDocument,
  useSubmitLicense,
} from "@/hooks/licensing";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MapPickerModal } from "@/components/licensing/map-picker-modal";
import {
  Building2,
  MapPin,
  UserCheck,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  LoaderCircle,
  FileText,
  Navigation,
  Map,
  Check,
} from "lucide-react";



const premiseSchema = z.object({
  categoryId: z.number().min(1, "Select a premise classification"),
  premiseName: z.string().min(2, "Premise name is required"),
  province: z.string().min(2, "Province is required"),
  district: z.string().min(2, "District is required"),
  sector: z.string().min(2, "Sector is required"),
  cell: z.string().optional(),
  village: z.string().optional(),
  businessCenter: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  landUpi: z.string().optional(),
  ownershipType: z.enum(["OWNED", "RENTED", "OTHER"]),
  leaseExpiry: z.string().optional(),
  ownershipDetail: z.string().optional(),
  // Technician
  technicianName: z.string().min(2, "Responsible technician name is required"),
  technicianTitle: z.string().min(2, "Designation / Title is required"),
  technicianGender: z.enum(["MALE", "FEMALE"]),
  technicianIdNumber: z.string().min(5, "ID / Passport number is required"),
  technicianPhone: z.string().min(8, "Phone number is required"),
  technicianEmail: z.string().email("Valid email is required"),
  // Products
  productsProduced: z.string().min(3, "Specify products to be manufactured"),
  notes: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.ownershipType === "RENTED" && !values.leaseExpiry?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["leaseExpiry"],
      message: "Lease expiry date is required for rented premises",
    });
  }
  if (values.ownershipType === "OTHER" && (values.ownershipDetail?.trim().length ?? 0) < 2) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["ownershipDetail"],
      message: "Please describe the ownership arrangement",
    });
  }
});

type PremiseFormValues = z.infer<typeof premiseSchema>;

interface ApplyPremiseLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ApplyPremiseLicenseDialog({
  open,
  onOpenChange,
  onSuccess,
}: ApplyPremiseLicenseDialogProps) {
  const { data: categories, isLoading: categoriesLoading } =
    useLicenseCategories();
  const applyMutation = useApplyLicense();
  const submitMutation = useSubmitLicense();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [createdLicenseId, setCreatedLicenseId] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>(
    {},
  );

  // GPS & Map State
  const [isLocating, setIsLocating] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  const attachMutation = useAttachDocument(createdLicenseId ?? 0);

  const form = useForm<PremiseFormValues>({
    resolver: zodResolver(premiseSchema),
    defaultValues: {
      categoryId: 0,
      premiseName: "",
      province: "",
      district: "",
      sector: "",
      cell: "",
      village: "",
      businessCenter: "",
      latitude: "",
      longitude: "",
      landUpi: "",
      ownershipType: "OWNED",
      leaseExpiry: "",
      ownershipDetail: "",
      technicianName: "",
      technicianTitle: "Quality Assurance Officer",
      technicianGender: "MALE",
      technicianIdNumber: "",
      technicianPhone: "",
      technicianEmail: "",
      productsProduced: "",
      notes: "",
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedProvince = form.watch("province");
  const selectedDistrict = form.watch("district");
  const selectedSector = form.watch("sector");
  const selectedCell = form.watch("cell");
  const selectedVillage = form.watch("village");
  const ownershipType = form.watch("ownershipType");
  const currentLat = form.watch("latitude");
  const currentLng = form.watch("longitude");

  // Rwanda Administrative hierarchy
  const rwandaProvinces = useMemo(() => {
    try {
      return Provinces() ?? [];
    } catch {
      return [];
    }
  }, []);

  const rwandaDistricts = useMemo(() => {
    if (!selectedProvince) return [];
    try {
      return Districts(selectedProvince) ?? [];
    } catch {
      return [];
    }
  }, [selectedProvince]);

  const rwandaSectors = useMemo(() => {
    if (!selectedProvince || !selectedDistrict) return [];
    try {
      return Sectors(selectedProvince, selectedDistrict) ?? [];
    } catch {
      return [];
    }
  }, [selectedProvince, selectedDistrict]);

  const rwandaCells = useMemo(() => {
    if (!selectedProvince || !selectedDistrict || !selectedSector) return [];
    try {
      return Cells(selectedProvince, selectedDistrict, selectedSector) ?? [];
    } catch {
      return [];
    }
  }, [selectedProvince, selectedDistrict, selectedSector]);

  const rwandaVillages = useMemo(() => {
    if (
      !selectedProvince ||
      !selectedDistrict ||
      !selectedSector ||
      !selectedCell
    )
      return [];
    try {
      return (
        Villages(
          selectedProvince,
          selectedDistrict,
          selectedSector,
          selectedCell,
        ) ?? []
      );
    } catch {
      return [];
    }
  }, [selectedProvince, selectedDistrict, selectedSector, selectedCell]);

  // Filter premise categories
  const premiseCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(
      (c) =>
        c.code.includes("PREMISE") ||
        c.code.includes("MCC") ||
        c.name.toLowerCase().includes("premise") ||
        c.name.toLowerCase().includes("collection center"),
    );
  }, [categories]);

  const selectedCategory = useMemo(() => {
    return categories?.find((c) => c.id === selectedCategoryId);
  }, [categories, selectedCategoryId]);

  // Automatically select first premise category
  useEffect(() => {
    if (premiseCategories.length > 0 && !selectedCategoryId) {
      form.setValue("categoryId", premiseCategories[0].id);
    }
  }, [premiseCategories, selectedCategoryId, form]);

  // GPS detect via browser Geolocation
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = Number(position.coords.latitude.toFixed(6));
        const lng = Number(position.coords.longitude.toFixed(6));
        form.setValue("latitude", String(lat));
        form.setValue("longitude", String(lng));
        toast.success(
          `GPS location captured: ${lat}, ${lng} (±${Math.round(position.coords.accuracy)}m)`,
        );
      },
      (error) => {
        setIsLocating(false);
        toast.error(`Could not get GPS location: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Handle map confirm
  const handleConfirmMapPin = (lat: number, lng: number) => {
    form.setValue("latitude", String(lat.toFixed(6)));
    form.setValue("longitude", String(lng.toFixed(6)));
    toast.success(`Location set: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  };

  const handleCreateDraft = async (values: PremiseFormValues) => {
    try {
      const license = await applyMutation.mutateAsync({
        categoryId: values.categoryId,
        notes: [
          values.notes?.trim(),
          values.ownershipType === "OTHER" && values.ownershipDetail?.trim()
            ? `Ownership details: ${values.ownershipDetail.trim()}`
            : null,
        ]
          .filter(Boolean)
          .join("\n") || undefined,
        premiseMetadata:
          values.ownershipType === "OTHER" && values.ownershipDetail?.trim()
            ? { ownershipDetail: values.ownershipDetail.trim() }
            : undefined,
        facilityDetails: {
          name: values.premiseName,
          province: values.province,
          district: values.district,
          sector: values.sector,
          cell: values.cell,
          village: values.village,
          businessCenter: values.businessCenter,
          gpsCoordinates:
            values.latitude && values.longitude
              ? {
                  lat: parseFloat(values.latitude),
                  lng: parseFloat(values.longitude),
                }
              : undefined,
          landUpi: values.landUpi,
          ownershipType: values.ownershipType,
          leaseContractExpiry: values.ownershipType === "RENTED" ? values.leaseExpiry : undefined,
        },
      });

      setCreatedLicenseId(license.id);
      toast.success(
        `Draft premise registration created (#${license.licenseNumber})`,
      );
      setStep(4);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const handleFileUpload = async (docType: string, file: File) => {
    if (!createdLicenseId) return;
    try {
      await attachMutation.mutateAsync({ documentType: docType, file });
      setUploadedDocs((prev) => ({ ...prev, [docType]: file }));
      setUploadProgress((prev) => ({ ...prev, [docType]: true }));
      toast.success(`Attached ${docType.replace(/_/g, " ")}`);
    } catch (err) {
      toast.error(`Failed to upload document: ${getApiErrorMessage(err)}`);
    }
  };

  const handleFinalSubmit = async () => {
    if (!createdLicenseId) return;
    try {
      await submitMutation.mutateAsync(createdLicenseId);
      toast.success(
        "Premise application submitted successfully for inspection and review!",
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const requiredDocs = selectedCategory?.requiredDocuments ?? [];
  const allDocsDone =
    requiredDocs.length > 0 &&
    requiredDocs.every((doc) => uploadProgress[doc]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPopup className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden p-0 sm:max-w-2xl">
          {/* Header */}
          <div className="shrink-0 border-b border-border bg-card p-5 pb-4">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Building2 className="size-4 text-primary" />
              Premise Registration / Kwandikisha Inyubako (RICA & RFDA)
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
              Apply to register and license a manufacturing plant, collection center, or industrial premise.
            </DialogDescription>

            {/* Step Indicator */}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
              <span
                className={cn(
                  "flex items-center gap-1 font-medium",
                  step === 1 ? "text-primary font-bold" : "text-muted-foreground",
                )}
              >
                <MapPin className="size-3.5" /> 1. Location & Site
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 font-medium",
                  step === 2 ? "text-primary font-bold" : "text-muted-foreground",
                )}
              >
                <UserCheck className="size-3.5" /> 2. Technical Officer
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 font-medium",
                  step === 3 ? "text-primary font-bold" : "text-muted-foreground",
                )}
              >
                <FileText className="size-3.5" /> 3. Products
              </span>
              <span
                className={cn(
                  "flex items-center gap-1 font-medium",
                  step === 4 ? "text-primary font-bold" : "text-muted-foreground",
                )}
              >
                <FileCheck className="size-3.5" /> 4. Dossier Upload
              </span>
            </div>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-5">
            <form id="premise-form" onSubmit={form.handleSubmit(handleCreateDraft)} className="space-y-4">
              {/* STEP 1: PREMISE & LOCATION */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Premise Category <span className="font-bold text-red-500">*</span>
                    </Label>
                    {categoriesLoading ? (
                      <div className="h-9 animate-pulse rounded-md bg-muted" />
                    ) : (
                      <Select
                        value={selectedCategoryId ? String(selectedCategoryId) : ""}
                        onValueChange={(val) => {
                          if (val) form.setValue("categoryId", parseInt(val, 10));
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          {selectedCategoryId && selectedCategory ? (
                            <span className="text-foreground">
                              {selectedCategory.name}
                            </span>
                          ) : (
                            <SelectValue placeholder="Select premise type..." />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {(premiseCategories.length > 0
                            ? premiseCategories
                            : (categories ?? [])
                          ).map((cat) => (
                            <SelectItem key={cat.id} value={String(cat.id)}>
                              {cat.name}
                              <span className="ml-1.5 text-[10px] text-muted-foreground font-mono">({cat.code})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {form.formState.errors.categoryId && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.categoryId.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Premise / Plant Name (Izina ry'inyubako) <span className="font-bold text-red-500">*</span>
                    </Label>
                    <Input
                      {...form.register("premiseName")}
                      placeholder="e.g. Nyagatare Milk Processing Plant"
                      className="h-9 text-xs"
                    />
                    {form.formState.errors.premiseName && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.premiseName.message}
                      </p>
                    )}
                  </div>

                  {/* Province & District */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Province (Intara) <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedProvince || ""}
                        onValueChange={(val) => {
                          form.setValue("province", val || "");
                          form.setValue("district", "");
                          form.setValue("sector", "");
                          form.setValue("cell", "");
                          form.setValue("village", "");
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select province..." />
                        </SelectTrigger>
                        <SelectContent>
                          {rwandaProvinces.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.province && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.province.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        District (Akarere) <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedDistrict || ""}
                        disabled={!selectedProvince}
                        onValueChange={(val) => {
                          form.setValue("district", val || "");
                          form.setValue("sector", "");
                          form.setValue("cell", "");
                          form.setValue("village", "");
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue
                            placeholder={
                              selectedProvince
                                ? "Select district..."
                                : "Select province first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {rwandaDistricts.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.district && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.district.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sector, Cell, Village */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Sector (Umurenge) <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Select
                        value={selectedSector || ""}
                        disabled={!selectedDistrict}
                        onValueChange={(val) => {
                          form.setValue("sector", val || "");
                          form.setValue("cell", "");
                          form.setValue("village", "");
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue
                            placeholder={
                              selectedDistrict
                                ? "Select sector..."
                                : "Select district first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {rwandaSectors.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.sector && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.sector.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Cell (Akagari)</Label>
                      <Select
                        value={selectedCell || ""}
                        disabled={!selectedSector}
                        onValueChange={(val) => {
                          form.setValue("cell", val || "");
                          form.setValue("village", "");
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue
                            placeholder={
                              selectedSector
                                ? "Select cell..."
                                : "Select sector first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {rwandaCells.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Village (Umudugudu)</Label>
                      <Select
                        value={selectedVillage || ""}
                        disabled={!selectedCell}
                        onValueChange={(val) => {
                          form.setValue("village", val || "");
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue
                            placeholder={
                              selectedCell
                                ? "Select village..."
                                : "Select cell first"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {rwandaVillages.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* UPI & GPS Smart Capture Section */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* UPI */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">UPI</Label>
                        <Input
                          {...form.register("landUpi")}
                          placeholder="e.g. 1/02/03/04/5678"
                          className="h-9 text-xs"
                        />
                      </div>

                      {/* Business Center / Landmark */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Business Center / Landmark</Label>
                        <Input
                          {...form.register("businessCenter")}
                          placeholder="e.g. Near Nyagatare Dairy Cooperative"
                          className="h-9 text-xs"
                        />
                      </div>
                    </div>

                    {/* GPS Coordinates Header & Action Buttons */}
                    <div className="border-t border-border/80 pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-medium">
                            Premise GPS Location
                          </Label>
                          <p className="text-[13px] text-muted-foreground">
                            Detect automatically from your device or select directly on map
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleDetectGPS}
                            disabled={isLocating}
                            className="h-7 text-xs gap-1"
                          >
                            {isLocating ? (
                              <LoaderCircle className="size-3 animate-spin" />
                            ) : (
                              <Navigation className="size-3 text-primary" />
                            )}
                            {isLocating ? "Locating..." : "Detect Location"}
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowMapModal(true)}
                            className="h-7 text-xs gap-1"
                          >
                            <Map className="size-3 text-primary" />
                            Pick from Map
                          </Button>
                        </div>
                      </div>

                      {/* Coordinates Display Bar */}
                      <div className="flex items-center justify-between rounded-md border border-border/80 bg-background px-3 py-2 text-xs">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-primary" />
                          {currentLat && currentLng ? (
                            <span className="font-mono text-foreground font-medium">
                              Lat: {currentLat} • Long: {currentLng}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              No GPS coordinates captured yet
                            </span>
                          )}
                        </div>

                        {currentLat && currentLng ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            <Check className="size-3" /> Selected
                          </span>
                        ) : (
                          <span className="text-[13px] text-muted-foreground">
                            Optional but recommended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ownership & Lease */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Premise Ownership (Nyir'inyubako) <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Select
                        value={ownershipType}
                        onValueChange={(val) => {
                          if (val)
                            form.setValue(
                              "ownershipType",
                              val as "OWNED" | "RENTED" | "OTHER",
                            );
                          if (val !== "RENTED") form.setValue("leaseExpiry", "");
                          if (val !== "OTHER") form.setValue("ownershipDetail", "");
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNED">Owner / Iyanjye</SelectItem>
                          <SelectItem value="RENTED">
                            Rented / Ndakodesha (≥ 1 Year)
                          </SelectItem>
                          <SelectItem value="OTHER">Other / Ikindi</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {ownershipType === "RENTED" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Lease Contract Expiry Date <span className="font-bold text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          {...form.register("leaseExpiry")}
                          className="h-9 text-xs"
                        />
                        {form.formState.errors.leaseExpiry && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.leaseExpiry.message}
                          </p>
                        )}
                      </div>
                    )}

                    {ownershipType === "OTHER" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">
                          Please specify ownership <span className="font-bold text-red-500">*</span>
                        </Label>
                        <Input
                          {...form.register("ownershipDetail")}
                          placeholder="e.g. Inherited, partnership, government land…"
                          className="h-9 text-xs"
                        />
                        {form.formState.errors.ownershipDetail && (
                          <p className="text-xs text-destructive">
                            {form.formState.errors.ownershipDetail.message}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: TECHNICAL PERSONNEL */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                    Per RICA & Rwanda FDA regulations, every food manufacturing premise must have a
                    notarized qualified technical person / Quality Assurance manager overseeing
                    production.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Technician Full Names (Amazina) <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Input
                        {...form.register("technicianName")}
                        placeholder="e.g. Jean Damascene Hakizimana"
                        className="h-9 text-xs"
                      />
                      {form.formState.errors.technicianName && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.technicianName.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Designation / Title (Icyo ashinzwe) <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Input
                        {...form.register("technicianTitle")}
                        placeholder="e.g. Quality Assurance Manager"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        National ID / Passport Number <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Input
                        {...form.register("technicianIdNumber")}
                        placeholder="1199080012345678"
                        className="h-9 text-xs"
                      />
                      {form.formState.errors.technicianIdNumber && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.technicianIdNumber.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Gender (Igitsina) <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Select
                        value={form.watch("technicianGender")}
                        onValueChange={(val) => {
                          if (val)
                            form.setValue(
                              "technicianGender",
                              val as "MALE" | "FEMALE",
                            );
                        }}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male (Gabo)</SelectItem>
                          <SelectItem value="FEMALE">Female (Gore)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Phone Number <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Input
                        {...form.register("technicianPhone")}
                        placeholder="+250 788 123 456"
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Email Address <span className="font-bold text-red-500">*</span>
                      </Label>
                      <Input
                        {...form.register("technicianEmail")}
                        placeholder="technician@company.rw"
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PRODUCTS TO PRODUCE */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Products to be Produced (Ibicuruzwa bishobora gukorerwa mu ruganda) <span className="font-bold text-red-500">*</span>
                    </Label>
                    <Textarea
                      {...form.register("productsProduced")}
                      placeholder="e.g. Pasteurized Fresh Milk, Fermented Milk (Ikivuguto), Gouda Cheese, Yoghurt..."
                      rows={3}
                      className="text-xs"
                    />
                    {form.formState.errors.productsProduced && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.productsProduced.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Additional Application Notes (optional)
                    </Label>
                    <Textarea
                      {...form.register("notes")}
                      placeholder="Any operational remarks or regulatory context for the inspector..."
                      rows={2}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}

              {/* STEP 4: REGULATORY DOSSIER UPLOADS */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
                    <strong>Application Draft Created!</strong> Please upload the official required
                    dossier documents below per Rwanda FDA (DIS/GDL/005) & RICA (RLU-FRM-010) requirements.
                  </div>

                  <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                    {requiredDocs.map((docType) => {
                      const isDone = uploadProgress[docType];
                      return (
                        <div
                          key={docType}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="font-medium text-foreground truncate">
                              {docType.replace(/_/g, " ")}
                            </p>
                            <p className="text-[13px] text-muted-foreground">
                              {isDone ? "✓ Uploaded & Attached" : "PDF or certified image"}
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isDone ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="size-4" /> Attached
                              </span>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
                                <Upload className="size-3" /> Upload File
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload(docType, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="shrink-0 border-t border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              {step === 1 ? (
                <DialogClose render={<Button variant="outline" size="sm" />}>
                  Cancel
                </DialogClose>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep((s) => (s > 1 ? ((s - 1) as any) : s))}
                >
                  <ArrowLeft className="mr-1 size-3.5" /> Back
                </Button>
              )}

              {step === 1 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    const ok = await form.trigger([
                      "categoryId",
                      "premiseName",
                      "province",
                      "district",
                      "sector",
                    ]);
                    if (ok) setStep(2);
                  }}
                >
                  Next: Technical Officer <ArrowRight className="ml-1 size-3.5" />
                </Button>
              )}

              {step === 2 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    const ok = await form.trigger([
                      "technicianName",
                      "technicianTitle",
                      "technicianIdNumber",
                      "technicianPhone",
                      "technicianEmail",
                    ]);
                    if (ok) setStep(3);
                  }}
                >
                  Next: Products & Lines <ArrowRight className="ml-1 size-3.5" />
                </Button>
              )}

              {step === 3 && (
                <Button
                  type="submit"
                  form="premise-form"
                  size="sm"
                  disabled={applyMutation.isPending}
                >
                  {applyMutation.isPending ? (
                    <>
                      <LoaderCircle className="mr-1.5 size-4 animate-spin" /> Saving Draft...
                    </>
                  ) : (
                    <>
                      Create Premise Application <ArrowRight className="ml-1.5 size-4" />
                    </>
                  )}
                </Button>
              )}

              {step === 4 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleFinalSubmit}
                  disabled={!allDocsDone || submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <>
                      <LoaderCircle className="mr-1.5 size-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>Submit for Review</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogPopup>
      </Dialog>

      {/* Full-screen interactive Map Picker */}
      <MapPickerModal
        open={showMapModal}
        onOpenChange={setShowMapModal}
        initialLat={currentLat ? parseFloat(currentLat) : -1.9441}
        initialLng={currentLng ? parseFloat(currentLng) : 30.0619}
        onConfirm={handleConfirmMapPin}
      />
    </>
  );
}
