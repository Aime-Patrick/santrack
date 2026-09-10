import { api } from "@/lib/api";
import type {
  OpenConsultationInput,
  OrganizationDocument,
  PendingRegistration,
  RegistrationConsultation,
  RegistrationDecisionInput,
  RespondConsultationInput,
} from "@/lib/api";

export interface OnboardingPayload {
  name: string;
  type: string;
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
  ownership?: Array<{
    name: string;
    email?: string;
    phone?: string;
    percentage: number;
    idNumber?: string;
  }>;
}

export const onboardingService = {
  create: (data: OnboardingPayload) =>
    api.post("/api/organizations", data).then((r) => r.data),

  uploadDocument: (
    orgId: number,
    file: File,
    documentType: string,
    certificateNumber?: string,
    expiryDate?: string,
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    if (certificateNumber) formData.append("certificateNumber", certificateNumber);
    if (expiryDate) formData.append("expiryDate", expiryDate);
    return api
      .post(`/api/organizations/${orgId}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  // ── Regulator side: screening pending registrations ──

  pending(): Promise<PendingRegistration[]> {
    return api
      .get<PendingRegistration[]>("/api/organizations/pending")
      .then((r) => r.data);
  },

  decide(
    orgId: number,
    input: RegistrationDecisionInput,
  ): Promise<PendingRegistration> {
    return api
      .post<RegistrationDecisionInput, { data: PendingRegistration }>(
        `/api/organizations/${orgId}/decision`,
        input,
      )
      .then((r) => r.data);
  },

  documentsFor(orgId: number): Promise<OrganizationDocument[]> {
    return api
      .get<OrganizationDocument[]>(`/api/organizations/${orgId}/documents`)
      .then((r) => r.data);
  },

  /**
   * Applicant resubmits after CHANGES_REQUESTED. Status returns to PENDING
   * and the review note is cleared.
   */
  resubmit(orgId: number): Promise<void> {
    return api
      .post(`/api/organizations/${orgId}/resubmit`)
      .then(() => undefined);
  },

  // ── Regulator side: inter-authority consultations ──

  /** Primary authority opens a consultation to another authority. */
  openConsultation(
    orgId: number,
    input: OpenConsultationInput,
  ): Promise<RegistrationConsultation> {
    return api
      .post<OpenConsultationInput, { data: RegistrationConsultation }>(
        `/api/organizations/${orgId}/consultations`,
        input,
      )
      .then((r) => r.data);
  },

  /** List all consultations opened by the caller's authority on this application. */
  consultationsFor(orgId: number): Promise<RegistrationConsultation[]> {
    return api
      .get<RegistrationConsultation[]>(`/api/organizations/${orgId}/consultations`)
      .then((r) => r.data);
  },

  /** Primary authority cancels a pending consultation. */
  cancelConsultation(
    orgId: number,
    consultationId: number,
  ): Promise<RegistrationConsultation> {
    return api
      .post<never, { data: RegistrationConsultation }>(
        `/api/organizations/${orgId}/consultations/${consultationId}/cancel`,
      )
      .then((r) => r.data);
  },

  /** Secondary authority inbox — PENDING/OVERDUE consultations addressed to them. */
  incomingConsultations(): Promise<RegistrationConsultation[]> {
    return api
      .get<RegistrationConsultation[]>(
        `/api/regulator/registration-consultations/incoming`,
      )
      .then((r) => r.data);
  },

  /** Secondary authority responds with their advisory verdict. */
  respondConsultation(
    consultationId: number,
    input: RespondConsultationInput,
  ): Promise<RegistrationConsultation> {
    return api
      .post<RespondConsultationInput, { data: RegistrationConsultation }>(
        `/api/regulator/registration-consultations/${consultationId}/respond`,
        input,
      )
      .then((r) => r.data);
  },
};
