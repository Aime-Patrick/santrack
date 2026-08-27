"use client";

import Link from "next/link";
import { Upload } from "lucide-react";
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
import { useIndustryForm } from "@/hooks/use-industry-form";

export default function AddIndustryPage() {
  const { form, onSubmit, isSubmitting } = useIndustryForm();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Add New Industry</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column — Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>
                      Industry Name <span className="text-destructive">*</span>
                    </Label>
                    <Input placeholder="Enter industry name" {...register("name")} />
                    {errors.name && (
                      <p className="text-xs text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Category <span className="text-destructive">*</span>
                    </Label>
                    <Select onValueChange={(v) => v && setValue("type", v)} value={watch("type") || undefined}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                        <SelectItem value="agro-processing">Agro Processing</SelectItem>
                        <SelectItem value="mining">Mining & Quarrying</SelectItem>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-xs text-destructive">{errors.type.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Registration Number</Label>
                    <Input placeholder="Enter registration number" {...register("registrationNumber")} />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      TIN Number <span className="text-destructive">*</span>
                    </Label>
                    <Input placeholder="Enter TIN number" {...register("tinNumber")} />
                    {errors.tinNumber && (
                      <p className="text-xs text-destructive">{errors.tinNumber.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select onValueChange={(v) => v && setValue("province", v)} value={watch("province") || undefined}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kigali">Kigali City</SelectItem>
                        <SelectItem value="northern">Northern Province</SelectItem>
                        <SelectItem value="southern">Southern Province</SelectItem>
                        <SelectItem value="eastern">Eastern Province</SelectItem>
                        <SelectItem value="western">Western Province</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>District</Label>
                    <Select onValueChange={(v) => v && setValue("district", v)} value={watch("district") || undefined}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select district" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gasabo">Gasabo</SelectItem>
                        <SelectItem value="kicukiro">Kicukiro</SelectItem>
                        <SelectItem value="nyarugenge">Nyarugenge</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sector</Label>
                    <Select onValueChange={(v) => v && setValue("sector", v)} value={watch("sector") || undefined}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select sector" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kacyiru">Kacyiru</SelectItem>
                        <SelectItem value="kimironko">Kimironko</SelectItem>
                        <SelectItem value="gisozi">Gisozi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Established Date</Label>
                    <Input type="date" {...register("establishedDate")} />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Enter industry description..." {...register("description")} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column — Logo + Contact */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Industry Logo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center">
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Upload className="size-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Upload Logo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="Enter phone number" {...register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" placeholder="Enter email address" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input placeholder="Enter website (optional)" {...register("website")} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Link href="/dashboard/industries">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="bg-[#067eda] hover:bg-[#0569c0] text-white">
            {isSubmitting ? "Saving..." : "Save Industry"}
          </Button>
        </div>
      </form>
    </div>
  );
}
