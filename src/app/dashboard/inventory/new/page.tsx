"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventoryForm } from "@/hooks/use-inventory-form";
import { useProductCategories } from "@/hooks/products";

export default function AddInventoryItemPage() {
  const { form, onSubmit, isSubmitting } = useInventoryForm();
  const { data: categories } = useProductCategories();
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const activeCategories = (categories ?? []).filter((c) => c.active);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Add Inventory Item</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Item Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Item Name <span className="text-destructive">*</span>
                    </Label>
                    <Input placeholder="Enter item name" {...register("name")} />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Item Code <span className="text-destructive">*</span>
                    </Label>
                    <Input placeholder="Enter item code" {...register("code")} />
                    {errors.code && (
                      <p className="text-xs text-destructive">{errors.code.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(v) => v && setValue("categoryId", v)}
                      value={watch("categoryId") || undefined}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category">
                          {watch("categoryId")
                            ? activeCategories.find(
                                (c) => String(c.id) === watch("categoryId"),
                              )?.name
                            : undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {activeCategories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && (
                      <p className="text-xs text-destructive">
                        {errors.categoryId.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Unit of Measure <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      onValueChange={(v) => v && setValue("unitOfMeasure", v)}
                      value={watch("unitOfMeasure") || undefined}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pieces (PCS)">Pieces (PCS)</SelectItem>
                        <SelectItem value="Kilograms (KG)">Kilograms (KG)</SelectItem>
                        <SelectItem value="Liters (LTR)">Liters (LTR)</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                        <SelectItem value="Carton">Carton</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.unitOfMeasure && (
                      <p className="text-xs text-destructive">
                        {errors.unitOfMeasure.message}
                      </p>
                    )}
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Enter item description..."
                      {...register("description")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supplier Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Select
                      onValueChange={(v) => v && setValue("supplier", v)}
                      value={watch("supplier") || undefined}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Azam Ltd">Azam Ltd</SelectItem>
                        <SelectItem value="Bralirwa">Bralirwa</SelectItem>
                        <SelectItem value="SOPRIT">SOPRIT</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier Contact</Label>
                    <Input
                      placeholder="Enter supplier contact"
                      {...register("supplierContact")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier Phone</Label>
                    <Input
                      placeholder="Enter supplier phone"
                      {...register("supplierPhone")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Item Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Reorder Level</Label>
                  <Input
                    type="number"
                    placeholder="Enter reorder level"
                    {...register("reorderLevel")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Stock</Label>
                  <Input
                    type="number"
                    placeholder="Enter minimum stock"
                    {...register("minimumStock")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum Stock</Label>
                  <Input
                    type="number"
                    placeholder="Enter maximum stock"
                    {...register("maximumStock")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit Cost (RWF)</Label>
                  <Input
                    type="number"
                    placeholder="Enter unit cost"
                    {...register("unitCost")}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Link href="/dashboard/items">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#067eda] hover:bg-[#0569c0] text-white"
          >
            {isSubmitting ? "Saving..." : "Save Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}
