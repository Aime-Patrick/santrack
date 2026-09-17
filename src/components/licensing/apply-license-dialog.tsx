"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  useApplyLicense,
  useLicenseCategories,
  useMyLicenses,
  useAttachDocument,
  useSubmitLicense,
} from "@/hooks/licensing";
import { useMe } from "@/hooks/auth";
import { getApiErrorMessage, type License } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  LoaderCircle,
  Building2,
  FileText,
  Clock,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  Check,
  AlertCircle,
  Hourglass,
  Layers,
} from "lucide-react";

const applySchema = z.object({
  categoryId: z.number().min(1, "Please select an available license category"),
  notes: z.string().optional(),
});

type ApplyForm = z.infer<typeof applySchema>;

interface ApplyLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToPremise?: () => void;
}

export function ApplyLicenseDialog({
  open,
  onOpenChange,
  onSwitchToPremise,
}: ApplyLicenseDialogProps) {
  const { data: me } = useMe();
  const { data: categories, isLoading: categoriesLoading } =
    useLicenseCategories();
  const { data: myLicenses, isLoading: licensesLoading } = useMyLicenses();
  const applyMutation = useApplyLicense();
  const submitMutation = useSubmitLicense();

  const [step, setStep] = useState<"select" | "documents">("select");
  const [newLicenseId, setNewLicenseId] = useState<number | null>(null);
  const [uploadResults, setUploadResults] = useState<
    { type: string; done: boolean }[]
  >([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const attachMutation = useAttachDocument(newLicenseId ?? 0);

  const userOrg = me?.organization;
  const userOrgType = userOrg?.type;

  // Map existing active / pending organization-level licenses by categoryId
  const existingLicenseByCategoryId = useMemo(() => {
    const map = new Map<number, License>();
    if (!myLicenses) return map;

    myLicenses.forEach((lic) => {
      // Organization operating licenses have no facilityId
      if (
        !lic.facilityId &&
        !lic.provisional &&
        ["ACTIVE", "SUBMITTED", "UNDER_REVIEW", "DRAFT"].includes(lic.status)
      ) {
        map.set(lic.categoryId, lic);
      }
    });
    return map;
  }, [myLicenses]);

  // Filter out premise registrations and regulator internal categories
  const operationalCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter((cat) => {
      const isPremise =
        cat.code.includes("PREMISE") ||
        cat.code.includes("MCC") ||
        cat.name.toLowerCase().includes("premise") ||
        cat.name.toLowerCase().includes("collection center");
      const isRegulator =
        cat.code === "REG" || cat.activity === "REGULATION";
      return !isPremise && !isRegulator;
    });
  }, [categories]);

  // Categories categorized with existing status
  const categoriesWithStatus = useMemo(() => {
    return operationalCategories.map((cat) => {
      const existing = existingLicenseByCategoryId.get(cat.id);
      const isApplicable =
        userOrgType ? cat.appliesTo?.includes(userOrgType) : true;

      return {
        ...cat,
        existingLicense: existing,
        isHeld: !!existing,
        isApplicable,
      };
    });
  }, [operationalCategories, existingLicenseByCategoryId, userOrgType]);

  // Available categories to apply for (excluding already held ones)
  const availableCategories = useMemo(() => {
    return categoriesWithStatus.filter((c) => !c.isHeld);
  }, [categoriesWithStatus]);

  // Already held licenses
  const heldCategories = useMemo(() => {
    return categoriesWithStatus.filter((c) => c.isHeld);
  }, [categoriesWithStatus]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { categoryId: 0, notes: "" },
  });

  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

  // Auto-select the first genuinely available category when dialog opens
  useEffect(() => {
    if (open && availableCategories.length > 0) {
      const currentSelected = watch("categoryId");
      const isCurrentStillAvailable = availableCategories.some(
        (c) => c.id === currentSelected,
      );
      if (!currentSelected || !isCurrentStillAvailable) {
        setValue("categoryId", availableCategories[0].id);
      }
    } else if (open && availableCategories.length === 0) {
      setValue("categoryId", 0);
    }
  }, [open, availableCategories, setValue, watch]);

  const resetForm = () => {
    reset();
    setStep("select");
    setNewLicenseId(null);
    setUploadResults([]);
    setSubmitError(null);
  };

  const handleClose = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const onSubmit = async (data: ApplyForm) => {
    setSubmitError(null);
    try {
      const license = await applyMutation.mutateAsync({
        categoryId: data.categoryId,
        notes: data.notes,
      });
      setNewLicenseId(license.id);

      if (selectedCategory?.requiredDocuments?.length) {
        setUploadResults(
          selectedCategory.requiredDocuments.map((doc) => ({
            type: doc,
            done: false,
          })),
        );
        setStep("documents");
      } else {
        await submitMutation.mutateAsync(license.id);
        handleClose(false);
      }
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  const handleUpload = async (documentType: string, file: File) => {
    if (!newLicenseId) return;
    try {
      await attachMutation.mutateAsync({ documentType, file });
      setUploadResults((prev) =>
        prev.map((r) =>
          r.type === documentType ? { ...r, done: true } : r,
        ),
      );
    } catch {
      // Handled by mutation state
    }
  };

  const handleSubmitForReview = async () => {
    if (!newLicenseId) return;
    setSubmitError(null);
    try {
      await submitMutation.mutateAsync(newLicenseId);
      handleClose(false);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  const allDocumentsUploaded =
    uploadResults.length > 0 && uploadResults.every((r) => r.done);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogPopup className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden p-0 sm:max-w-lg">
        {/* Header */}
        <div className="shrink-0 border-b border-border bg-card p-5 pb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              {userOrg && (
                <div className="mb-1.5 inline-flex items-center gap-1.5 rounded border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-foreground">
                  <Building2 className="size-3 text-muted-foreground" />
                  <span>{userOrg.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-semibold text-primary">
                    {userOrg.type}
                  </span>
                </div>
              )}
              <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                {step === "select"
                  ? "Commercial Operating Permits"
                  : "Upload Compliance Documents"}
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                {step === "select"
                  ? "Apply for authorized trade and operating licenses for your business."
                  : `Attach mandatory compliance documents for ${selectedCategory?.name}.`}
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === "select" ? (
            <form id="apply-license-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Existing / Active Licenses Summary (if any) */}
              {heldCategories.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Active & In-Progress Licenses ({heldCategories.length})
                  </Label>
                  <div className="space-y-2">
                    {heldCategories.map((cat) => {
                      const lic = cat.existingLicense;
                      const isActive = lic?.status === "ACTIVE";
                      const isReview =
                        lic?.status === "SUBMITTED" ||
                        lic?.status === "UNDER_REVIEW";

                      return (
                        <div
                          key={cat.id}
                          className="flex items-center justify-between rounded-lg border border-border/80 bg-muted/30 p-3 text-left"
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {cat.name}
                              </p>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[13px] font-medium",
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                                )}
                              >
                                {isActive ? (
                                  <>
                                    <Check className="size-3" />
                                    Active ({lic?.licenseNumber})
                                  </>
                                ) : isReview ? (
                                  <>
                                    <Hourglass className="size-3" />
                                    Under Review ({lic?.licenseNumber})
                                  </>
                                ) : (
                                  <>Draft ({lic?.licenseNumber})</>
                                )}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {cat.activity} • {cat.validityMonths} months validity
                              {lic?.expiresOn && ` • Expires ${lic.expiresOn}`}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isActive ? "Already Issued" : "Pending Approval"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Licenses to Apply */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Available Licenses to Apply
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {availableCategories.length} available
                  </span>
                </div>

                {categoriesLoading || licensesLoading ? (
                  <div className="space-y-2">
                    <div className="h-16 animate-pulse rounded-lg bg-muted" />
                    <div className="h-16 animate-pulse rounded-lg bg-muted/60" />
                  </div>
                ) : availableCategories.length === 0 ? (
                  <div className="rounded-lg border border-border bg-muted/20 p-4 text-center">
                    <ShieldCheck className="mx-auto size-8 text-emerald-500" />
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      All Operating Licenses Active
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Your business holds all standard operating permits.
                      If you need to register a new physical factory or collection depot,
                      use Premise Registration below.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {availableCategories.map((category) => {
                      const isSelected = selectedCategoryId === category.id;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setValue("categoryId", category.id)}
                          className={cn(
                            "flex w-full items-start justify-between rounded-lg border p-3.5 text-left transition-colors",
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-card hover:bg-muted/40",
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {category.name}
                              </p>
                              {category.isApplicable && (
                                <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                  Matches Trade
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="size-3" />
                                {category.validityMonths} months
                              </span>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1">
                                <FileText className="size-3" />
                                {category.requiredDocuments.length > 0
                                  ? `${category.requiredDocuments.length} doc(s) required`
                                  : "Instant Approval"}
                              </span>
                            </div>

                            {category.requiredDocuments.length > 0 && isSelected && (
                              <div className="mt-2 border-t border-border pt-1.5 text-[13px] text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  Required Docs:
                                </span>{" "}
                                {category.requiredDocuments
                                  .map((d) => d.replace(/_/g, " ").toLowerCase())
                                  .join(", ")}
                              </div>
                            )}
                          </div>

                          <div
                            className={cn(
                              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-muted-foreground/40 bg-transparent",
                            )}
                          >
                            {isSelected && (
                              <div className="size-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {errors.categoryId && (
                  <p className="text-xs font-medium text-destructive">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              {/* Premise Switch Notice */}
              {onSwitchToPremise && (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground">
                      Physical Factory or Plant Registration?
                    </p>
                    <p className="text-muted-foreground">
                      Use Premise Registration for sites, MCCs, and land UPI permits.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onSwitchToPremise}
                    className="h-7 text-xs font-medium shrink-0"
                  >
                    Premises
                    <ArrowRight className="ml-1 size-3" />
                  </Button>
                </div>
              )}

              {/* Notes */}
              {availableCategories.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-xs font-medium">
                    Application Notes (optional)
                  </Label>
                  <Input
                    id="notes"
                    {...register("notes")}
                    placeholder="Any reference details for regulatory reviewers..."
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {/* Server Error Message */}
              {(applyMutation.isError || submitError) && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="size-4 shrink-0 mt-0.5" />
                    <span>
                      {submitError || getApiErrorMessage(applyMutation.error)}
                    </span>
                  </div>
                </div>
              )}
            </form>
          ) : (
            /* Document upload step */
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-foreground">
                <p className="font-semibold">{selectedCategory?.name}</p>
                <p className="mt-0.5 text-muted-foreground">
                  Upload certified documents in PDF, PNG, or JPEG format (max
                  10MB per file).
                </p>
              </div>

              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">
                  {uploadResults.map((result) => (
                    <motion.div
                      key={result.type}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex items-center justify-between rounded-lg border p-3 transition-colors",
                        result.done
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-border bg-card",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={false}
                          animate={{ scale: result.done ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {result.done ? (
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground/40" />
                          )}
                        </motion.div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {result.type.replace(/_/g, " ")}
                          </p>
                          <p
                            className={cn(
                              "text-xs",
                              result.done
                                ? "font-medium text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {result.done ? "Uploaded & Attached" : "Required"}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <label
                          className={cn(
                            "cursor-pointer inline-flex items-center justify-center rounded-md text-xs font-semibold h-8 px-3 transition-colors",
                            result.done
                              ? "bg-muted text-foreground hover:bg-muted/80"
                              : "bg-primary text-primary-foreground hover:bg-primary/90",
                          )}
                        >
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(result.type, file);
                            }}
                          />
                          {result.done ? "Change File" : "Upload File"}
                        </label>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {submitError && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                  {submitError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixed at Bottom */}
        <div className="shrink-0 border-t border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Close
            </DialogClose>

            {step === "select" ? (
              availableCategories.length > 0 && (
                <Button
                  type="submit"
                  form="apply-license-form"
                  size="sm"
                  disabled={applyMutation.isPending || !selectedCategoryId}
                  className="gap-1.5"
                >
                  {applyMutation.isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : selectedCategory?.requiredDocuments?.length ? (
                    <UploadCloud className="size-4" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                  {selectedCategory?.requiredDocuments?.length
                    ? "Proceed to Documents"
                    : "Submit Application"}
                </Button>
              )
            ) : (
              <Button
                size="sm"
                onClick={handleSubmitForReview}
                disabled={!allDocumentsUploaded || submitMutation.isPending}
                className="gap-1.5"
              >
                {submitMutation.isPending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
                Submit for Review
              </Button>
            )}
          </div>
        </div>
      </DialogPopup>
    </Dialog>
  );
}
