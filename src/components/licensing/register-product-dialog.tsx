"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
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
  useApplyProductRegistration,
  useAttachProductDocument,
  useSubmitProductRegistration,
} from "@/hooks/product-registration";
import { useMyLicenses } from "@/hooks/licensing";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Package,
  Layers,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Upload,
  LoaderCircle,
  FlaskConical,
} from "lucide-react";

const productRegSchema = z.object({
  productName: z.string().min(2, "Product name is required"),
  brandName: z.string().optional(),
  facilityId: z.number().optional(),
  intendedUse: z.string().min(3, "Intended use is required"),
  targetConsumer: z.string().optional(),
  ingredientsList: z.string().min(3, "List ingredients (e.g. Pasteurized Milk 98%, Culture 2%)"),
  netContents: z.string().min(2, "List package sizes (e.g. 250ml, 500ml, 1L)"),
  shelfLifeMonths: z.number().min(1, "Shelf life is required"),
  storageConditions: z.string().min(2, "Storage conditions required (e.g. 2-6°C refrigerated)"),
  rsbStandardNumber: z.string().optional(),
});

type ProductRegFormValues = z.infer<typeof productRegSchema>;

interface RegisterProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const REQUIRED_DOSSIER_DOCS = [
  { type: "CERTIFICATE_OF_ANALYSIS", label: "Certificate of Analysis (CoA / Lab Test Results)" },
  { type: "LABEL_ARTWORK_MOCKUP", label: "Product Label / Packaging Artwork Mockup" },
  { type: "MANUFACTURING_PROCESS_FLOWCHART", label: "Product Manufacturing Flowchart" },
  { type: "PRODUCT_SPECIFICATION_SHEET", label: "Product Technical Specification Sheet" },
];

