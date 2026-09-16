import axios from "axios";
import { clearAuthToken, getAuthToken } from "./auth";

// ---------------------------------------------------------------------------
// HTTP client — the single source for the backend URL
// ---------------------------------------------------------------------------

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081",
  withCredentials: true,
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
    // A 401 on a request that presented a session means the session expired —
    // clear it and send the user back to login. A 401 on an anonymous request
    // (e.g. wrong password on /api/auth/login) is a form error, not a dead
    // session: redirecting there would hard-reload the page and wipe the
    // inline error the caller is about to render.
    const url = String(error.config?.url ?? "");
    const isAuthAttempt =
      /\/api\/auth\/(login|register|forgot-password|reset-password|mfa\/verify-login)/.test(
        url,
      );
    const hadSession =
      Boolean(error.config?.headers?.Authorization) || Boolean(getAuthToken());
    if (
      error.response?.status === 401 &&
      hadSession &&
      !isAuthAttempt &&
      typeof window !== "undefined"
    ) {
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

export type OnboardingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED"
  | "UNDER_CONSULTATION";

export type IndustrySector =
  | "FOOD_AND_BEVERAGE"
  | "PHARMACEUTICALS"
  | "COSMETICS"
  | "MINING_AND_MINERALS"
  | "AGRICULTURE_AND_EXPORTS"
  | "GENERAL_MANUFACTURING"
  | "DISTRIBUTION"
  | "RETAIL"
  | "OTHER";

export interface OrganizationResponse {
  id: number;
  name: string;
  type: OrganizationType;
  tin?: string | null;
  registrationNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  licenseType?: string | null;
  dateIncorporated?: string | null;
  description?: string | null;
  province?: string | null;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
  industrySector?: IndustrySector | null;
  onboardingStatus?: OnboardingStatus;
  rejectionReason?: string | null;
  /** Regulator's note when CHANGES_REQUESTED — shown to the applicant. */
  reviewNote?: string | null;
  createdAt?: string;
}

export interface OrganizationOwnerResponse {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  percentage: number;
  idNumber?: string | null;
}

export interface OrganizationDocument {
  id: number;
  documentType: string;
  certificateNumber?: string | null;
  expiryDate?: string | null;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

// ---------------------------------------------------------------------------
// User roles & capabilities ("mirrors backend")
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
 * be one, "hand-copied from the API", and it drifted: it was missing six
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
  | "ADMINISTER_PLATFORM"
  | "MANAGE_INDUSTRIES"
  | "READ_AUDIT"
  | "PRINT_LABELS"
  | "PUBLISH_ANNOUNCEMENT";

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
  mfaEnabled: boolean;
  /** True for system admins / regulator staff until TOTP is enrolled. */
  mustEnableMfa: boolean;
  /** Local DiceBear ref (`dicebear:style:seed`) when set. */
  avatarUrl: string | null;
  /** True when a custom upload is stored (fetch via /api/auth/me/avatar). */
  avatarUploaded: boolean;
  /**
   * Everything this person may do, resolved by the server from their role and
   * their organization's standing. The only thing the UI should gate on.
   */
  capabilities: Capability[];
  /**
   * Capabilities the platform operator granted this individual user on top of
   * role and standing (e.g. MANAGE_INDUSTRIES). Only present on user records,
   * not on the /me payload.
   */
  extraCapabilities?: Capability[];
}

export interface AuthResponse {
  token: string;
  user: UserResponse;
}

export interface MfaChallengeResponse {
  mfaRequired: true;
  mfaToken: string;
}

export type LoginResponse = AuthResponse | MfaChallengeResponse;

export interface RegisterInput {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface OrganizationOwnerInput {
  name: string;
  email?: string;
  phone?: string;
  percentage: number;
  idNumber?: string;
}

export interface CreateOrganizationInput {
  name: string;
  type: OrganizationType;
  tin?: string;
  registrationNumber?: string;
  email?: string;
  phone?: string;
  licenseType?: string;
  dateIncorporated?: string;
  description?: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  industrySector?: IndustrySector;
  ownership?: OrganizationOwnerInput[];
}

export interface RegistrationDecisionInput {
  decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT";
  reason?: string;
}

export interface PendingRegistration extends OrganizationResponse {
  ownership?: OrganizationOwnerResponse[];
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

export interface SetUserCapabilitiesInput {
  capabilities: Capability[];
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
  | "CHANGES_REQUESTED"
  | "REJECTED"
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "REVOKED"
  | "CANCELLED";

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
  active?: boolean;
}

export interface CreateLicenseCategoryInput {
  code: string;
  name: string;
  activity: LicensedActivity;
  appliesTo: OrganizationType[];
  permittedProductCategories?: string[];
  requiredDocuments?: string[];
  validityMonths?: number;
  active?: boolean;
}

export interface UpdateLicenseCategoryInput {
  name?: string;
  activity?: LicensedActivity;
  appliesTo?: OrganizationType[];
  permittedProductCategories?: string[];
  requiredDocuments?: string[];
  validityMonths?: number;
  active?: boolean;
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
  facilityId?: number | null;
  facilityName?: string | null;
  grain?: string;
  premiseMetadata?: Record<string, any> | null;
  issuedByName: string | null;
  reviewedByName: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  statusReason: string | null;
  statusChangedAt: string | null;
  previousLicenseId?: number | null;
}

export type LicenseFollowUpStatus = 'OPEN' | 'ACTIONED' | 'CLOSED';
export type LicenseFollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface LicenseFollowUp {
  id: number;
  licenseId: number;
  title: string;
  description: string;
  priority: LicenseFollowUpPriority;
  status: LicenseFollowUpStatus;
  dueDate?: string | null;
  createdBy?: { id: number; fullName: string; email?: string } | null;
  businessResponse?: string | null;
  evidenceAttachmentKey?: string | null;
  evidenceFilename?: string | null;
  actionedBy?: { id: number; fullName: string; email?: string } | null;
  actionedAt?: string | null;
  closureNotes?: string | null;
  closedBy?: { id: number; fullName: string; email?: string } | null;
  closedAt?: string | null;
  responseToken?: string | null;
  responseTokenExpiresAt?: string | null;
  responseTokenUsed?: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface SendFollowUpLinkInput {
  expiryDays?: number;
}

export interface PublicFollowUpView {
  id: number;
  licenseNumber: string;
  organizationName: string;
  title: string;
  description: string;
  priority: LicenseFollowUpPriority;
  dueDate?: string | null;
  status: LicenseFollowUpStatus;
  readOnly: boolean;
  businessResponse?: string | null;
  evidenceFilename?: string | null;
  actionedAt?: string | null;
  responseTokenExpiresAt?: string | null;
}

export interface CreateFollowUpInput {
  title: string;
  description: string;
  priority?: LicenseFollowUpPriority;
  dueDate?: string;
}

export interface ActionFollowUpInput {
  businessResponse: string;
  evidenceAttachmentKey?: string;
  evidenceFilename?: string;
}

export interface CloseFollowUpInput {
  closureNotes?: string;
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
  facilityId?: number;
  notes?: string;
  premiseMetadata?: Record<string, any>;
  facilityDetails?: {
    name: string;
    province?: string;
    district?: string;
    sector?: string;
    cell?: string;
    village?: string;
    businessCenter?: string;
    gpsCoordinates?: { lat: number; lng: number };
    landUpi?: string;
    ownershipType?: string;
    leaseContractExpiry?: string;
  };
}

export interface LicenseDecision {
  decision: "APPROVE" | "REQUEST_CHANGES" | "REJECT";
  reason?: string;
  expiresOn?: string;
}

// ---------------------------------------------------------------------------
// Product Registration types
// ---------------------------------------------------------------------------

export type ProductRegistrationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "EXPIRED"
  | "CANCELLED";

export interface ProductRegistration {
  id: number;
  registrationNumber: string;
  productName: string;
  brandName?: string | null;
  intendedUse?: string | null;
  targetConsumer?: string | null;
  ingredients?: Array<{ name: string; percentage?: number; purpose?: string }>;
  netContents?: string[];
  shelfLifeMonths?: number | null;
  storageConditions?: string | null;
  rsbStandardNumber?: string | null;
  status: ProductRegistrationStatus;
  statusReason?: string | null;
  statusChangedAt?: string | null;
  facilityId?: number | null;
  facility?: { id: number; name: string; district?: string } | null;
  categoryId?: number | null;
  category?: { id: number; name: string; code: string } | null;
  productId?: number | null;
  organizationId?: number;
  organization?: { id: number; name: string } | null;
  organizationName?: string | null;
  issuedByName?: string | null;
  reviewedByName?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductRegistrationDocument {
  id: number;
  documentType: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface ProductRegistrationEvent {
  id: number;
  type: string;
  fromStatus: ProductRegistrationStatus | null;
  toStatus: ProductRegistrationStatus | null;
  actor?: { fullName?: string; email?: string } | null;
  notes?: string | null;
  recordedAt: string;
}

export interface ApplyProductRegistrationInput {
  productName: string;
  brandName?: string;
  facilityId?: number;
  productId?: number;
  categoryId?: number;
  intendedUse?: string;
  targetConsumer?: string;
  ingredients?: Array<{ name: string; percentage?: number; purpose?: string }>;
  netContents?: string[];
  shelfLifeMonths?: number;
  storageConditions?: string;
  rsbStandardNumber?: string;
}

// ---------------------------------------------------------------------------
// Registration consultation types
// ---------------------------------------------------------------------------

export type ConsultationStatus =
  | "PENDING"
  | "RESPONDED"
  | "CANCELLED"
  | "OVERDUE";

export type ConsultationVerdict = "APPROVED" | "CONCERNS" | "OBJECTION";

export interface ConsultationAuthority {
  id: number;
  code: string;
  name: string;
}

export interface ConsultationActor {
  id: number;
  fullName: string | null;
  email: string;
}

export interface RegistrationConsultation {
  id: number;
  subject: string;
  contextNote: string | null;
  forwardedDocumentIds: number[];
  status: ConsultationStatus;
  verdict: ConsultationVerdict | null;
  responseNote: string | null;
  dueDate: string | null;
  createdAt: string;
  respondedAt: string | null;
  fromAuthority: ConsultationAuthority | null;
  toAuthority: ConsultationAuthority | null;
  organization: { id: number; name: string; type: string } | null;
  createdBy: ConsultationActor | null;
  respondedBy: ConsultationActor | null;
  /** Computed by the API — true when past dueDate with no response. */
  overdue?: boolean;
}

export interface OpenConsultationInput {
  toAuthorityId: number;
  subject: string;
  contextNote?: string;
  forwardedDocumentIds?: number[];
  dueDate?: string;
}

export interface RespondConsultationInput {
  verdict: ConsultationVerdict;
  responseNote?: string;
}

// ---------------------------------------------------------------------------
// Registration Info Request
// ---------------------------------------------------------------------------

export type InfoRequestStatus = 'PENDING' | 'RESPONDED' | 'EXPIRED' | 'SUPERSEDED';

export interface InfoRequestField {
  key: string;
  label: string;
  type: 'text' | 'file';
  required: boolean;
}

export interface RegistrationInfoRequest {
  id: number;
  organizationId: number;
  token: string;
  requestMessage: string;
  requestedFields: InfoRequestField[];
  expiresAt: string;
  status: InfoRequestStatus;
  respondedAt: string | null;
  createdAt: string;
  /** Applicant's field responses (HTML), when status is RESPONDED */
  responseData?: Record<string, string> | null;
  /** Filename of uploaded attachment, if any */
  responseAttachmentFilename?: string | null;
}

/** The data returned by the public GET /api/public/registration-response/:token */
export interface PublicInfoRequestView {
  id: number;
  organizationName: string;
  requestMessage: string;
  requestedFields: InfoRequestField[];
  expiresAt: string;
  status: InfoRequestStatus;
  /** True when already responded — page renders in read-only mode */
  readOnly: boolean;
  /** Previously submitted text responses (key → HTML value) */
  responseData: Record<string, string> | null;
  /** Filename of the uploaded attachment, if any */
  responseAttachmentFilename: string | null;
  /** When the applicant responded */
  respondedAt: string | null;
}

export interface CreateInfoRequestInput {
  requestMessage: string;
  requestedFields?: InfoRequestField[];
  expiryDays?: number;
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
