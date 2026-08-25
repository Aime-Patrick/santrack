import { api } from "@/lib/api";

export interface Vehicle {
  id: number;
  transporterId: number;
  transporterName: string | null;
  /**
   * The plate. Named `registrationNumber` because that is what the API
   * returns — this interface said `plateNumber`, so the column bound to it
   * rendered blank for every vehicle ever registered.
   */
  registrationNumber: string;
  type: string | null;
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

/**
 * A shipment carries one dispatched transfer. Origin and destination are not
 * fields on it — they come from the transfer, which is why this now mirrors
 * what the API actually returns instead of two strings nobody ever sent.
 */
export interface Shipment {
  id: number;
  shipmentNumber: string;
  status: string;
  transferId: number;
  transferReference: string | null;
  transporterId: number;
  transporterName: string | null;
  vehicleId: number | null;
  vehicleRegistration: string | null;
  driverId: number | null;
  driverName: string | null;
  routeId: number | null;
  routeName: string | null;
  destinationOrganizationId: number | null;
  destinationOrganizationName: string | null;
  scheduledDepartureOn: string | null;
  scheduledDeliveryOn: string | null;
  departedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
}

export interface ShipmentEvent {
  id: number;
  shipmentId: number;
  type: string;
  notes: string;
  actorName: string | null;
  recordedAt: string;
}

export const vehicleService = {
  list: () => api.get<{ total: number; content: Vehicle[] }>("/api/logistics/vehicles").then((r) => r.data),
  get: (id: number) => api.get<Vehicle>(`/api/logistics/vehicles/${id}`).then((r) => r.data),
  /**
   * A vehicle belongs to a transporter — the API requires one, and the field
   * is `registrationNumber`, not `plateNumber`. Both were wrong here, so every
   * submission was refused before it reached the service.
   */
  create: (data: {
    transporterId: number;
    registrationNumber: string;
    type?: string;
    capacity?: number;
  }) =>
    api.post<Vehicle>("/api/logistics/vehicles", data).then((r) => r.data),
  update: (id: number, data: Partial<Vehicle>) => api.patch<Vehicle>(`/api/logistics/vehicles/${id}`, data).then((r) => r.data),
};

export const transporterService = {
  list: () => api.get<{ total: number; content: Transporter[] }>("/api/logistics/transporters").then((r) => r.data),
  create: (data: { name: string; code: string; phone: string; email?: string }) =>
    api.post<Transporter>("/api/logistics/transporters", data).then((r) => r.data),
  update: (id: number, data: Partial<Transporter>) => api.patch<Transporter>(`/api/logistics/transporters/${id}`, data).then((r) => r.data),
};

export const driverService = {
  list: () => api.get<{ total: number; content: Driver[] }>("/api/logistics/drivers").then((r) => r.data),
  get: (id: number) => api.get<Driver>(`/api/logistics/drivers/${id}`).then((r) => r.data),
  create: (data: { transporterId: number; name: string; licenseNumber: string; phone: string }) =>
    api.post<Driver>("/api/logistics/drivers", data).then((r) => r.data),
  update: (id: number, data: Partial<Driver>) => api.patch<Driver>(`/api/logistics/drivers/${id}`, data).then((r) => r.data),
};

export const routeService = {
  list: () => api.get<{ total: number; content: Route[] }>("/api/logistics/routes").then((r) => r.data),
  get: (id: number) => api.get<Route>(`/api/logistics/routes/${id}`).then((r) => r.data),
  create: (data: { name: string; sourceLocationId: number; destinationLocationId: number; distanceKm?: number; expectedHours?: number }) =>
    api.post<Route>("/api/logistics/routes", data).then((r) => r.data),
  update: (id: number, data: Partial<Route>) => api.patch<Route>(`/api/logistics/routes/${id}`, data).then((r) => r.data),
};

export const shipmentService = {
  list: (page = 0, size = 20) =>
    api.get<{ total: number; content: Shipment[] }>("/api/logistics/shipments", { params: { page, size } }).then((r) => r.data),
  get: (id: number) => api.get<Shipment>(`/api/logistics/shipments/${id}`).then((r) => r.data),
  /**
   * A shipment carries a dispatched transfer; it is not a free-text journey.
   * The origin and destination come from the transfer itself, which is why the
   * API asks for `transferId` rather than two strings.
   */
  create: (data: {
    transferId: number;
    transporterId: number;
    vehicleId?: number;
    driverId?: number;
    routeId?: number;
    scheduledDepartureOn?: string;
  }) =>
    api.post<Shipment>("/api/logistics/shipments", data).then((r) => r.data),
  depart: (id: number) => api.post<Shipment>(`/api/logistics/shipments/${id}/depart`).then((r) => r.data),
  deliver: (id: number) => api.post<Shipment>(`/api/logistics/shipments/${id}/deliver`).then((r) => r.data),
  events: (id: number) => api.get<ShipmentEvent[]>(`/api/logistics/shipments/${id}/events`).then((r) => r.data),
  cancel: (id: number) => api.post<Shipment>(`/api/logistics/shipments/${id}/cancel`).then((r) => r.data),
};