export function RegisterProductDialog({
  open,
  onOpenChange,
  onSuccess,
}: RegisterProductDialogProps) {
  const { data: licenses } = useMyLicenses();
  const applyMutation = useApplyProductRegistration();
  const submitMutation = useSubmitProductRegistration();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [createdRegId, setCreatedRegId] = useState<number | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, File>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});

  const attachMutation = useAttachProductDocument(createdRegId ?? 0);

  const form = useForm<ProductRegFormValues>({
    resolver: zodResolver(productRegSchema),
    defaultValues: {
      productName: "",
      brandName: "",
      intendedUse: "Direct human consumption",
      targetConsumer: "General public",
      ingredientsList: "",
      netContents: "500ml, 1000ml",
      shelfLifeMonths: 12,
      storageConditions: "Store in a cool dry place",
      rsbStandardNumber: "RS EAS 38:2014",
    },
  });

  // Extract unique facilities from premise licenses
  const premiseLicenses = licenses?.filter((l) => l.facilityId) ?? [];

  const handleCreateDraft = async (data: ProductRegFormValues) => {
    try {
      const ingredients = data.ingredientsList.split(",").map((item) => {
        const trimmed = item.trim();
        return { name: trimmed };
      });

      const netContents = data.netContents
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const reg = await applyMutation.mutateAsync({
        productName: data.productName,
        brandName: data.brandName || undefined,
        facilityId: data.facilityId,
        intendedUse: data.intendedUse,
        targetConsumer: data.targetConsumer || undefined,
        ingredients,
        netContents,
        shelfLifeMonths: data.shelfLifeMonths,
        storageConditions: data.storageConditions,
        rsbStandardNumber: data.rsbStandardNumber || undefined,
      });

      setCreatedRegId(reg.id);
      setStep(3);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to create product registration"));
    }
  };

  const handleFileUpload = async (docType: string, file: File) => {
    if (!createdRegId) return;
    setUploadedDocs((prev) => ({ ...prev, [docType]: file }));
    try {
      await attachMutation.mutateAsync({ documentType: docType, file });
      setUploadProgress((prev) => ({ ...prev, [docType]: true }));
      toast.success(`${docType.replace(/_/g, " ")} uploaded`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, `Failed to upload ${docType}`));
    }
  };

  const handleFinalSubmit = async () => {
    if (!createdRegId) return;
    try {
      await submitMutation.mutateAsync(createdRegId);
      toast.success("Product registration submitted to regulator for Market Authorization!");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to submit product registration"));
    }
  };

  const allDocsDone = REQUIRED_DOSSIER_DOCS.every((doc) => uploadProgress[doc.type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPopup className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-lg font-bold">
          <Package className="size-5 text-primary" />
          Regulated Product Registration / Kwandikisha Igicuruzwa
        </DialogTitle>
        <DialogDescription>
          Apply for Market Authorization & RSB/RICA Product Registration Certificate.
        </DialogDescription>

        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b pb-3 pt-2 text-xs">
          <span
            className={cn(
              "flex items-center gap-1 font-medium",
              step === 1 ? "text-primary font-bold" : "text-muted-foreground",
            )}
          >
            <Package className="size-3.5" /> 1. Product Identity
          </span>
          <span
            className={cn(
              "flex items-center gap-1 font-medium",
              step === 2 ? "text-primary font-bold" : "text-muted-foreground",
            )}
          >
            <FlaskConical className="size-3.5" /> 2. Formulation & Standards
          </span>
          <span
            className={cn(
              "flex items-center gap-1 font-medium",
              step === 3 ? "text-primary font-bold" : "text-muted-foreground",
            )}
          >
            <FileCheck className="size-3.5" /> 3. Lab Test & Artwork Dossier
          </span>
        </div>

        <form onSubmit={form.handleSubmit(handleCreateDraft)} className="space-y-4 pt-2">
          {/* STEP 1: PRODUCT IDENTITY */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Product Name (Izina ry'igicuruzwa) <span className="font-bold text-red-500">*</span>
                  </Label>
                  <Input
                    {...form.register("productName")}
                    placeholder="e.g. Pasteurized Whole Milk 500ml"
                    className="h-9 text-xs"
                  />
                  {form.formState.errors.productName && (
                    <p className="text-xs text-destructive">{form.formState.errors.productName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Brand Name (Izina ry'ikirango)</Label>
                  <Input {...form.register("brandName")} placeholder="e.g. Inyange / Mukamira" className="h-9 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Manufacturing Premise / Site (Aho gikorerwa) <span className="font-bold text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(val: string | null) => {
                    if (val) form.setValue("facilityId", parseInt(val, 10));
                  }}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Select licensed premise..." />
                  </SelectTrigger>
                  <SelectContent>
                    {premiseLicenses.map((lic) => (
                      <SelectItem key={lic.id} value={String(lic.facilityId)}>
                        {lic.facilityName} ({lic.licenseNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Intended Use <span className="font-bold text-red-500">*</span>
                  </Label>
                  <Input {...form.register("intendedUse")} placeholder="e.g. Direct human consumption" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Target Consumer</Label>
                  <Input {...form.register("targetConsumer")} placeholder="e.g. General population" className="h-9 text-xs" />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="button"
                  size="sm"
                  onClick={async () => {
                    const ok = await form.trigger(["productName", "intendedUse"]);
                    if (ok) setStep(2);
                  }}
                >
                  Next: Formulation & Standards <ArrowRight className="ml-1.5 size-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: FORMULATION & STANDARDS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Ingredients & Composition (Ibiyigize) <span className="font-bold text-red-500">*</span>
                </Label>
                <Textarea
                  {...form.register("ingredientsList")}
                  placeholder="e.g. Fresh Cow Milk (98%), Lactic Acid Bacteria Culture (2%)"
                  rows={2}
                  className="text-xs"
                />
                {form.formState.errors.ingredientsList && (
                  <p className="text-xs text-destructive">{form.formState.errors.ingredientsList.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Package Sizes / Net Content <span className="font-bold text-red-500">*</span>
                  </Label>
                  <Input {...form.register("netContents")} placeholder="e.g. 250ml, 500ml, 1L" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Shelf Life (Months) <span className="font-bold text-red-500">*</span>
                  </Label>
                  <Input type="number" {...form.register("shelfLifeMonths", { valueAsNumber: true })} className="h-9 text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">
                    Storage Conditions <span className="font-bold text-red-500">*</span>
                  </Label>
                  <Input {...form.register("storageConditions")} placeholder="e.g. Keep refrigerated at 2-6°C" className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">RSB / EAC Standard (optional)</Label>
                  <Input {...form.register("rsbStandardNumber")} placeholder="e.g. RS EAS 38:2014" className="h-9 text-xs" />
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-1.5 size-4" /> Back
                </Button>
                <Button type="submit" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? (
                    <>
                      <LoaderCircle className="mr-1.5 size-4 animate-spin" /> Creating Draft...
                    </>
                  ) : (
                    <>
                      Create Product Application <ArrowRight className="ml-1.5 size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: DOSSIER ATTACHMENTS */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
                <strong>Product Application Created!</strong> Please upload the laboratory Certificate of
                Analysis (CoA), sample label artwork with barcode, and process documentation.
              </div>

              <div className="space-y-2.5">
                {REQUIRED_DOSSIER_DOCS.map((doc) => {
                  const isDone = uploadProgress[doc.type];
                  return (
                    <div
                      key={doc.type}
                      className="flex items-center justify-between rounded-lg border p-2.5 text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-medium text-foreground truncate">{doc.label}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {isDone ? "✓ Uploaded" : "PDF or certified scan"}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {isDone ? (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle2 className="size-4" /> Attached
                          </span>
                        ) : (
                          <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80">
                            <Upload className="size-3" /> Upload
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(doc.type, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={!allDocsDone || submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <>
                      <LoaderCircle className="mr-1.5 size-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit for Market Authorization
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogPopup>
    </Dialog>
  );
}
