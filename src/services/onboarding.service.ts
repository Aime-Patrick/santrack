import { api } from "@/lib/api";
import type {
  OrganizationDocument,
  PendingRegistration,
  RegistrationDecisionInput,
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
};
