"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { AlertCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SymbologyPanelPicker } from "@/components/barcode/symbology-panel-picker";

import { useSymbologies } from "@/hooks/barcodes";
import { useCreateProduct, useProductCategories, useBrands } from "@/hooks/products";
import Link from "next/link";
import type { Symbology } from "@/services/barcode.service";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(1, "Product name is required"),
  sku: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional(),
  model: z.string().optional(),
  specification: z.string().optional(),
  gtin: z.string().optional(),
  barcodeSymbology: z.string().optional(),
  baseUnit: z.string().optional(),
  packUnit: z.string().optional(),
  unitsPerPack: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

/** Pick the usual retail print format from how many digits the GTIN has. */
function symbologyFromGtin(raw: string): Symbology | undefined {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 8) return "EAN_8";
  if (digits.length === 12) return "UPC_A";
  if (digits.length === 13) return "EAN_13";
  if (digits.length === 14) return "ITF_14";
  return undefined;
}

export default function NewProductPage() {
  const router = useRouter();
  const createProduct = useCreateProduct();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      sku: "",
      categoryId: "",
      brandId: "",
      model: "",
      specification: "",
      gtin: "",
      barcodeSymbology: "",
      baseUnit: "",
      packUnit: "",
      unitsPerPack: "",
    },
  });

  const { data: catalogue } = useSymbologies();
  const { data: categories } = useProductCategories();
  const { data: brands } = useBrands();
  // Withdrawn marks stay readable on old products but cannot be chosen for new ones.
  const activeBrands = (brands ?? []).filter((brand) => brand.active);
  const chosenSymbology = useWatch({ control: form.control, name: "barcodeSymbology" });
  const gtin = useWatch({ control: form.control, name: "gtin" });

  const chosenSpec = catalogue?.symbologies.find(
    (s) => s.symbology === chosenSymbology,
  );
  const needsGtin =
    chosenSpec?.use === "RETAIL" || chosenSpec?.use === "PUBLICATION";

  function applyGtin(next: string) {
    form.setValue("gtin", next, { shouldDirty: true, shouldValidate: true });
    const inferred = symbologyFromGtin(next);
    if (inferred) {
      form.setValue("barcodeSymbology", inferred, { shouldDirty: true });
    }
  }

  const onSubmit = (values: FormValues) => {
    const packUnit = values.packUnit?.trim() || undefined;
    const unitsPerPackRaw = values.unitsPerPack?.trim();
    const unitsPerPack =
      unitsPerPackRaw !== undefined && unitsPerPackRaw !== ""
        ? Number(unitsPerPackRaw)
        : undefined;

    createProduct.mutate(
      {
        name: values.name,
        sku: values.sku || undefined,
        categoryId: Number(values.categoryId),
        brandId: values.brandId ? Number(values.brandId) : undefined,
        model: values.model || undefined,
        specification: values.specification || undefined,
        gtin: values.gtin || undefined,
        barcodeSymbology: (values.barcodeSymbology || undefined) as Symbology | undefined,
        baseUnit: values.baseUnit?.trim() || undefined,
        packUnit,
        unitsPerPack,
      },
      {
        onSuccess: (product) => {
          form.reset();
          if (product?.id) {
            router.push(`/dashboard/products/${product.id}`);
          } else {
            router.push("/dashboard/products");
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-light">
          <Package className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Product</h1>
          <p className="text-muted-foreground">
            Register a new product in your catalog. The system will auto-generate a SKU if not provided.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Fill in the product information below</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Imigongo Art Piece" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-generated if empty" {...field} />
                      </FormControl>
                      <FormDescription>
                        Internal stock code for your warehouse — not the retail GTIN.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full h-10">
                            <SelectValue placeholder="Select a category">
                              {field.value
                                ? categories?.find((c) => String(c.id) === String(field.value))?.name
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full h-10">
                            <SelectValue
                              placeholder={
                                activeBrands.length > 0
                                  ? "Select a brand"
                                  : "No brands yet"
                              }
                            >
                              {field.value
                                ? activeBrands.find((b) => String(b.id) === String(field.value))?.name
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {activeBrands.map((brand) => (
                              <SelectItem key={brand.id} value={String(brand.id)}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormDescription>
                        {activeBrands.length > 0 ? (
                          "The mark this is sold under."
                        ) : (
                          <>
                            Add one under{" "}
                            <Link
                              href="/dashboard/products/categories"
                              className="text-primary underline"
                            >
                              Categories &amp; Brands
                            </Link>
                            .
                          </>
                        )}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="baseUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. BOTTLE" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional. What one product unit is called when selling.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="packUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pack unit</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. CARTON" {...field} />
                      </FormControl>
                      <FormDescription>
                        Optional. Send with units per pack, or leave both blank.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="unitsPerPack"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Units per pack</FormLabel>
                      <FormControl>
                        <Input type="number" min={2} step={1} placeholder="e.g. 24" {...field} />
                      </FormControl>
                      <FormDescription>
                        Whole number ≥ 2 when a pack unit is set.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-xl border border-border/80 bg-muted/15 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Manufacturer barcode (GTIN)
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    One number per product — the same EAN / UPC / ISBN on every pack.
                    Unit QR identities for tracing are prepared separately later; do not
                    enter the GTIN again there.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="gtin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GTIN</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. 6291041500215"
                          {...field}
                          onChange={(e) => applyGtin(e.target.value)}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave blank only if this product is never scanned at a till.
                        Entering digits auto-picks EAN-8 / UPC / EAN-13 / ITF-14.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="barcodeSymbology"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How this barcode is printed</FormLabel>
                      <FormDescription className="mb-3">
                        Print format for the GTIN above (or an internal SKU code if you have no GTIN).
                        Not a second barcode number.
                      </FormDescription>
                      <FormControl>
                        <SymbologyPanelPicker
                          value={(field.value || undefined) as Symbology | undefined}
                          onChange={field.onChange}
                          previewValue={gtin?.trim() || undefined}
                          only={
                            gtin?.trim()
                              ? ["RETAIL", "PUBLICATION", "LOGISTICS"]
                              : ["INTERNAL", "LOGISTICS"]
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {needsGtin && !gtin?.trim() && (
                  <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-warning-foreground">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                    <span>
                      {chosenSpec?.label} needs the GTIN in the field above — one value for
                      this product, reused on every pack.
                    </span>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="specification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specification</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the product specifications, materials, dimensions..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProduct.isPending}>
                  {createProduct.isPending ? "Creating..." : "Create Product"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
