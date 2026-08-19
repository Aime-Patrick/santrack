"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Hash, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/products";
import { useBatches } from "@/hooks/batches";
import { useLocations } from "@/hooks/locations";
import { useRegisterUnits } from "@/hooks/items";

const schema = z.object({
  productId: z.string().min(1, "Product is required"),
  batchId: z.string().optional(),
  locationId: z.string().optional(),
  count: z.string().min(1, "Count is required").refine((v) => Number(v) > 0 && Number(v) <= 1000, "Count must be 1-1000"),
  serialNumbers: z.array(z.string()).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterUnitsPage() {
  const router = useRouter();
  const [serialMode, setSerialMode] = useState(false);
  const [manualSerials, setManualSerials] = useState<string[]>([""]);

  const { data: productsData } = useProducts(0, 200);
  const { data: batches } = useBatches();
  const { data: locations } = useLocations();
  const registerUnits = useRegisterUnits();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: "",
      batchId: "",
      locationId: "",
      count: "1",
      serialNumbers: [],
    },
  });

  const watchedProductId = form.watch("productId");
  const watchedCount = form.watch("count");
  const filteredBatches = batches?.filter((b) => b.productId === Number(watchedProductId)) ?? [];

  const addSerial = () => setManualSerials((prev) => [...prev, ""]);
  const removeSerial = (idx: number) => setManualSerials((prev) => prev.filter((_, i) => i !== idx));
  const updateSerial = (idx: number, value: string) => {
    setManualSerials((prev) => prev.map((s, i) => (i === idx ? value : s)));
  };

  const onSubmit = (values: FormValues) => {
    const serialNumbers = serialMode
      ? manualSerials.filter((s) => s.trim())
      : undefined;

    registerUnits.mutate(
      {
        productId: Number(values.productId),
        batchId: values.batchId ? Number(values.batchId) : undefined,
        locationId: values.locationId ? Number(values.locationId) : undefined,
        count: Number(values.count),
        serialNumbers: serialNumbers && serialNumbers.length > 0 ? serialNumbers : undefined,
      },
      { onSuccess: () => router.push("/dashboard/items") }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Hash className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Register Units</h1>
          <p className="text-muted-foreground">
            Create individual traceable unit identities for a product. Each unit gets a unique QR code.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unit Registration</CardTitle>
          <CardDescription>
            Select the product and batch, then specify how many units to register (max 1000 per request).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product *</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v || undefined)} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {productsData?.content.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name} ({p.sku})
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

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Count *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={1000} placeholder="Number of units" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end gap-3">
                  <Button
                    type="button"
                    variant={serialMode ? "default" : "outline"}
                    onClick={() => setSerialMode(!serialMode)}
                  >
                    {serialMode ? "Auto-generate Serials" : "Enter Serial Numbers"}
                  </Button>
                </div>
              </div>

              {serialMode && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Manual Serial Numbers</p>
                    <Button type="button" variant="outline" size="sm" onClick={addSerial}>
                      <Plus className="mr-1 size-3" />
                      Add
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {manualSerials.map((serial, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <Input
                          placeholder={`Serial #${idx + 1}`}
                          value={serial}
                          onChange={(e) => updateSerial(idx, e.target.value)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSerial(idx)}
                          disabled={manualSerials.length <= 1}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {manualSerials.filter((s) => s.trim()).length} serial(s) entered.
                    {watchedCount && ` Count is set to ${watchedCount}.`}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={registerUnits.isPending}>
                  {registerUnits.isPending
                    ? "Registering..."
                    : `Register ${watchedCount || 0} Unit(s)`}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
