"use client";

import { useState } from "react";
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
  useAttachDocument,
  useSubmitLicense,
} from "@/hooks/licensing";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, LoaderCircle } from "lucide-react";

const applySchema = z.object({
  categoryId: z.number().min(1, "Select a license category"),
  notes: z.string().optional(),
});

type ApplyForm = z.infer<typeof applySchema>;

interface ApplyLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplyLicenseDialog({
  open,
  onOpenChange,
}: ApplyLicenseDialogProps) {
  const { data: categories, isLoading: categoriesLoading } =
    useLicenseCategories();
  const applyMutation = useApplyLicense();
  const submitMutation = useSubmitLicense();
  const [step, setStep] = useState<"select" | "documents">("select");
  const [newLicenseId, setNewLicenseId] = useState<number | null>(null);
  const [uploadResults, setUploadResults] = useState<
    { type: string; done: boolean }[]
  >([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const attachMutation = useAttachDocument(newLicenseId ?? 0);

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
    } catch {
      // Error handled by mutation
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
      // Error handled by mutation
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
      <DialogPopup className="max-w-xl">
        <DialogTitle>
          {step === "select" ? "Apply for License" : "Upload Documents"}
        </DialogTitle>
        <DialogDescription>
          {step === "select"
            ? "Choose the license category for your business activity."
            : `Upload the required documents for ${selectedCategory?.name}.`}
        </DialogDescription>

        <div className="mt-4">
          {step === "select" ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Category selection */}
              <div className="space-y-2">
                <Label>License Category *</Label>
                {categoriesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 animate-pulse rounded-lg bg-muted"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {categories?.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setValue("categoryId", category.id)}
                        className={cn(
                          "rounded-lg border p-3 text-left transition-all",
                          "hover:border-primary/50 hover:bg-primary/5",
                          selectedCategoryId === category.id
                            ? "border-primary bg-primary-light ring-1 ring-primary"
                            : "border-border bg-card",
                        )}
                      >
                        <p className="text-sm font-medium text-foreground">
                          {category.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {category.activity} • {category.validityMonths} months
                        </p>
                        {category.requiredDocuments.length > 0 && (
                          <p className="mt-1 text-xs text-faint">
                            Requires {category.requiredDocuments.length} document(s)
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
                {errors.categoryId && (
                  <p className="text-xs text-danger">
                    {errors.categoryId.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Input
                  id="notes"
                  {...register("notes")}
                  placeholder="Any relevant information for the regulator..."
                />
              </div>

              {/* Error */}
              {applyMutation.isError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-danger">
                  {getApiErrorMessage(applyMutation.error)}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button type="submit" disabled={applyMutation.isPending}>
                  {applyMutation.isPending ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Create Application
                </Button>
              </div>
            </form>
          ) : (
            /* Document upload step */
            <div className="space-y-4">
              <div className="space-y-2">
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
                          ? "border-success/30 bg-emerald-50"
                          : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={false}
                          animate={{ scale: result.done ? [1, 1.2, 1] : 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {result.done ? (
                            <CheckCircle2 className="size-4 text-success" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground" />
                          )}
                        </motion.div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {result.type.replace(/_/g, " ")}
                          </p>
                          <AnimatePresence mode="wait">
                            {result.done ? (
                              <motion.p
                                key="uploaded"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs text-success overflow-hidden"
                              >
                                Uploaded
                              </motion.p>
                            ) : (
                              <motion.p
                                key="required"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs text-muted-foreground overflow-hidden"
                              >
                                Required
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <AnimatePresence mode="wait">
                          {result.done ? (
                            <motion.div
                              key="change"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <label className="cursor-pointer inline-flex items-center justify-center rounded-md text-primary text-sm font-medium h-9 px-3 hover:bg-primary/10">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(result.type, file);
                                  }}
                                />
                                Change
                              </label>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="upload"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                            >
                              <label className="cursor-pointer inline-flex items-center justify-center rounded-md bg-secondary text-secondary-foreground text-sm font-medium h-9 px-3">
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUpload(result.type, file);
                                  }}
                                />
                                Choose File
                              </label>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {submitError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-danger">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <DialogClose render={<Button variant="outline" />}>
                  Save as Draft
                </DialogClose>
                <Button
                  onClick={handleSubmitForReview}
                  disabled={!allDocumentsUploaded || submitMutation.isPending}
                >
                  {submitMutation.isPending ? (
                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                  ) : null}
                  Submit for Review
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogPopup>
    </Dialog>
  );
}
