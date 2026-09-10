"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Download,
  LoaderCircle,
  QrCode,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogPopup,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCategoryShareLink,
  useRotateCategoryShareLink,
} from "@/hooks/products";
import { productService } from "@/services/product.service";
import { getApiErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import { useCapabilities } from "@/hooks/permissions";

interface CategoryShareDialogProps {
  category: { id: number; code: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When create already returned a share payload, seed from it. */
  initialShareUrl?: string;
}

export function CategoryShareDialog({
  category,
  open,
  onOpenChange,
  initialShareUrl,
}: CategoryShareDialogProps) {
  const permissions = useCapabilities();
  const mayRotate = permissions.can("MANAGE_CATALOG");
  const categoryId = open && category ? category.id : null;
  const { data: share, isLoading, isError, error, refetch } =
    useCategoryShareLink(categoryId);
  const rotate = useRotateCategoryShareLink();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  const url = share?.url ?? initialShareUrl ?? "";

  // Transient UI state (copied flash, rotate confirmation, downloaded preview)
  // is cleared as the dialog closes, so no effect needs to watch `open` to
  // reset it.
  const close = (next: boolean) => {
    if (!next) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setConfirmRotate(false);
      setCopied(false);
    }
    onOpenChange(next);
  };

  useEffect(() => {
    if (!open || !categoryId) return;

    let cancelled = false;
    let objectUrl: string | null = null;

    productService
      .downloadCategoryShareQr(categoryId, "png")
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return objectUrl;
        });
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, "Could not load QR preview"));
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, categoryId, share?.token]);

  const copyLink = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Share link copied");
    window.setTimeout(() => setCopied(false), 2000);
  };

  const downloadQr = async () => {
    if (!category) return;
    try {
      const blob = await productService.downloadCategoryShareQr(category.id);
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href;
      a.download = `${category.code}-share.png`;
      a.click();
      URL.revokeObjectURL(href);
      toast.success("QR downloaded");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not download QR"));
    }
  };

  const doRotate = () => {
    if (!category) return;
    rotate.mutate(category.id, {
      onSuccess: () => {
        setConfirmRotate(false);
        void refetch();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogPopup className="max-w-md">
        <DialogTitle>Share category QR</DialogTitle>
        <DialogDescription>
          {category
            ? `Anyone with this link sees ${category.name} products from your organization only. Regenerating invalidates printed codes.`
            : "Org-scoped catalogue link."}
        </DialogDescription>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <p className="text-sm text-destructive">
              {getApiErrorMessage(error, "Could not load share link")}
            </p>
          ) : (
            <>
              <div className="flex justify-center rounded-xl border border-border bg-muted/30 p-4">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt={`QR for ${category?.name ?? "category"}`}
                    className="size-48 rounded-lg bg-white p-2"
                  />
                ) : (
                  <div className="flex size-48 items-center justify-center text-muted-foreground">
                    <QrCode className="size-10" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase text-muted-foreground">
                  Public link
                </label>
                <div className="flex gap-2">
                  <Input readOnly value={url} className="font-mono text-xs" />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyLink}
                    disabled={!url}
                  >
                    {copied ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadQr}
                  disabled={!category}
                >
                  <Download className="mr-1.5 size-3.5" />
                  Download PNG
                </Button>
                {mayRotate ? (
                  confirmRotate ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-danger text-white hover:bg-danger/90"
                        disabled={rotate.isPending}
                        onClick={doRotate}
                      >
                        {rotate.isPending ? (
                          <LoaderCircle className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="mr-1.5 size-3.5" />
                        )}
                        Confirm regenerate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmRotate(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmRotate(true)}
                    >
                      <RefreshCw className="mr-1.5 size-3.5" />
                      Regenerate token
                    </Button>
                  )
                ) : null}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => close(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
