"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleService, transporterService, shipmentService, driverService, routeService } from "@/services/logistics.service";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/lib/api";

// ── Vehicles ──
export function useVehicles() {
  return useQuery({ queryKey: ["logistics", "vehicles"], queryFn: vehicleService.list });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehicleService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "vehicles"] }); toast.success("Vehicle registered"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Transporters ──
export function useTransporters() {
  return useQuery({ queryKey: ["logistics", "transporters"], queryFn: transporterService.list });
}

export function useCreateTransporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: transporterService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "transporters"] }); toast.success("Transporter added"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Shipments ──
export function useShipments(page = 0, size = 20) {
  return useQuery({ queryKey: ["logistics", "shipments", page, size], queryFn: () => shipmentService.list(page, size) });
}

export function useCreateShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipmentService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "shipments"] }); toast.success("Shipment created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useDispatchShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipmentService.depart,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "shipments"] }); toast.success("Shipment dispatched"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useCancelShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipmentService.cancel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "shipments"] }); toast.success("Shipment cancelled"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useShipmentEvents(id: number) {
  return useQuery({ queryKey: ["logistics", "shipments", id, "events"], queryFn: () => shipmentService.events(id), enabled: !!id });
}

export function useDeliverShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipmentService.deliver,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "shipments"] }); toast.success("Shipment delivered"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Drivers ──
export function useDrivers() {
  return useQuery({ queryKey: ["logistics", "drivers"], queryFn: driverService.list });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: driverService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "drivers"] }); toast.success("Driver added"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Routes ──
export function useRoutes() {
  return useQuery({ queryKey: ["logistics", "routes"], queryFn: routeService.list });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: routeService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "routes"] }); toast.success("Route created"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

// ── Update mutations ──
export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<import("@/services/logistics.service").Vehicle> }) => vehicleService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "vehicles"] }); toast.success("Vehicle updated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<import("@/services/logistics.service").Driver> }) => driverService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "drivers"] }); toast.success("Driver updated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateTransporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<import("@/services/logistics.service").Transporter> }) => transporterService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "transporters"] }); toast.success("Transporter updated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<import("@/services/logistics.service").Route> }) => routeService.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "routes"] }); toast.success("Route updated"); },
    onError: (e: unknown) => toast.error(getApiErrorMessage(e)),
  });
}
