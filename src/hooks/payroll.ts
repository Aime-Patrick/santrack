"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeService, departmentService, attendanceService, leaveService, payItemService } from "@/services/payroll.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

// ── Employees ──
export function useEmployees() {
  return useQuery({ queryKey: ["payroll", "employees"], queryFn: employeeService.list });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "employees"] }); toast.success("Employee added"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Departments ──
export function useDepartments() {
  return useQuery({ queryKey: ["payroll", "departments"], queryFn: departmentService.list });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: departmentService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "departments"] }); toast.success("Department created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Attendance ──
export function useAttendance(employeeId?: number, from?: string, to?: string) {
  return useQuery({ queryKey: ["payroll", "attendance", employeeId, from, to], queryFn: () => attendanceService.list(employeeId, from, to) });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: attendanceService.mark,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "attendance"] }); toast.success("Attendance marked"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Leave ──
export function useLeaves(employeeId?: number) {
  return useQuery({ queryKey: ["payroll", "leaves", employeeId], queryFn: () => leaveService.list(employeeId) });
}

export function useRequestLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveService.request,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "leaves"] }); toast.success("Leave requested"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveService.approve,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "leaves"] }); toast.success("Leave approved"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Job Positions ──
import { jobPositionService, payrollRunService, payrollReportService } from "@/services/payroll.service";

export function useJobPositions() {
  return useQuery({ queryKey: ["payroll", "job-positions"], queryFn: jobPositionService.list });
}

export function useCreateJobPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: jobPositionService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "job-positions"] }); toast.success("Job position created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateJobPosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<import("@/services/payroll.service").JobPosition> }) => jobPositionService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "job-positions"] }); toast.success("Job position updated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Payroll Runs ──
export function usePayrollRuns() {
  return useQuery({ queryKey: ["payroll", "runs"], queryFn: payrollRunService.list });
}

export function useCreatePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollRunService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "runs"] }); toast.success("Payroll run created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function usePayPayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payrollRunService.pay,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "runs"] }); toast.success("Payroll marked as paid"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Payroll Reports ──
export function usePayrollSummary(runId?: number, period?: string) {
  return useQuery({ queryKey: ["payroll", "reports", "summary", runId, period], queryFn: () => payrollReportService.summary(runId, period) });
}

export function useLeaveReport() {
  return useQuery({ queryKey: ["payroll", "reports", "leave"], queryFn: payrollReportService.leave });
}

// ── Department update ──
export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<import("@/services/payroll.service").Department> }) => departmentService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "departments"] }); toast.success("Department updated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Leave reject ──
export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { reason: string } }) => leaveService.reject(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "leaves"] }); toast.success("Leave rejected"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Pay Items ──
export function useAddPayItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: number; data: { code: string; name: string; type: string; amount: number } }) =>
      payItemService.add(employeeId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "pay-items"] }); toast.success("Pay item added"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useRemovePayItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, payItemId }: { employeeId: number; payItemId: number }) =>
      payItemService.remove(employeeId, payItemId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "pay-items"] }); toast.success("Pay item removed"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}
