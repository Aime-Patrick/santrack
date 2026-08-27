import axios from "axios";
import { clearAuthToken, getAuthToken } from "./auth";

// ---------------------------------------------------------------------------
// HTTP client — the single source for the backend URL
// ---------------------------------------------------------------------------

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081",
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      clearAuthToken();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Organization types
// ---------------------------------------------------------------------------

export type OrganizationType =
  | "MANUFACTURER"
  | "WAREHOUSE"
  | "DISTRIBUTOR"
  | "RETAILER"
  | "SHOP"
  | "REGULATOR"
  | "CONSUMER";

export interface OrganizationResponse {
  id: number;
  name: string;
  type: OrganizationType;
  tin?: string | null;
  registrationNumber?: string | null;
}

// ---------------------------------------------------------------------------
// User roles & capabilities (mirrors backend)
// ---------------------------------------------------------------------------

export type UserRole =
  | "SYSTEM_ADMIN"
  | "ORG_ADMIN"
  | "PRODUCTION_MANAGER"
  | "PRODUCTION_OFFICER"
  | "WAREHOUSE_MANAGER"
  | "WAREHOUSE_OFFICER"
  | "QUALITY_OFFICER"
  | "LOGISTICS_OFFICER"
  | "SALES_OFFICER"
  | "MANAGEMENT"
  | "AUDITOR";

/**
 * What a user may do. The names match the backend's Capability enum exactly,
 * because that is where they are decided.
 *
 * There is deliberately no role→capability table here any more. There used to
 * be one, hand-copied from the API, and it drifted: it was missing six
 * capabilities the backend had added, and it granted MANAGE_CATALOG holders
 * sight of the industry registry, which is why a production manager could open
 * a list of every company on the platform. The server now sends the caller's
 * resolved capability list with `/api/auth/me` and the UI reads that — see
 * `useCapabilities`. A list that cannot be recomputed here cannot disagree
 * with the guard that enforces it.
 */
export type Capability =
  | "REGISTER_IDENTITY"
  | "HANDLE_PACKAGING"
  | "MOVE_STOCK"
  | "SELL"
  | "APPLY_LIFECYCLE"
  | "MANAGE_RECALL"
  | "MANAGE_CATALOG"
  | "RUN_PRODUCTION"
  | "PERFORM_QC"
  | "MANAGE_LOGISTICS"
  | "MANAGE_CLIENTS"
  | "MANAGE_FINANCE"
  | "MANAGE_PAYROLL"
  | "VIEW_OPERATIONS"
  | "MANAGE_USERS"
  | "OVERSEE_INDUSTRIES"
  | "DECIDE_LICENCES"
  | "ADMINISTER_PLATFORM";

/** The reference table behind the Roles screen, served by the API. */
export interface CapabilityCatalogue {
  capabilities: {
    capability: Capability;
    description: string;
    /** True when the organization's standing grants it, not the job title. */
    conferredByStanding: boolean;
  }[];
  roles: { role: UserRole; capabilities: Capability[] }[];
  standing: { organizationType: OrganizationType; capabilities: Capability[] }[];
}

// ---------------------------------------------------------------------------
// Auth types
// ---------------------------------------------------------------------------

export interface UserResponse {
  id: number;
  email: string;
  fullName: string | null;
  role: UserRole;
  organization: OrganizationResponse | null;
  /** True until the user replaces an invite / admin-reset temporary password. */
  mustChangePassword: boolean;
  /**
   * Everything this person may do, resolved by the server from their role and
   * their organization's standing. The only thing the UI should gate on.
   */
  capabilities: Capability[];
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateOrganizationInput {
  name: string;
  type: OrganizationType;
  tin?: string;
  registrationNumber?: string;
}

// ---------------------------------------------------------------------------
// User management types
// ---------------------------------------------------------------------------

export interface CreateUserInput {
  email: string;
  /** Omit when generatePassword is true. */
  password?: string;
  generatePassword?: boolean;
  fullName?: string;
  organizationId: number;
  role: UserRole;
}

export interface CreateUserResponse extends UserResponse {
  /** Returned only when the server generated the temporary password. */
  temporaryPassword?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  organizationId?: number;
}

export interface ResetPasswordInput {
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ---------------------------------------------------------------------------
// Industry / License types
// ---------------------------------------------------------------------------

export type LicenseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REJECTED"
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "REVOKED";

export type LicensedActivity =
  | "MANUFACTURING"
  | "WAREHOUSING"
  | "DISTRIBUTION"
  | "RETAIL"
  | "REGULATION";

export interface LicenseCategory {
  id: number;
  code: string;
  name: string;
  activity: LicensedActivity;
  appliesTo: OrganizationType[];
  requiredDocuments: string[];
  permittedProductCategories: string[];
  validityMonths: number;
}

export interface License {
  id: number;
  licenseNumber: string;
  status: LicenseStatus;
  provisional: boolean;
  organizationId: number;
  organizationName: string;
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  activity: LicensedActivity;
  issuedByName: string | null;
  reviewedByName: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  statusReason: string | null;
  statusChangedAt: string | null;
}

export interface LicenseDocument {
  id: number;
  documentType: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface LicenseEvent {
  id: number;
  type: string;
  fromStatus: LicenseStatus | null;
  toStatus: LicenseStatus | null;
  actor: string | null;
  notes: string | null;
  recordedAt: string;
}

export interface ApplyLicenseInput {
  categoryId: number;
  notes?: string;
}

export interface LicenseDecision {
  decision: "APPROVE" | "REJECT";
  reason?: string;
  expiresOn?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extracts the backend's `message` from an axios error, with a fallback. */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (axios.isAxiosError(error)) {
    const message = (
      error.response?.data as { message?: string } | undefined
    )?.message;
    if (message) {
      return message;
    }
  }
  return fallback;
}
