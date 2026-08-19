"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useParams } from "next/navigation";
import { Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useCreateBatch } from "@/hooks/batches";
import { useProduct } from "@/hooks/products";

const schema = z.object({
  batchCode: z.string().min(1, "Batch code is required"),
  manufacturedOn: z.string().optional(),
  expiresOn: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function NewBatchPage() {
  const router = useRouter();
  const params = useParams();
  const productId = Number(params.id);
  const { data: product } = useProduct(productId);
  const createBatch = useCreateBatch();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      batchCode: "",
      manufacturedOn: "",
      expiresOn: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    createBatch.mutate(
      {
        productId,
        batchCode: values.batchCode,
        manufacturedOn: values.manufacturedOn || undefined,
        expiresOn: values.expiresOn || undefined,
      },
      { onSuccess: () => router.push(`/dashboard/products/${productId}/batches`) }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
          <Layers className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Batch</h1>
          <p className="text-muted-foreground">
            Register a new production batch for <strong>{product?.name || "..."}</strong>
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Details</CardTitle>
          <CardDescription>Batches group individual units produced together</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="batchCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Code *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. BATCH-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manufacturedOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufactured On</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expiresOn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires On</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBatch.isPending}>
                  {createBatch.isPending ? "Creating..." : "Create Batch"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
