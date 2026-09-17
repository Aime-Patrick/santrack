"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Package,
  Tags,
  ShieldX,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productService } from "@/services/product.service";

function usePublicCategory(token: string) {
  return useQuery({
    queryKey: ["public-category", token],
    queryFn: () => productService.resolvePublicCategory(token),
    enabled: !!token,
    retry: false,
  });
}

export default function PublicCategoryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const { data, isLoading, error } = usePublicCategory(token);

  const unknown = !isLoading && (error || data?.known === false);

  return (
    <div className="min-h-screen bg-slate-100 px-4 pb-20 pt-24">
      <div className="pointer-events-none fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-sky-400/10 via-amber-300/10 to-transparent opacity-60 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900"
          >
            <ArrowLeft className="size-3.5" />
            <span>SANTRACK</span>
          </Link>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-6 rounded-full bg-[#00A3E0]" />
            <div className="h-1.5 w-4 rounded-full bg-[#FAD201]" />
            <div className="h-1.5 w-6 rounded-full bg-[#20603D]" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200/80 bg-white p-8 py-24 shadow-xs">
            <Loader2 className="size-8 animate-spin text-[#00A3E0]" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Loading catalogue…
            </p>
          </div>
        ) : null}

        {unknown ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-rose-200 bg-white p-8 py-12 text-center shadow-sm">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
              <ShieldX className="size-7" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Link not found</h2>
            <p className="mt-2 max-w-sm text-xs text-slate-500">
              This share link is invalid or was regenerated. Ask the issuer for
              a new QR code.
            </p>
            <div className="mt-4 rounded-xl bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-700">
              {token}
            </div>
            <Link href="/" className="mt-6">
              <Button size="sm" className="rounded-xl text-xs font-semibold">
                Back to SANTRACK
              </Button>
            </Link>
          </div>
        ) : null}

        {data?.known && data.category && data.organization ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-light text-primary">
                  <Tags className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900">
                      {data.category.name}
                    </h1>
                    {!data.category.active ? (
                      <Badge variant="outline" className="text-[10px]">
                        Withdrawn
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-slate-500">
                    {data.category.code}
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                    <Building2 className="size-3.5 shrink-0" />
                    {data.organization.name}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900">Products</h2>
                <span className="text-xs text-slate-500">
                  {data.products?.length ?? 0} listed
                </span>
              </div>

              {(data.products?.length ?? 0) === 0 ? (
                <p className="text-sm text-slate-500">
                  No products filed under this category yet for this
                  organization.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {data.products!.map((product) => (
                    <li
                      key={product.sku}
                      className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Package className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">
                          {product.name}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          {product.sku}
                          {product.brand ? ` · ${product.brand}` : ""}
                          {product.gtin ? ` · GTIN ${product.gtin}` : ""}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <p className="text-center text-[13px] text-slate-400">
              Catalogue share via SANTRACK — stock and location are not shown.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
