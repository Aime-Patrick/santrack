import {
  api,
  type OrganizationResponse,
  type OrganizationType,
  type CreateOrganizationInput,
} from "@/lib/api";

/**
 * The five kinds of business an account can declare itself to be.
 *
 * A regulator is not one of them — it is an authority the platform grants, not
 * a trade. Anywhere the question is "which business?", ask for these; the
 * unfiltered list also carries oversight bodies, which is how a page about
 * regulators ended up listing every shop on the platform.
 */
export const TRADE_TYPES: OrganizationType[] = [
  "MANUFACTURER",
  "WAREHOUSE",
  "DISTRIBUTOR",
  "RETAILER",
  "SHOP",
];

/** A regulator plus how many people staff it. */
export interface RegulatorResponse extends OrganizationResponse {
  staff: number;
  createdAt: string;
}

/** One business as the industry register reports it. */
export interface RegistryEntry extends OrganizationResponse {
  createdAt: string;
  staff: number;
  products: number;
  licenses: {
    licenseNumber: string;
    activity: string;
    status: string;
    expiresOn: string | null;
  }[];
}

export const organizationService = {
  create(input: CreateOrganizationInput): Promise<OrganizationResponse> {
    return api.post<OrganizationResponse>("/api/organizations", input).then((r) => r.data);
  },

  /** Pass `types` to narrow the directory; omit it for every organization. */
  list(types?: OrganizationType[]): Promise<OrganizationResponse[]> {
    const params = types && types.length > 0 ? { type: types.join(",") } : undefined;
    return api
      .get<OrganizationResponse[]>("/api/organizations", { params })
      .then((r) => r.data);
  },

  /**
   * The industry register: every business with its staff, catalogue size and
   * licence standing.
   *
   * A different question from `list`, and a different permission. That one
   * answers "who can I dispatch to?" and every signed-in user needs it; this
   * one is supervisory and belongs to the licensing authorities and the
   * platform operator. Building the Industries screen out of the trading
   * partner directory is what made it visible to everybody.
   */
  registry(): Promise<RegistryEntry[]> {
    return api.get<RegistryEntry[]>("/api/organizations/registry").then((r) => r.data);
  },

  /** Corrects a registry entry. Platform operators only. */
  amend(
    organizationId: number,
    input: {
      name?: string;
      type?: OrganizationType;
      tin?: string;
      registrationNumber?: string;
    },
  ): Promise<OrganizationResponse> {
    return api
      .put<OrganizationResponse>(`/api/organizations/${organizationId}`, input)
      .then((r) => r.data);
  },

  /** The oversight bodies, with staff counts. Platform operators only. */
  listRegulators(): Promise<RegulatorResponse[]> {
    return api
      .get<RegulatorResponse[]>("/api/organizations/regulators")
      .then((r) => r.data);
  },

  /** Registers an oversight body. The caller does not join it. */
  registerRegulator(name: string): Promise<OrganizationResponse> {
    return api
      .post<OrganizationResponse>("/api/organizations/regulators", { name })
      .then((r) => r.data);
  },

  /** Promotes an existing organization to a regulator. */
  grantStanding(organizationId: number): Promise<OrganizationResponse> {
    return api
      .put<OrganizationResponse>(`/api/organizations/${organizationId}/regulatory-standing`, {
        type: "REGULATOR",
      })
      .then((r) => r.data);
  },

  /**
   * Withdraws standing. `revertTo` is required — standing is the
   * organization's type, so something has to replace it, and only the operator
   * knows what this body is once it stops being an authority.
   */
  revokeStanding(
    organizationId: number,
    input: { revertTo: OrganizationType; reason: string },
  ): Promise<OrganizationResponse> {
    return api
      .delete<OrganizationResponse>(
        `/api/organizations/${organizationId}/regulatory-standing`,
        { data: input },
      )
      .then((r) => r.data);
  },

  /**
   * Permanently removes an organization. SYSTEM_ADMIN only.
   * The API returns 204 No Content on success.
   */
  purge(organizationId: number): Promise<void> {
    return api
      .delete(`/api/organizations/${organizationId}`)
      .then(() => undefined);
  },
};
