import type { SelectOption } from "@/components/ui/resource-form-dialog";

/**
 * The vehicle types the API accepts.
 *
 * Mirrors `VehicleType` in the backend's logistics enums. A free-text box here
 * would be rejected on submit for anything outside this list, so the choice is
 * made where the user can see it rather than reported afterwards.
 */
export const VEHICLE_TYPES: SelectOption[] = [
  { value: "TRUCK", label: "Truck" },
  { value: "VAN", label: "Van" },
  { value: "TRAILER", label: "Trailer" },
  { value: "PICKUP", label: "Pickup" },
  { value: "MOTORCYCLE", label: "Motorcycle" },
  { value: "OTHER", label: "Other" },
];
