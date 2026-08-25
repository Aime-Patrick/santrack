import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types — mirror `describe()` in the API's facility controller exactly
// ---------------------------------------------------------------------------

export interface Facility {
  id: number;
  name: string;
  /**
   * Server-minted, drawn from the shared `FAC-` counter, and immutable.
   *
   * It is printed on labels and scanned, so it is displayed and never offered
   * for editing — the API refuses the change anyway, and a form that pretends
   * otherwise is a form somebody will fill in.
   */
  code: string | null;
  address: string | null;
  active: boolean;
}

export interface CreateFacilityInput {
  name: string;
  address?: string;
}

/** Every field optional: a site was misnamed, it moved, or it has closed. */
export interface UpdateFacilityInput {
  name?: string;
  address?: string;
  active?: boolean;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const facilityService = {
  /** Your own sites. Another business's premises are not listed. */
  list(): Promise<Facility[]> {
    return api.get<Facility[]>("/api/facilities").then((r) => r.data);
  },

  create(input: CreateFacilityInput): Promise<Facility> {
    return api.post<Facility>("/api/facilities", input).then((r) => r.data);
  },

  update(id: number, input: UpdateFacilityInput): Promise<Facility> {
    return api.patch<Facility>(`/api/facilities/${id}`, input).then((r) => r.data);
  },
};
