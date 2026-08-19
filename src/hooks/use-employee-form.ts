"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { getApiErrorMessage } from "@/lib/api";
import type { UserRole } from "@/lib/api";

// ---------------------------------------------------------------------------
// Schema — maps to CreateUserInput (email, password, fullName, organizationId, role)
// The employee form has extra fields (department, position, etc.) that are
// stored in the backend as part of the user record.
// ---------------------------------------------------------------------------

const employeeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  position: z.string().min(1, "Position is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  hireDate: z.string().optional(),
  salary: z.number().min(0, "Must be 0 or more").optional(),
  status: z.string().min(1, "Status is required"),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

/** Maps department + position to the backend UserRole. */
function deriveRole(department: string, position: string): UserRole {
  const dept = department.toLowerCase();
  const pos = position.toLowerCase();

  if (dept === "production" && pos.includes("manager")) return "PRODUCTION_MANAGER";
  if (dept === "production") return "PRODUCTION_OFFICER";
  if (dept === "warehouse" && pos.includes("manager")) return "WAREHOUSE_MANAGER";
  if (dept === "warehouse") return "WAREHOUSE_OFFICER";
  if (dept === "quality") return "QUALITY_OFFICER";
  if (dept === "logistics") return "LOGISTICS_OFFICER";
  if (dept === "sales") return "SALES_OFFICER";
  if (dept === "hr" || dept === "finance" || pos.includes("manager")) return "MANAGEMENT";
  return "MANAGEMENT";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useEmployeeForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      gender: "",
      dateOfBirth: "",
      nationalId: "",
      phone: "",
      address: "",
      department: "",
      position: "",
      employmentType: "",
      hireDate: "",
      salary: undefined,
      status: "active",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: EmployeeFormValues) =>
      userService.create({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        role: deriveRole(values.department, values.position),
        // organizationId is injected by the backend from the JWT token
        organizationId: 0,
      }),
    onSuccess: () => {
      toast.success("Employee created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/dashboard/employees");
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create employee"));
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    mutation.mutate(values);
  });

  return {
    form,
    onSubmit,
    isSubmitting: mutation.isPending,
    error: mutation.error,
  };
}
