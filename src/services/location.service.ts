import { api } from "@/lib/api";

export interface Location {
  id: number;
  name: string;
  type: string;
  address: string | null;
  active: boolean;
  organizationId: number;
}

export interface CreateLocationInput {
  name: string;
  type: string;
  address?: string;
}

export const locationService = {
  list(): Promise<Location[]> {
    return api.get<Location[]>("/api/locations").then((r) => r.data);
  },

  create(input: CreateLocationInput): Promise<Location> {
    return api.post<Location>("/api/locations", input).then((r) => r.data);
  },

  update(id: number, input: CreateLocationInput): Promise<Location> {
    return api.put<Location>(`/api/locations/${id}`, input).then((r) => r.data);
  },
};
