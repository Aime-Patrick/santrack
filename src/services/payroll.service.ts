import { api } from "@/lib/api";

export interface Employee {
  id: number;
  employeeNumber: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentId: number;
  departmentName: string;
  jobPositionId: number;
  jobPositionTitle: string;
  employmentType: string;
  hireDate: string;
  status: string;
  createdAt: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  managerName: string | null;
  employeeCount: number;
  createdAt: string;
}

export interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  status: string;
  clockIn: string | null;
  clockOut: string | null;
  notes: string | null;
}

export interface Leave {
  id: number;
  employeeId: number;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason: string;
  approvedBy: string | null;
  createdAt: string;
}

export const employeeService = {
  list: () => api.get<Employee[]>("/api/payroll/employees").then((r) => r.data),
  get: (id: number) => api.get<Employee>(`/api/payroll/employees/${id}`).then((r) => r.data),
  create: (data: Partial<Employee>) => api.post<Employee>("/api/payroll/employees", data).then((r) => r.data),
  update: (id: number, data: Partial<Employee>) => api.patch<Employee>(`/api/payroll/employees/${id}`, data).then((r) => r.data),
};

export const departmentService = {
  list: () => api.get<Department[]>("/api/payroll/departments").then((r) => r.data),
  get: (id: number) => api.get<Department>(`/api/payroll/departments/${id}`).then((r) => r.data),
  create: (data: { name: string; code: string }) => api.post<Department>("/api/payroll/departments", data).then((r) => r.data),
};

export const attendanceService = {
  list: (employeeId?: number, from?: string, to?: string) =>
    api.get<Attendance[]>("/api/payroll/attendance", { params: { employeeId, from, to } }).then((r) => r.data),
  mark: (data: { employeeId: number; date: string; status: string; clockIn?: string; clockOut?: string; notes?: string }) =>
    api.post<Attendance>("/api/payroll/attendance", data).then((r) => r.data),
};

export const leaveService = {
  list: (employeeId?: number) =>
    api.get<Leave[]>("/api/payroll/leaves", { params: { employeeId } }).then((r) => r.data),
  request: (data: { employeeId: number; type: string; startDate: string; endDate: string; reason: string }) =>
    api.post<Leave>("/api/payroll/leaves", data).then((r) => r.data),
  approve: (id: number) => api.post<Leave>(`/api/payroll/leaves/${id}/approve`).then((r) => r.data),
  reject: (id: number, data: { reason: string }) => api.post<Leave>(`/api/payroll/leaves/${id}/reject`, data).then((r) => r.data),
};
