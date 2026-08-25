"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const applySchema = z.object({
  categoryId: z.number().min(1, "Select a license category"),
  notes: z.string().optional(),
});

type ApplyForm = z.infer<typeof applySchema>;

interface ApplyLicenseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ApplyLicenseForm({
  onSuccess,
  onCancel,
}: ApplyLicenseFormProps) {
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
    formState: { errors },
  } = useForm<ApplyForm>({
    resolver: zodResolver(applySchema),
    defaultValues: { categoryId: 0, notes: "" },
  });

  const selectedCategoryId = watch("categoryId");
  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);

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
        onSuccess?.();
      }
    } catch {
      // Error handled by mutation
    }
  };

  const handleUpload = async (
    documentType: string,
    file: File,
  ) => {
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
      onSuccess?.();
    } catch (error) {
      setSubmitError(getApiErrorMessage(error));
    }
  };

  const allDocumentsUploaded =
    uploadResults.length > 0 && uploadResults.every((r) => r.done);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Apply for License</CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "select"
            ? "Choose the license category for your business activity."
            : `Upload the required documents for ${selectedCategory?.name}.`}
        </p>
      </CardHeader>
      <CardContent>
        {step === "select" ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Category selection */}
            <div className="space-y-3">
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
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
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

            {/* Actions */}
            <div className="flex gap-3">
              <Button type="submit" disabled={applyMutation.isPending}>
                {applyMutation.isPending ? "Creating..." : "Create Application"}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>

            {applyMutation.isError && (
              <div className="rounded-md bg-danger/5 p-3 text-sm text-danger">
                {getApiErrorMessage(applyMutation.error)}
              </div>
            )}
          </form>
        ) : (
          /* Document upload step */
          <div className="space-y-4">
            <div className="space-y-2">
              {uploadResults.map((result) => (
                <div
                  key={result.type}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {result.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.done ? "Uploaded" : "Required"}
                    </p>
                  </div>
                  {result.done ? (
                    <span className="text-sm font-medium text-success">✓</span>
                  ) : (
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
                  )}
                </div>
              ))}
            </div>

            {submitError && (
              <div className="rounded-md bg-danger/5 p-3 text-sm text-danger">
                {submitError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleSubmitForReview}
                disabled={!allDocumentsUploaded || submitMutation.isPending}
              >
                {submitMutation.isPending
                  ? "Submitting..."
                  : "Submit for Review"}
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Save as Draft
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
