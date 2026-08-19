"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleService, transporterService, shipmentService } from "@/services/logistics.service";
import { toast } from "sonner";

// ── Vehicles ──
export function useVehicles() {
  return useQuery({ queryKey: ["logistics", "vehicles"], queryFn: vehicleService.list });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: vehicleService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "vehicles"] }); toast.success("Vehicle registered"); },
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
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
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDispatchShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipmentService.dispatch,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "shipments"] }); toast.success("Shipment dispatched"); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeliverShipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipmentService.deliver,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["logistics", "shipments"] }); toast.success("Shipment delivered"); },
    onError: (e: Error) => toast.error(e.message),
  });
}
