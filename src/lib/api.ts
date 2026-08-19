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
    if (error.response?.status === 401) {
      clearAuthToken();
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

export type Capability =
  | "REGISTER_IDENTITY"
  | "HANDLE_PACKAGING"
  | "MOVE_STOCK"
  | "SELL"
  | "APPLY_LIFECYCLE"
  | "MANAGE_RECALL"
  | "MANAGE_CATALOG"
  | "VIEW_OPERATIONS"
  | "MANAGE_USERS"
  | "ADMINISTER_PLATFORM";

/** Capability set per role — mirrors the backend ROLE_CAPABILITIES table. */
export const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  SYSTEM_ADMIN: [
    "REGISTER_IDENTITY", "HANDLE_PACKAGING", "MOVE_STOCK", "SELL",
    "APPLY_LIFECYCLE", "MANAGE_RECALL", "MANAGE_CATALOG",
    "VIEW_OPERATIONS", "MANAGE_USERS", "ADMINISTER_PLATFORM",
  ],
  ORG_ADMIN: [
    "REGISTER_IDENTITY", "HANDLE_PACKAGING", "MOVE_STOCK", "SELL",
    "APPLY_LIFECYCLE", "MANAGE_RECALL", "MANAGE_CATALOG",
    "VIEW_OPERATIONS", "MANAGE_USERS",
  ],
  PRODUCTION_MANAGER: ["REGISTER_IDENTITY", "HANDLE_PACKAGING", "MANAGE_CATALOG", "VIEW_OPERATIONS"],
  PRODUCTION_OFFICER: ["REGISTER_IDENTITY", "HANDLE_PACKAGING", "VIEW_OPERATIONS"],
  WAREHOUSE_MANAGER: ["HANDLE_PACKAGING", "MOVE_STOCK", "APPLY_LIFECYCLE", "VIEW_OPERATIONS"],
  WAREHOUSE_OFFICER: ["HANDLE_PACKAGING", "MOVE_STOCK", "VIEW_OPERATIONS"],
  QUALITY_OFFICER: ["APPLY_LIFECYCLE", "MANAGE_RECALL", "VIEW_OPERATIONS"],
  LOGISTICS_OFFICER: ["MOVE_STOCK", "VIEW_OPERATIONS"],
  SALES_OFFICER: ["SELL", "MOVE_STOCK", "VIEW_OPERATIONS"],
  MANAGEMENT: ["VIEW_OPERATIONS"],
  AUDITOR: ["VIEW_OPERATIONS"],
};

/** Check if a role holds a capability. */
export function can(role: UserRole, capability: Capability): boolean {
  if (role === "SYSTEM_ADMIN") return true;
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

// ---------------------------------------------------------------------------
// Auth types
// ---------------------------------------------------------------------------

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  organization: OrganizationResponse | null;
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
}

// ---------------------------------------------------------------------------
// User management types
// ---------------------------------------------------------------------------

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  organizationId: number;
  role: UserRole;
}

export interface UpdateUserInput {
  fullName?: string;
  role?: UserRole;
  organizationId?: number;
}

export interface ResetPasswordInput {
  password: string;
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
