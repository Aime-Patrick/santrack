"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/products";
import { useBatches } from "@/hooks/batches";
import { useLocations } from "@/hooks/locations";
import { useRegisterPackage } from "@/hooks/items";

const PACKAGE_TYPES = ["BOX", "CARTON", "CASE", "SACK", "CRATE", "PALLET"] as const;

const schema = z.object({
  packageType: z.string().min(1, "Package type is required"),
  productId: z.string().optional(),
  batchId: z.string().optional(),
  locationId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPackagePage() {
  const router = useRouter();
  const { data: productsData } = useProducts(0, 200);
  const { data: batches } = useBatches();
  const { data: locations } = useLocations();
  const registerPackage = useRegisterPackage();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageType: "",
      productId: "",
      batchId: "",
      locationId: "",
    },
  });

  const watchedProductId = form.watch("productId");
  const filteredBatches = batches?.filter((b) => b.productId === Number(watchedProductId)) ?? [];

  const onSubmit = (values: FormValues) => {
    registerPackage.mutate(
      {
        packageType: values.packageType as "BOX" | "CARTON" | "CASE" | "SACK" | "CRATE" | "PALLET",
        productId: values.productId ? Number(values.productId) : undefined,
        batchId: values.batchId ? Number(values.batchId) : undefined,
        locationId: values.locationId ? Number(values.locationId) : undefined,
      },
      { onSuccess: () => router.push("/dashboard/items") }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary-light">
          <PackagePlus className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Register Package</h1>
          <p className="text-muted-foreground">
            Create a new empty container. You can then pack items into it.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Package Details</CardTitle>
          <CardDescription>Select the package type and optional product/batch association</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Type *</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v || undefined)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PACKAGE_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0) + t.slice(1).toLowerCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v || undefined)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productsData?.content.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="batchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v || undefined)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredBatches.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)}>
                              {b.batchCode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v || undefined)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations?.map((l) => (
                            <SelectItem key={l.id} value={String(l.id)}>
                              {l.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={registerPackage.isPending}>
                  {registerPackage.isPending ? "Creating..." : "Create Package"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
