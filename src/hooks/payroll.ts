"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { employeeService, departmentService, attendanceService, leaveService } from "@/services/payroll.service";
import { toast } from "sonner";

// ── Employees ──
export function useEmployees() {
  return useQuery({ queryKey: ["payroll", "employees"], queryFn: employeeService.list });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: employeeService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "employees"] }); toast.success("Employee added"); },
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: leaveService.approve,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payroll", "leaves"] }); toast.success("Leave approved"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
