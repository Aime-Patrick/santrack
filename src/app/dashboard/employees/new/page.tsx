"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEmployeeForm } from "@/hooks/use-employee-form";

export default function AddEmployeePage() {
  const { form, onSubmit, isSubmitting } = useEmployeeForm();
  const { register, handleSubmit, setValue, watch, formState: { errors } } = form;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Add New Employee</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column — Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input placeholder="Enter full name" {...register("fullName")} />
                  {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select onValueChange={(v) => v && setValue("gender", v)} value={watch("gender") || undefined}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...register("dateOfBirth")} />
                </div>
                <div className="space-y-2">
                  <Label>National ID</Label>
                  <Input placeholder="Enter national ID" {...register("nationalId")} />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="Enter phone number" {...register("phone")} />
                </div>
                <div className="space-y-2">
                  <Label>
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input type="email" placeholder="Enter email address" {...register("email")} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input type="password" placeholder="Enter password" {...register("password")} />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input placeholder="Enter address" {...register("address")} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right column — Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Department <span className="text-destructive">*</span>
                  </Label>
                  <Select onValueChange={(v) => v && setValue("department", v)} value={watch("department") || undefined}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="quality">Quality Control</SelectItem>
                      <SelectItem value="warehouse">Warehouse</SelectItem>
                      <SelectItem value="logistics">Logistics</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.department && (
                    <p className="text-xs text-destructive">{errors.department.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Position <span className="text-destructive">*</span>
                  </Label>
                  <Select onValueChange={(v) => v && setValue("position", v)} value={watch("position") || undefined}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="officer">Officer</SelectItem>
                      <SelectItem value="supervisor">Supervisor</SelectItem>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="operator">Operator</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.position && (
                    <p className="text-xs text-destructive">{errors.position.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>
                    Employment Type <span className="text-destructive">*</span>
                  </Label>
                  <Select onValueChange={(v) => v && setValue("employmentType", v)} value={watch("employmentType") || undefined}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full Time</SelectItem>
                      <SelectItem value="part-time">Part Time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.employmentType && (
                    <p className="text-xs text-destructive">{errors.employmentType.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Hire Date</Label>
                  <Input type="date" {...register("hireDate")} />
                </div>
                <div className="space-y-2">
                  <Label>Salary (RWF)</Label>
                  <Input type="number" placeholder="Enter salary" {...register("salary")} />
                </div>
                <div className="space-y-2">
                  <Label>
                    Status <span className="text-destructive">*</span>
                  </Label>
                  <Select onValueChange={(v) => v && setValue("status", v)} value={watch("status") || undefined}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-leave">On Leave</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && (
                    <p className="text-xs text-destructive">{errors.status.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6">
          <Link href="/dashboard/employees">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
          <Button type="submit" disabled={isSubmitting} className="bg-[#067eda] hover:bg-[#0569c0] text-white">
            {isSubmitting ? "Saving..." : "Save Employee"}
          </Button>
        </div>
      </form>
    </div>
  );
}
