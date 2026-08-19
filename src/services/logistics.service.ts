import { api } from "@/lib/api";

export interface Vehicle {
  id: number;
  plateNumber: string;
  type: string;
  capacity: number | null;
  status: string;
  active: boolean;
  createdAt: string;
}

export interface Transporter {
  id: number;
  organizationId: number;
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface Driver {
  id: number;
  transporterId: number;
  transporterName: string;
  name: string;
  licenseNumber: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export interface Route {
  id: number;
  organizationId: number;
  name: string;
  sourceLocationId: number;
  sourceLocationName: string;
  destinationLocationId: number;
  destinationLocationName: string;
  distanceKm: number | null;
  expectedHours: number | null;
  active: boolean;
  createdAt: string;
}

export interface Shipment {
  id: number;
  shipmentNumber: string;
  status: string;
  vehicleId: number | null;
  vehiclePlate: string | null;
  transporterName: string | null;
  origin: string;
  destination: string;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export const vehicleService = {
  list: () => api.get<{ total: number; content: Vehicle[] }>("/api/logistics/vehicles").then((r) => r.data),
  get: (id: number) => api.get<Vehicle>(`/api/logistics/vehicles/${id}`).then((r) => r.data),
  create: (data: { plateNumber: string; type: string; capacity?: number }) =>
    api.post<Vehicle>("/api/logistics/vehicles", data).then((r) => r.data),
};

export const transporterService = {
  list: () => api.get<{ total: number; content: Transporter[] }>("/api/logistics/transporters").then((r) => r.data),
  create: (data: { name: string; code: string; phone: string; email?: string }) =>
    api.post<Transporter>("/api/logistics/transporters", data).then((r) => r.data),
};

export const driverService = {
  list: () => api.get<{ total: number; content: Driver[] }>("/api/logistics/drivers").then((r) => r.data),
  get: (id: number) => api.get<Driver>(`/api/logistics/drivers/${id}`).then((r) => r.data),
  create: (data: { transporterId: number; name: string; licenseNumber: string; phone: string }) =>
    api.post<Driver>("/api/logistics/drivers", data).then((r) => r.data),
};

export const routeService = {
  list: () => api.get<{ total: number; content: Route[] }>("/api/logistics/routes").then((r) => r.data),
  get: (id: number) => api.get<Route>(`/api/logistics/routes/${id}`).then((r) => r.data),
  create: (data: { name: string; sourceLocationId: number; destinationLocationId: number; distanceKm?: number; expectedHours?: number }) =>
    api.post<Route>("/api/logistics/routes", data).then((r) => r.data),
};

export const shipmentService = {
  list: (page = 0, size = 20) =>
    api.get<{ total: number; content: Shipment[] }>("/api/logistics/shipments", { params: { page, size } }).then((r) => r.data),
  get: (id: number) => api.get<Shipment>(`/api/logistics/shipments/${id}`).then((r) => r.data),
  create: (data: { vehicleId?: number; transporterId?: number; origin: string; destination: string }) =>
    api.post<Shipment>("/api/logistics/shipments", data).then((r) => r.data),
  dispatch: (id: number) => api.post<Shipment>(`/api/logistics/shipments/${id}/dispatch`).then((r) => r.data),
  deliver: (id: number) => api.post<Shipment>(`/api/logistics/shipments/${id}/deliver`).then((r) => r.data),
};
